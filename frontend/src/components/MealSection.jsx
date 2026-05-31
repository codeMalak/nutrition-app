import { useState } from "react";
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp } from "lucide-react";

const MEAL_CONFIG = {
  breakfast: { emoji: "🌅", label: "Breakfast" },
  lunch:     { emoji: "☀️",  label: "Lunch" },
  dinner:    { emoji: "🌙", label: "Dinner" },
  snacks:    { emoji: "🍎", label: "Snacks" },
};

export default function MealSection({ mealType, entries, onDelete, onAdd, onEdit }) {
  const [expanded, setExpanded] = useState(true);
  const config = MEAL_CONFIG[mealType];
  const mealEntries = entries.filter((e) => (e.mealType || "snacks") === mealType);
  const mealCalories = mealEntries.reduce((s, e) => s + (e.calories || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2.5 flex-1 text-left"
        >
          <span className="text-lg leading-none">{config.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {config.label}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {mealEntries.length} item{mealEntries.length !== 1 ? "s" : ""} · {mealCalories} kcal
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onAdd(mealType)}
            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 transition-colors"
            title={`Add to ${config.label}`}
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Entries */}
      {expanded && (
        <div className="border-t border-slate-50 dark:border-slate-700">
          {mealEntries.length > 0 ? (
            mealEntries.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {entry.name}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    P {Math.round(entry.protein)}g · C {Math.round(entry.carbs)}g · F {Math.round(entry.fats)}g
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mr-1">
                    {entry.calories}
                  </span>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(entry)}
                      className="p-1 rounded-lg text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(entry._id)}
                    className="p-1 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-4 text-center">
              <p className="text-[13px] text-slate-400 dark:text-slate-500">No foods logged yet</p>
              <button
                onClick={() => onAdd(mealType)}
                className="mt-1 text-[13px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                + Add food
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
