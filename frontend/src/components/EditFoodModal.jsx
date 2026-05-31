import { useState } from "react";
import { X, Save } from "lucide-react";

const inputCls =
  "w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

export default function EditFoodModal({ entry, onSave, onClose }) {
  const [form, setForm] = useState({
    name:     entry.name,
    calories: entry.calories,
    protein:  entry.protein,
    carbs:    entry.carbs,
    fats:     entry.fats,
  });

  const FIELDS = [
    { key: "calories", label: "Calories", unit: "kcal", color: "text-orange-500 dark:text-orange-400" },
    { key: "protein",  label: "Protein",  unit: "g",    color: "text-emerald-500 dark:text-emerald-400" },
    { key: "carbs",    label: "Carbs",    unit: "g",    color: "text-blue-500 dark:text-blue-400" },
    { key: "fats",     label: "Fat",      unit: "g",    color: "text-amber-500 dark:text-amber-400" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-100 dark:border-slate-700 shadow-2xl transition-colors duration-200">

        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Edit Entry</p>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[220px]">
              {entry.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">
              Food Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {FIELDS.map(({ key, label, unit, color }) => (
              <div key={key} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5">
                <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${color}`}>{label}</p>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) || 0 })}
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none min-w-0"
                    min="0"
                    step={key === "calories" ? "1" : "0.1"}
                  />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(entry._id, form)}
            className="flex-[2] py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Save size={14} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
