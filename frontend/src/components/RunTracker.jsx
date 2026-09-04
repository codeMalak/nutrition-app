import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { api } from "../api";
import {
  Play, Pause, Square, Footprints, Trophy, Gauge, Flame, Navigation,
  Pencil, Trash2, X, Check, Plus, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  haversineMeters, unitToMeters, mpsToUnitSpeed, elevToUnit,
  elevUnitLabel, unitLabel, formatDistance, formatDuration, formatPace,
  paceSecondsPerUnit, estimateCalories, gpsQualityLabel, simplifyRoute,
  MAX_ACCURACY_M, MAX_PLAUSIBLE_SPEED_MPS, MIN_DISTANCE_DELTA_M,
  MAX_POSITION_AGE_MS, MIN_PACE_DISTANCE_M, MILE_METERS, KM_METERS,
} from "../utils/runTracking";

// Leaflet is a meaningful chunk of JS — only load it once a map is actually shown.
const RouteMap = lazy(() => import("./RouteMap"));
const mapFallback = (heightClass) => (
  <div className={`w-full ${heightClass} rounded-xl bg-slate-100 dark:bg-slate-700/40 animate-pulse`} />
);

const getToday = () => new Date().toLocaleDateString("en-CA");

const toLbs = (kg) => kg * 2.20462;

function freshTrack() {
  return {
    watchId: null,
    startTime: null,
    pausedMs: 0,    // total ms spent in manual pauses so far
    pausedAt: null, // Date.now() when the current pause began (null if not paused)
    points: [],
    lastPoint: null,
    anchorPoint: null, // floating reference point used to confirm real movement — see handlePosition
    distanceM: 0,
    elevGainM: 0,
    elevLossM: 0,
    smoothedElev: null,
    lastSmoothedElev: null,
    hasElevation: false,
    maxSpeedMps: 0,
    curSpeedMps: 0,
    nextMileBoundary: MILE_METERS,
    nextKmBoundary: KM_METERS,
    lastMileSplitMs: 0,
    lastKmSplitMs: 0,
    mileSplits: [],
    kmSplits: [],
  };
}

// True wall-clock elapsed time since Start, minus time spent in manual
// pauses — a real stopwatch, completely decoupled from GPS sample timing.
function getElapsedMs(t, now = Date.now()) {
  if (!t.startTime) return 0;
  const pausedMs = t.pausedMs + (t.pausedAt != null ? now - t.pausedAt : 0);
  return Math.max(0, now - t.startTime - pausedMs);
}

const freshLiveStats = {
  distanceM: 0, movingMs: 0, elevGainM: 0, elevLossM: 0, maxSpeedMps: 0,
  curSpeedMps: 0, hasElevation: false, accuracy: null, route: [],
};

const inputCls =
  "w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

function StatTile({ label, value, sub, bg, text, subText }) {
  return (
    <div className={`${bg} rounded-2xl p-3 text-center transition-colors duration-200`}>
      <p className={`text-lg font-bold ${text}`}>{value}</p>
      <p className={`text-[11px] mt-0.5 ${subText || "text-slate-400 dark:text-slate-500"}`}>{label}</p>
      {sub && <p className={`text-[10px] mt-0.5 ${subText || "text-slate-400 dark:text-slate-500"}`}>{sub}</p>}
    </div>
  );
}

export default function RunTracker({ darkMode }) {
  const [unit, setUnit] = useState(() => localStorage.getItem("run_unit") || "mi");
  const [status, setStatus] = useState("idle"); // idle | active | paused | review
  const [liveStats, setLiveStats] = useState(freshLiveStats);
  const [gpsError, setGpsError] = useState("");
  const [reviewData, setReviewData] = useState(null);
  const [runs, setRuns] = useState([]);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    date: getToday(), distance: "", hours: "", minutes: "", seconds: "", title: "", note: "",
  });
  const [manualError, setManualError] = useState("");
  const [editingRun, setEditingRun] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [weightLbs, setWeightLbs] = useState(154);

  const trackRef = useRef(freshTrack());
  const statusRef = useRef(status);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { localStorage.setItem("run_unit", unit); }, [unit]);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchRuns = useCallback(async () => {
    try {
      const res = await api.getRunEntries();
      setRuns(res.data);
    } catch (err) {
      console.error("fetchRuns error:", err);
    }
  }, []);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getWeightEntries();
        if (res.data?.length) {
          const last = res.data[res.data.length - 1];
          setWeightLbs(last.unit === "kg" ? toLbs(last.weight) : last.weight);
        }
      } catch {
        // no weight logged yet — fall back to the default estimate weight
      }
    })();
  }, []);

  // ── GPS tracking ───────────────────────────────────────────────────────────

  const handleGeoError = (err) => {
    const messages = {
      1: "Location permission denied. Enable location access for this app to track runs.",
      2: "Can't get a GPS fix. Move somewhere with clearer sky view.",
      3: "Location request timed out — retrying…",
    };
    setGpsError(messages[err.code] || "Location error. Please try again.");
  };

  const handlePosition = (pos) => {
    const { latitude, longitude, altitude, accuracy, speed } = pos.coords;
    // Always use wall-clock time at the moment this callback actually fires —
    // NOT pos.timestamp. Phones/browsers frequently hand back a stale cached
    // "last known location" for the first fix or two before a live GPS lock;
    // a stale timestamp would make distance/elevation deltas computed
    // against it unreliable. (The run's own timer no longer depends on any
    // of this at all — see getElapsedMs, a plain wall-clock stopwatch.)
    const now = Date.now();
    const t = trackRef.current;

    setGpsError("");
    setLiveStats((s) => ({ ...s, accuracy }));

    if (accuracy != null && accuracy > MAX_ACCURACY_M) return; // low-quality fix
    // Extra defense against the same stale-cached-fix problem: if the OS/browser
    // is still handing back a "last known location" from a while ago, don't
    // trust it as a live reference point at all.
    if (pos.timestamp && now - pos.timestamp > MAX_POSITION_AGE_MS) return;

    const point = { lat: latitude, lng: longitude, elevation: altitude, t: now, accuracy };

    if (statusRef.current !== "active") {
      // Manually paused (or not yet started) — keep the reference point
      // fresh so resuming doesn't create a fake distance jump, but don't
      // accumulate anything.
      t.lastPoint = point;
      return;
    }

    if (!t.lastPoint) {
      t.lastPoint = point;
      t.anchorPoint = point;
      t.points.push(point);
      return;
    }

    const dt = (now - t.lastPoint.t) / 1000;
    if (dt <= 0) { t.lastPoint = point; return; }
    const dM = haversineMeters(t.lastPoint.lat, t.lastPoint.lng, latitude, longitude);
    const impliedSpeed = dM / dt;
    if (impliedSpeed > MAX_PLAUSIBLE_SPEED_MPS) { t.lastPoint = point; return; } // GPS jump artifact

    // The device's own (Doppler-derived) speed reading, when the browser
    // provides one, is purely informational here (current/max speed
    // display) — it does NOT gate whether distance gets recorded. Relying
    // on it for that turned out to be exactly the remaining bug: a real
    // device can correctly report "moving" while the two raw position fixes
    // sampled around it are still noisy/lagging (especially in the first
    // few seconds of a run, while GPS accuracy is still refining), crediting
    // a full second of time against a tiny mismatched distance and
    // producing an absurd pace. So distance is decided by ONE consistent
    // signal instead — see the anchor logic below.
    const curSpeed = speed != null && speed >= 0 ? speed : impliedSpeed;
    t.curSpeedMps = curSpeed;
    if (curSpeed > t.maxSpeedMps) t.maxSpeedMps = curSpeed;

    // Only cumulative displacement from a floating anchor point counts as
    // real, recordable movement. Comparing every sample only to the
    // immediately-previous one is noise-prone (typical phone GPS accuracy is
    // several meters, so a couple of meters of pure jitter over ~1s can look
    // like plausible movement) — measuring from a fixed anchor instead means
    // jitter around one spot never accumulates (it never drifts far enough
    // from the anchor to clear the floor), while genuine movement, however
    // slow, still registers within a couple of seconds once it does.
    if (!t.anchorPoint) t.anchorPoint = t.lastPoint;
    const dMFromAnchor = haversineMeters(t.anchorPoint.lat, t.anchorPoint.lng, latitude, longitude);

    if (dMFromAnchor >= MIN_DISTANCE_DELTA_M) {
      t.distanceM += dMFromAnchor;
      t.points.push(point);

      if (altitude != null) {
        t.hasElevation = true;
        t.smoothedElev = t.smoothedElev == null ? altitude : t.smoothedElev * 0.8 + altitude * 0.2;
        if (t.lastSmoothedElev != null) {
          const de = t.smoothedElev - t.lastSmoothedElev;
          if (de > 0.5) t.elevGainM += de;
          else if (de < -0.5) t.elevLossM += -de;
        }
        t.lastSmoothedElev = t.smoothedElev;
      }

      const elapsedMs = getElapsedMs(t, now);
      while (t.distanceM >= t.nextMileBoundary) {
        t.mileSplits.push({ index: t.mileSplits.length + 1, duration: (elapsedMs - t.lastMileSplitMs) / 1000 });
        t.lastMileSplitMs = elapsedMs;
        t.nextMileBoundary += MILE_METERS;
      }
      while (t.distanceM >= t.nextKmBoundary) {
        t.kmSplits.push({ index: t.kmSplits.length + 1, duration: (elapsedMs - t.lastKmSplitMs) / 1000 });
        t.lastKmSplitMs = elapsedMs;
        t.nextKmBoundary += KM_METERS;
      }

      t.anchorPoint = point; // confirmed movement — reset the anchor here
    }
    // else: leave the anchor in place so displacement keeps accumulating
    // across future samples instead of resetting every time.

    t.lastPoint = point;
  };

  const startWatch = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation isn't supported on this device/browser.");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(handlePosition, handleGeoError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 20000,
    });
    trackRef.current.watchId = watchId;
  };

  const clearWatch = () => {
    if (trackRef.current.watchId != null) {
      navigator.geolocation.clearWatch(trackRef.current.watchId);
      trackRef.current.watchId = null;
    }
  };

  useEffect(() => () => clearWatch(), []);

  // Live UI refresh — the ref above is the source of truth; this just pulls
  // a snapshot into state once a second so the screen updates.
  useEffect(() => {
    if (status !== "active" && status !== "paused") return;
    const id = setInterval(() => {
      const t = trackRef.current;
      setLiveStats((s) => ({
        ...s,
        distanceM: t.distanceM,
        movingMs: getElapsedMs(t),
        elevGainM: t.elevGainM,
        elevLossM: t.elevLossM,
        maxSpeedMps: t.maxSpeedMps,
        curSpeedMps: t.curSpeedMps,
        hasElevation: t.hasElevation,
        route: t.points, // same array, mutated in place — see RouteMap's note on `route?.length`
      }));
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  // ── Run controls ───────────────────────────────────────────────────────────

  const handleStart = () => {
    trackRef.current = freshTrack();
    trackRef.current.startTime = Date.now();
    setLiveStats(freshLiveStats);
    setGpsError("");
    setStatus("active");
    startWatch();
  };

  const handlePauseResume = () => {
    const t = trackRef.current;
    const now = Date.now();
    setStatus((s) => {
      if (s === "active") {
        t.pausedAt = now;
        return "paused";
      }
      if (t.pausedAt != null) {
        t.pausedMs += now - t.pausedAt;
        t.pausedAt = null;
      }
      // Don't let the gap while paused read as sudden distance on resume.
      t.anchorPoint = t.lastPoint;
      return "active";
    });
  };

  const handleStop = () => {
    clearWatch();
    const t = trackRef.current;
    const duration = Math.round(getElapsedMs(t) / 1000);

    // An accidental start/stop tap — nothing worth reviewing or saving.
    if (t.distanceM < 10 && duration < 5) {
      setStatus("idle");
      return;
    }

    const calories = estimateCalories(t.distanceM, weightLbs);
    setReviewData({
      startTime: t.startTime,
      endTime: Date.now(),
      duration,
      distance: t.distanceM,
      maxSpeed: t.maxSpeedMps,
      elevationGain: t.elevGainM,
      elevationLoss: t.elevLossM,
      hasElevation: t.hasElevation,
      calories,
      mileSplits: t.mileSplits,
      kmSplits: t.kmSplits,
      route: simplifyRoute(t.points),
      title: "",
      note: "",
      source: "gps",
    });
    setStatus("review");
  };

  const handleDiscardReview = () => {
    setReviewData(null);
    setStatus("idle");
  };

  const handleSaveRun = async () => {
    if (!reviewData) return;
    setSaving(true);
    try {
      await api.addRunEntry({
        date: new Date(reviewData.startTime).toLocaleDateString("en-CA"),
        title: reviewData.title,
        note: reviewData.note,
        source: reviewData.source,
        startTime: new Date(reviewData.startTime).toISOString(),
        endTime: new Date(reviewData.endTime).toISOString(),
        duration: reviewData.duration,
        distance: reviewData.distance,
        maxSpeed: reviewData.maxSpeed,
        elevationGain: reviewData.elevationGain,
        elevationLoss: reviewData.elevationLoss,
        calories: reviewData.calories,
        mileSplits: reviewData.mileSplits || [],
        kmSplits: reviewData.kmSplits || [],
        route: reviewData.route || [],
      });
      setReviewData(null);
      setStatus("idle");
      await fetchRuns();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Manual entry ───────────────────────────────────────────────────────────

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualError("");
    const dist = Number(manualForm.distance);
    const h = Number(manualForm.hours) || 0;
    const m = Number(manualForm.minutes) || 0;
    const s = Number(manualForm.seconds) || 0;
    const durationSec = h * 3600 + m * 60 + s;
    if (!dist || dist <= 0 || durationSec <= 0) {
      setManualError("Enter a distance and duration greater than zero.");
      return;
    }
    const distanceM = unitToMeters(dist, unit);
    const calories = estimateCalories(distanceM, weightLbs);
    const startTime = new Date(`${manualForm.date}T12:00:00`);
    try {
      await api.addRunEntry({
        date: manualForm.date,
        title: manualForm.title,
        note: manualForm.note,
        source: "manual",
        startTime: startTime.toISOString(),
        endTime: new Date(startTime.getTime() + durationSec * 1000).toISOString(),
        duration: durationSec,
        distance: distanceM,
        maxSpeed: 0,
        elevationGain: 0,
        elevationLoss: 0,
        calories,
        mileSplits: [],
        kmSplits: [],
        route: [],
      });
      setManualForm({ date: getToday(), distance: "", hours: "", minutes: "", seconds: "", title: "", note: "" });
      setShowManualForm(false);
      await fetchRuns();
    } catch (err) {
      setManualError(err.response?.data?.error || "Failed to save run.");
      console.error(err);
    }
  };

  // ── History edit/delete ────────────────────────────────────────────────────

  const openEdit = (run) => {
    setEditingRun(run._id);
    setEditForm({ title: run.title || "", note: run.note || "" });
  };

  const handleEditSave = async () => {
    try {
      await api.updateRunEntry(editingRun, { title: editForm.title, note: editForm.note });
      setEditingRun(null);
      await fetchRuns();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteRunEntry(id);
      await fetchRuns();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Derived stats / personal records ───────────────────────────────────────

  const totalRuns = runs.length;
  const totalDistanceM = runs.reduce((sum, r) => sum + r.distance, 0);
  const totalDurationS = runs.reduce((sum, r) => sum + r.duration, 0);
  const totalCalories = runs.reduce((sum, r) => sum + (r.calories || 0), 0);
  const longestRun = runs.reduce((max, r) => (!max || r.distance > max.distance ? r : max), null);

  let fastestMile = null;
  runs.forEach((r) => {
    (r.mileSplits || []).forEach((sp) => {
      if (!fastestMile || sp.duration < fastestMile.duration) fastestMile = sp;
    });
  });

  let streak = 0;
  {
    const dateSet = new Set(runs.map((r) => r.date));
    const cursor = new Date();
    let key = cursor.toLocaleDateString("en-CA");
    if (!dateSet.has(key)) cursor.setDate(cursor.getDate() - 1);
    key = cursor.toLocaleDateString("en-CA");
    while (dateSet.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
      key = cursor.toLocaleDateString("en-CA");
    }
  }

  // Don't show a live pace until there's enough distance for it to mean
  // anything — dividing by a near-zero distance in the first few seconds of
  // a run is inherently unstable no matter how clean the underlying data is.
  const currentPace = liveStats.distanceM >= MIN_PACE_DISTANCE_M
    ? paceSecondsPerUnit(liveStats.movingMs / 1000, liveStats.distanceM, unit)
    : 0;
  const isMovingNow = status === "active";

  // ── Render: active / paused ──────────────────────────────────────────────

  if (status === "active" || status === "paused") {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-md shadow-emerald-200/30 dark:shadow-emerald-900/20">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-emerald-100 text-xs font-semibold uppercase tracking-wide">
              <Navigation size={13} />
              {gpsQualityLabel(liveStats.accuracy)}
            </div>
            {status === "paused" ? (
              <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs font-bold">Paused</span>
            ) : (
              <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" /> Tracking
              </span>
            )}
          </div>

          <p className="text-5xl font-extrabold tabular-nums mt-3 tracking-tight">
            {formatDuration(liveStats.movingMs / 1000)}
          </p>
          <p className="text-emerald-100 text-xs font-medium mt-1">Time</p>

          <div className="flex items-end gap-2 mt-5 pt-4 border-t border-white/15">
            <Gauge size={22} className="text-emerald-100 mb-1.5 flex-shrink-0" />
            <p className="text-4xl font-extrabold tabular-nums leading-none">
              {(isMovingNow ? mpsToUnitSpeed(liveStats.curSpeedMps, unit) : 0).toFixed(1)}
            </p>
            <p className="text-emerald-100 text-sm font-semibold mb-0.5">{unitLabel(unit)}/h</p>
            <p className="text-emerald-100 text-[11px] mb-1 ml-auto">current speed</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div>
              <p className="text-2xl font-bold tabular-nums">{formatDistance(liveStats.distanceM, unit)}</p>
              <p className="text-[11px] text-emerald-100 mt-0.5">{unitLabel(unit)}</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{formatPace(currentPace)}</p>
              <p className="text-[11px] text-emerald-100 mt-0.5">avg /{unitLabel(unit)}</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {liveStats.hasElevation ? Math.round(elevToUnit(liveStats.elevGainM, unit)) : "–"}
              </p>
              <p className="text-[11px] text-emerald-100 mt-0.5">
                {liveStats.hasElevation ? `${elevUnitLabel(unit)} gain` : "no elevation data"}
              </p>
            </div>
          </div>
        </div>

        {gpsError && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-xl px-4 py-2.5 text-xs font-medium">
            {gpsError}
          </div>
        )}

        {liveStats.route?.length > 0 ? (
          <Suspense fallback={mapFallback("h-56")}>
            <RouteMap route={liveStats.route} live darkMode={darkMode} />
          </Suspense>
        ) : (
          <div className="w-full h-56 rounded-xl bg-slate-100 dark:bg-slate-700/40 flex items-center justify-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Waiting for GPS fix…</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handlePauseResume}
            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl py-4 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.99] transition-all shadow-sm"
          >
            {status === "paused" ? <Play size={17} /> : <Pause size={17} />}
            {status === "paused" ? "Resume" : "Pause"}
          </button>
          <button
            onClick={handleStop}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white rounded-2xl py-4 font-semibold text-sm hover:bg-red-600 active:scale-[0.99] transition-all shadow-sm"
          >
            <Square size={15} fill="currentColor" /> Finish
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          Keep this screen open while you run for the most accurate GPS tracking.
        </p>
      </div>
    );
  }

  // ── Render: review / save ─────────────────────────────────────────────────

  if (status === "review" && reviewData) {
    const pace = paceSecondsPerUnit(reviewData.duration, reviewData.distance, unit);
    const avgSpeed = mpsToUnitSpeed(reviewData.distance / (reviewData.duration || 1), unit);
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 transition-colors duration-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Trophy size={15} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Run Complete!</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatTile label={unitLabel(unit)} value={formatDistance(reviewData.distance, unit)} bg="bg-emerald-50 dark:bg-emerald-900/20" text="text-emerald-700 dark:text-emerald-400" subText="text-emerald-400 dark:text-emerald-600" />
            <StatTile label="Duration" value={formatDuration(reviewData.duration)} bg="bg-slate-50 dark:bg-slate-700/50" text="text-slate-700 dark:text-slate-300" />
            <StatTile label={`Pace /${unitLabel(unit)}`} value={formatPace(pace)} bg="bg-blue-50 dark:bg-blue-900/20" text="text-blue-700 dark:text-blue-400" subText="text-blue-400 dark:text-blue-600" />
            <StatTile label={`Avg ${unitLabel(unit)}/h`} value={avgSpeed.toFixed(1)} bg="bg-blue-50 dark:bg-blue-900/20" text="text-blue-700 dark:text-blue-400" subText="text-blue-400 dark:text-blue-600" />
            <StatTile
              label={`Max ${unitLabel(unit)}/h`}
              value={reviewData.maxSpeed ? mpsToUnitSpeed(reviewData.maxSpeed, unit).toFixed(1) : "–"}
              bg="bg-violet-50 dark:bg-violet-900/20" text="text-violet-700 dark:text-violet-400" subText="text-violet-400 dark:text-violet-600"
            />
            <StatTile
              label={reviewData.hasElevation ? `${elevUnitLabel(unit)} gain` : "Elevation"}
              value={reviewData.hasElevation ? Math.round(elevToUnit(reviewData.elevationGain, unit)) : "N/A"}
              bg="bg-amber-50 dark:bg-amber-900/20" text="text-amber-700 dark:text-amber-400" subText="text-amber-400 dark:text-amber-600"
            />
          </div>

          {reviewData.route?.length > 1 && (
            <div className="mb-4">
              <Suspense fallback={mapFallback("h-48")}>
                <RouteMap route={reviewData.route} darkMode={darkMode} heightClass="h-48" />
              </Suspense>
            </div>
          )}

          <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 rounded-xl px-4 py-2.5 mb-4">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Flame size={15} />
              <span className="text-sm font-semibold">Calories burned (est.)</span>
            </div>
            <input
              type="number"
              min="0"
              value={reviewData.calories}
              onChange={(e) => setReviewData({ ...reviewData, calories: Number(e.target.value) })}
              className="w-20 text-right bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 rounded-lg px-2 py-1 text-sm font-bold text-orange-700 dark:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="space-y-2 mb-4">
            <input
              type="text"
              placeholder="Run title (optional)"
              value={reviewData.title}
              onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={reviewData.note}
              onChange={(e) => setReviewData({ ...reviewData, note: e.target.value })}
              className={inputCls}
            />
          </div>

          {(reviewData.mileSplits?.length > 0) && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Mile Splits</p>
              <div className="space-y-1">
                {reviewData.mileSplits.map((sp) => (
                  <div key={sp.index} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-700/40 rounded-lg px-3 py-1.5">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Mile {sp.index}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{formatPace(sp.duration)} /mi</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleDiscardReview}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={14} /> Discard
            </button>
            <button
              onClick={handleSaveRun}
              disabled={saving}
              className="flex-[2] flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-60"
            >
              <Check size={14} /> {saving ? "Saving…" : "Save Run"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: idle / history ─────────────────────────────────────────────────

  return (
    <div className="space-y-4 animate-fadeIn">

      {/* Start card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-md shadow-emerald-200/30 dark:shadow-emerald-900/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Footprints size={16} />
            </div>
            <h2 className="text-sm font-semibold">Ready to Run</h2>
          </div>
          <div className="flex bg-white/15 rounded-lg p-0.5">
            {["mi", "km"].map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  unit === u ? "bg-white text-emerald-700 shadow-sm" : "text-white/80"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {gpsError && (
          <div className="bg-white/15 rounded-xl px-3 py-2 text-xs font-medium mb-3">{gpsError}</div>
        )}

        <button
          onClick={handleStart}
          className="w-full flex items-center justify-center gap-2 bg-white text-emerald-700 rounded-2xl py-4 font-bold text-sm hover:bg-emerald-50 active:scale-[0.99] transition-all shadow-sm"
        >
          <Play size={18} fill="currentColor" /> Start Run
        </button>
      </div>

      {/* Manual entry toggle */}
      <button
        onClick={() => setShowManualForm((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors py-1"
      >
        <Plus size={13} /> {showManualForm ? "Cancel manual entry" : "Log a run manually (treadmill, no GPS)"}
      </button>

      {showManualForm && (
        <form onSubmit={handleManualSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-3 animate-fadeIn transition-colors duration-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Distance ({unitLabel(unit)})</label>
              <input type="number" step="0.01" min="0" placeholder="e.g. 3.1" value={manualForm.distance}
                onChange={(e) => setManualForm({ ...manualForm, distance: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Date</label>
              <input type="date" value={manualForm.date}
                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })} className={inputCls} required />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Duration</label>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" min="0" placeholder="hh" value={manualForm.hours}
                onChange={(e) => setManualForm({ ...manualForm, hours: e.target.value })} className={inputCls} />
              <input type="number" min="0" max="59" placeholder="mm" value={manualForm.minutes}
                onChange={(e) => setManualForm({ ...manualForm, minutes: e.target.value })} className={inputCls} />
              <input type="number" min="0" max="59" placeholder="ss" value={manualForm.seconds}
                onChange={(e) => setManualForm({ ...manualForm, seconds: e.target.value })} className={inputCls} />
            </div>
          </div>
          <input type="text" placeholder="Title (optional)" value={manualForm.title}
            onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })} className={inputCls} />
          <input type="text" placeholder="Note (optional)" value={manualForm.note}
            onChange={(e) => setManualForm({ ...manualForm, note: e.target.value })} className={inputCls} />
          {manualError && <p className="text-sm text-red-500 dark:text-red-400 text-center">{manualError}</p>}
          <button type="submit" className="w-full bg-emerald-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-emerald-700 active:scale-[0.99] transition-all">
            Save Manual Run
          </button>
        </form>
      )}

      {/* Personal records */}
      {totalRuns > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 transition-colors duration-200">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
            <Trophy size={15} className="text-emerald-600 dark:text-emerald-400" /> Personal Records
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            <StatTile label="Total Runs" value={totalRuns} bg="bg-slate-50 dark:bg-slate-700/50" text="text-slate-700 dark:text-slate-300" />
            <StatTile label={`Total ${unitLabel(unit)}`} value={formatDistance(totalDistanceM, unit, 1)} bg="bg-emerald-50 dark:bg-emerald-900/20" text="text-emerald-700 dark:text-emerald-400" subText="text-emerald-400 dark:text-emerald-600" />
            <StatTile label="Day Streak" value={streak} bg="bg-orange-50 dark:bg-orange-900/20" text="text-orange-700 dark:text-orange-400" subText="text-orange-400 dark:text-orange-600" />
            <StatTile
              label="Fastest Mile"
              value={fastestMile ? formatPace(fastestMile.duration) : "–"}
              bg="bg-blue-50 dark:bg-blue-900/20" text="text-blue-700 dark:text-blue-400" subText="text-blue-400 dark:text-blue-600"
            />
            <StatTile
              label="Longest Run"
              value={longestRun ? formatDistance(longestRun.distance, unit, 1) : "–"}
              sub={unitLabel(unit)}
              bg="bg-violet-50 dark:bg-violet-900/20" text="text-violet-700 dark:text-violet-400" subText="text-violet-400 dark:text-violet-600"
            />
            <StatTile
              label="Total Time"
              value={formatDuration(totalDurationS).split(":").slice(0, 2).join(":")}
              bg="bg-slate-50 dark:bg-slate-700/50" text="text-slate-700 dark:text-slate-300"
            />
          </div>
          {totalCalories > 0 && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-3 flex items-center justify-center gap-1">
              <Flame size={12} /> {Math.round(totalCalories).toLocaleString()} kcal burned all-time
            </p>
          )}
        </div>
      )}

      {/* History */}
      {runs.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              History ({runs.length} {runs.length === 1 ? "run" : "runs"})
            </p>
          </div>

          {[...runs].reverse().map((run) => {
            const isExpanded = expandedId === run._id;
            const isEditing = editingRun === run._id;
            const pace = paceSecondsPerUnit(run.duration, run.distance, unit);

            return (
              <div key={run._id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                {isEditing ? (
                  <div className="px-4 py-3 space-y-2 bg-emerald-50/50 dark:bg-emerald-900/10">
                    <input type="text" value={editForm.title} placeholder="Title"
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className={inputCls} />
                    <input type="text" value={editForm.note} placeholder="Note"
                      onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} className={inputCls} />
                    <div className="flex gap-2">
                      <button onClick={() => setEditingRun(null)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <X size={12} /> Cancel
                      </button>
                      <button onClick={handleEditSave} className="flex-[2] flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all">
                        <Check size={12} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : run._id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors text-left"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${run.source === "manual" ? "bg-slate-100 dark:bg-slate-700" : "bg-emerald-100 dark:bg-emerald-900/30"}`}>
                        <Footprints size={15} className={run.source === "manual" ? "text-slate-500 dark:text-slate-400" : "text-emerald-600 dark:text-emerald-400"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {run.title || "Run"}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                            {new Date(run.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatDistance(run.distance, unit)} {unitLabel(unit)} · {formatDuration(run.duration)} · {formatPace(pace)} /{unitLabel(unit)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-orange-500 dark:text-orange-400">{Math.round(run.calories || 0)}</p>
                          <p className="text-[10px] text-slate-300 dark:text-slate-600">kcal</p>
                        </div>
                        {isExpanded ? <ChevronUp size={15} className="text-slate-300 dark:text-slate-600" /> : <ChevronDown size={15} className="text-slate-300 dark:text-slate-600" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 animate-fadeIn">
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-lg py-2 text-center">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{mpsToUnitSpeed((run.distance / (run.duration || 1)), unit).toFixed(1)}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">avg {unitLabel(unit)}/h</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-lg py-2 text-center">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{run.maxSpeed ? mpsToUnitSpeed(run.maxSpeed, unit).toFixed(1) : "–"}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">max {unitLabel(unit)}/h</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-lg py-2 text-center">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{run.elevationGain ? Math.round(elevToUnit(run.elevationGain, unit)) : "–"}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{elevUnitLabel(unit)} gain</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-lg py-2 text-center">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize">{run.source}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">source</p>
                          </div>
                        </div>

                        {run.route?.length > 1 && (
                          <div className="mb-3">
                            <Suspense fallback={mapFallback("h-40")}>
                              <RouteMap route={run.route} darkMode={darkMode} heightClass="h-40" />
                            </Suspense>
                          </div>
                        )}

                        {run.mileSplits?.length > 0 && (
                          <div className="space-y-1 mb-3">
                            {run.mileSplits.map((sp) => (
                              <div key={sp.index} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-700/40 rounded-lg px-3 py-1.5">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Mile {sp.index}</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{formatPace(sp.duration)} /mi</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {run.note && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-3">&ldquo;{run.note}&rdquo;</p>
                        )}

                        <div className="flex gap-2">
                          <button onClick={() => openEdit(run)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <Pencil size={12} /> Edit
                          </button>
                          <button onClick={() => handleDelete(run._id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">🏃</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No runs logged yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Tap Start Run above to track your first one</p>
        </div>
      )}
    </div>
  );
}
