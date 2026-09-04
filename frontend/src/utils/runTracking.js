// Pure helpers for the running tracker — unit conversion, formatting, and
// GPS math. All run data is stored server-side in canonical SI units
// (meters, seconds, m/s) so display conversion always happens here.

export const MILE_METERS = 1609.34;
export const KM_METERS = 1000;

// GPS quality gates
export const MAX_ACCURACY_M = 30;        // discard fixes worse than this
export const MAX_PLAUSIBLE_SPEED_MPS = 12; // ~27mph — beyond this treat as a GPS jump
export const MIN_DISTANCE_DELTA_M = 2;    // ignore displacement smaller than this — GPS jitter
                                           // at a standstill can otherwise read as "moving"
export const MAX_POSITION_AGE_MS = 30000; // reject a fix this stale — likely a cached
                                           // "last known location", not a live one
export const MIN_PACE_DISTANCE_M = 30;    // don't show a live pace before this much distance —
                                           // dividing by a near-zero distance is inherently
                                           // unstable/misleading in the first few seconds

export function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function metersToUnit(meters, unit) {
  return unit === "km" ? meters / KM_METERS : meters / MILE_METERS;
}

export function unitToMeters(value, unit) {
  return unit === "km" ? value * KM_METERS : value * MILE_METERS;
}

export function mpsToUnitSpeed(mps, unit) {
  return unit === "km" ? mps * 3.6 : mps * 2.23693629;
}

export function metersToFeet(m) {
  return m * 3.28084;
}

// Elevation follows the same convention distance does: feet alongside miles,
// meters alongside km.
export function elevToUnit(meters, unit) {
  return unit === "km" ? meters : metersToFeet(meters);
}

export function elevUnitLabel(unit) {
  return unit === "km" ? "m" : "ft";
}

export function unitLabel(unit) {
  return unit === "km" ? "km" : "mi";
}

export function formatDistance(meters, unit, decimals = 2) {
  return metersToUnit(meters, unit).toFixed(decimals);
}

export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// seconds-per-unit pace, formatted as M:SS. Anything above 60 min/unit isn't
// a meaningful pace to show — a last-resort display-layer guard alongside
// the tracking-side fixes, since dividing by a near-zero distance is
// inherently unstable in the first few seconds of a run.
export function formatPace(secondsPerUnit) {
  if (!isFinite(secondsPerUnit) || secondsPerUnit <= 0 || secondsPerUnit > 3600) return "--:--";
  // Round the total once, then split — rounding minutes and seconds
  // independently can overflow (e.g. "28:60" instead of "29:00").
  const total = Math.round(secondsPerUnit);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function paceSecondsPerUnit(durationSeconds, meters, unit) {
  const dist = metersToUnit(meters, unit);
  if (dist <= 0) return 0;
  return durationSeconds / dist;
}

// Simple weight-based estimate (~1.036 kcal per kg per km run), independent
// of pace — matches commonly cited running energy-expenditure research.
export function estimateCalories(distanceMeters, weightLbs = 154) {
  const km = distanceMeters / 1000;
  const kg = weightLbs / 2.20462;
  return Math.round(kg * km * 1.036);
}

export function gpsQualityLabel(accuracy) {
  if (accuracy == null) return "Searching…";
  if (accuracy <= 10) return "Excellent";
  if (accuracy <= 25) return "Good";
  if (accuracy <= 50) return "Fair";
  return "Weak";
}

// Downsample a route to keep stored documents/payloads small on long runs,
// always keeping the first and last point.
export function simplifyRoute(route, maxPoints = 800) {
  if (!route || route.length <= maxPoints) return route || [];
  const result = [];
  const step = (route.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    result.push(route[Math.round(i * step)]);
  }
  return result;
}

