import { useState } from "react";
import { X, Check } from "lucide-react";

const MEALS = ["breakfast", "lunch", "dinner", "snacks"];

const inputCls =
  "w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

export default function FoodAdjustModal({ food, mealType: initialMeal = "snacks", onAdd, onClose }) {
  const baseServing = food.servingSize || 100;
  const [serving, setServing] = useState(baseServing);
  const [selectedMeal, setSelectedMeal] = useState(initialMeal);
  const [macros, setMacros] = useState({
    calories: Math.round(food.calories || 0),
    protein: parseFloat((food.protein || 0).toFixed(1)),
    carbs:   parseFloat((food.carbs   || 0).toFixed(1)),
    fats:    parseFloat((food.fats    || 0).toFixed(1)),
  });

  const handleServingChange = (val) => {
    const s = Math.max(1, Number(val) || 1);
    setServing(s);
    const f = s / baseServing;
    setMacros({
      calories: Math.round((food.calories || 0) * f),
      protein:  parseFloat(((food.protein || 0) * f).toFixed(1)),
      carbs:    parseFloat(((food.carbs   || 0) * f).toFixed(1)),
      fats:     parseFloat(((food.fats    || 0) * f).toFixed(1)),
    });
  };

  const MACRO_FIELDS = [
    { key: "calories", label: "Calories", unit: "kcal", color: "text-orange-500 dark:text-orange-400" },
    { key: "protein",  label: "Protein",  unit: "g",    color: "text-emerald-500 dark:text-emerald-400" },
    { key: "carbs",    label: "Carbs",    unit: "g",    color: "text-blue-500 dark:text-blue-400" },
    { key: "fats",     label: "Fat",      unit: "g",    color: "text-amber-500 dark:text-amber-400" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-100 dark:border-slate-700 shadow-2xl max-h-[85vh] overflow-y-auto transition-colors duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
              Adjust &amp; Add
            </p>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {food.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Serving size */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">
              Serving Size
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={serving}
                onChange={(e) => handleServingChange(e.target.value)}
                className={inputCls + " flex-1"}
                min="1"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
                {food.servingUnit || "g"}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0 whitespace-nowrap">
                base {baseServing}{food.servingUnit || "g"}
              </span>
            </div>
          </div>

          {/* Macro fields — auto-update from serving but fully editable */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">
              Nutrition <span className="normal-case font-normal">(tap to edit)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MACRO_FIELDS.map(({ key, label, unit, color }) => (
                <div key={key} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5">
                  <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${color}`}>
                    {label}
                  </p>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={macros[key]}
                      onChange={(e) =>
                        setMacros((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))
                      }
                      className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none min-w-0"
                      min="0"
                      step={key === "calories" ? "1" : "0.1"}
                    />
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                      {unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meal selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">
              Add to Meal
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {MEALS.map((meal) => (
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                    selectedMeal === meal
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onAdd({ name: food.name, ...macros }, selectedMeal)}
            className="flex-[2] py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Check size={14} />
            Add to {selectedMeal}
          </button>
        </div>
      </div>
    </div>
  );
}
