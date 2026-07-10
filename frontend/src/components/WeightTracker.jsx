import { useState, useEffect, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { api } from "../api";
import { Plus, Trash2, Pencil, X, Check, Scale } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Filler);

const getToday = () => new Date().toLocaleDateString("en-CA");

const toLbs = (kg) => +(kg * 2.20462).toFixed(1);
const toKg  = (lbs) => +(lbs / 2.20462).toFixed(1);

function convertTo(weight, fromUnit, toUnit) {
  if (fromUnit === toUnit) return weight;
  return fromUnit === "kg" ? toLbs(weight) : toKg(weight);
}

const inputCls =
  "w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

export default function WeightTracker({ darkMode }) {
  const [entries, setEntries]       = useState([]);
  const [displayUnit, setDisplayUnit] = useState("lbs");
  const [form, setForm]             = useState({ weight: "", date: getToday(), note: "" });
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const fetchEntries = useCallback(async () => {
    try {
      const res = await api.getWeightEntries();
      setEntries(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.weight || !form.date) {
      setError("Please enter a weight and date.");
      return;
    }
    setLoading(true);
    try {
      await api.addWeightEntry({ ...form, weight: Number(form.weight), unit: displayUnit });
      setForm({ weight: "", date: getToday(), note: "" });
      await fetchEntries();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to save. Is the server running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteWeightEntry(id);
      await fetchEntries();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (entry) => {
    setEditingEntry(entry._id);
    setEditForm({
      date:   entry.date,
      weight: convertTo(entry.weight, entry.unit, displayUnit),
      note:   entry.note || "",
    });
  };

  const handleEditSave = async () => {
    try {
      await api.updateWeightEntry(editingEntry, {
        date:   editForm.date,
        weight: Number(editForm.weight),
        unit:   displayUnit,
        note:   editForm.note,
      });
      setEditingEntry(null);
      await fetchEntries();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Chart data ─────────────────────────────────────────────────────────────
  const chartEntries = entries.slice(-60);
  const chartData = {
    labels: chartEntries.map((e) => {
      const d = new Date(e.date + "T12:00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }),
    datasets: [
      {
        label: `Weight (${displayUnit})`,
        data: chartEntries.map((e) => convertTo(e.weight, e.unit, displayUnit)),
        borderColor: "rgba(99,102,241,1)",
        backgroundColor: "rgba(99,102,241,0.12)",
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "rgba(99,102,241,1)",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.raw} ${displayUnit}` },
        backgroundColor: darkMode ? "#1E293B" : "#0F172A",
        bodyColor: "#F1F5F9",
        padding: 10,
        cornerRadius: 10,
      },
    },
    scales: {
      y: {
        grid:   { color: darkMode ? "#1E293B" : "#F1F5F9" },
        ticks:  { font: { size: 11 }, color: darkMode ? "#64748B" : "#94A3B8",
                  callback: (v) => `${v} ${displayUnit}` },
        border: { display: false },
      },
      x: {
        grid:   { display: false },
        ticks:  { font: { size: 11 }, color: darkMode ? "#94A3B8" : "#64748B",
                  maxTicksLimit: 8 },
        border: { display: false },
      },
    },
  };

  // ── Latest stats ────────────────────────────────────────────────────────────
  const latest   = entries.length ? convertTo(entries[entries.length - 1].weight, entries[entries.length - 1].unit, displayUnit) : null;
  const previous = entries.length > 1 ? convertTo(entries[entries.length - 2].weight, entries[entries.length - 2].unit, displayUnit) : null;
  const diff     = latest !== null && previous !== null ? +(latest - previous).toFixed(1) : null;

  return (
    <div className="space-y-4">

      {/* Header + unit toggle */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
              <Scale size={15} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Weight Tracker</h2>
          </div>
          {/* Unit toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
            {["lbs", "kg"].map((u) => (
              <button
                key={u}
                onClick={() => setDisplayUnit(u)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  displayUnit === u
                    ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Stat pills */}
        {latest !== null && (
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-indigo-700 dark:text-indigo-400">
                {latest}<span className="text-sm font-medium ml-0.5">{displayUnit}</span>
              </p>
              <p className="text-[11px] text-indigo-400 dark:text-indigo-600 mt-0.5">Current</p>
            </div>
            {diff !== null && (
              <div className={`flex-1 rounded-xl p-3 text-center ${diff <= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                <p className={`text-xl font-bold ${diff <= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {diff > 0 ? "+" : ""}{diff}<span className="text-sm font-medium ml-0.5">{displayUnit}</span>
                </p>
                <p className={`text-[11px] mt-0.5 ${diff <= 0 ? "text-emerald-400 dark:text-emerald-600" : "text-red-400 dark:text-red-600"}`}>
                  vs last entry
                </p>
              </div>
            )}
            <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
                {entries.length}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Entries</p>
            </div>
          </div>
        )}

        {/* Add form */}
        <form onSubmit={handleAdd} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                Weight ({displayUnit})
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder={`e.g. ${displayUnit === "lbs" ? "165" : "75"}`}
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputCls}
                required
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="Note (optional)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className={inputCls}
          />
          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 text-center px-1">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-sm disabled:opacity-60"
          >
            <Plus size={15} />
            {loading ? "Saving…" : "Log Weight"}
          </button>
        </form>
      </div>

      {/* Chart */}
      {entries.length > 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 transition-colors duration-200">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Progress Chart</h3>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {/* Entries list */}
      {entries.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              History ({entries.length} entries)
            </p>
          </div>

          {[...entries].reverse().map((entry) => {
            const displayed = convertTo(entry.weight, entry.unit, displayUnit);
            const isEditing = editingEntry === entry._id;

            return (
              <div
                key={entry._id}
                className="border-b border-slate-50 dark:border-slate-700/50 last:border-0"
              >
                {isEditing ? (
                  // ── Inline edit ───────────────────────────────────────────
                  <div className="px-4 py-3 space-y-2 bg-indigo-50/50 dark:bg-indigo-900/10">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.weight}
                        onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                        className={inputCls}
                        placeholder={`Weight (${displayUnit})`}
                      />
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <input
                      type="text"
                      value={editForm.note}
                      onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                      placeholder="Note (optional)"
                      className={inputCls}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingEntry(null)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <X size={12} /> Cancel
                      </button>
                      <button
                        onClick={handleEditSave}
                        className="flex-[2] flex items-center justify-center gap-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all"
                      >
                        <Check size={12} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  // ── Display row ───────────────────────────────────────────
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {displayed} {displayUnit}
                        </span>
                        {entry.note && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                            {entry.note}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(entry)}
                        className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">⚖️</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No weight entries yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Log your first weight above to start tracking</p>
        </div>
      )}
    </div>
  );
}
