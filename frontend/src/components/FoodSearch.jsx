import { useState } from "react";
import { api } from "../api";
import { Search, Plus, Loader2 } from "lucide-react";

const MEALS = ["breakfast", "lunch", "dinner", "snacks"];

const MEAL_COLORS = {
  breakfast: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  lunch:     "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  dinner:    "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  snacks:    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
};

const inputCls =
  "w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500";

export default function FoodSearch({ onAdd, defaultMealType = "snacks" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [grams, setGrams] = useState({});
  const [selectedMeal, setSelectedMeal] = useState(defaultMealType);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchFoods = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.searchFoods(query.trim());
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") searchFoods();
  };

  const handleAdd = (food) => {
    const baseServing = food.servingSize || 100;
    const enteredGrams = grams[food.id] || baseServing;
    const factor = enteredGrams / baseServing;
    onAdd(
      {
        name: food.name,
        calories: Math.round((food.calories || 0) * factor),
        protein: +((food.protein || 0) * factor).toFixed(1),
        carbs:   +((food.carbs   || 0) * factor).toFixed(1),
        fats:    +((food.fats    || 0) * factor).toFixed(1),
      },
      selectedMeal
    );
  };

  const scale = (val, foodId, base) => {
    const g = grams[foodId] || base || 100;
    return ((val || 0) * (g / (base || 100))).toFixed(1);
  };

  return (
    <div className="space-y-4">
      {/* Search card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 transition-colors duration-200">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Search Food Database
        </h2>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search foods, brands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={searchFoods}
            disabled={loading || !query.trim()}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            {loading ? "Searching" : "Search"}
          </button>
        </div>

        {/* Meal selector */}
        <div className="mt-3">
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wide">
            Add to Meal
          </p>
          <div className="flex gap-2 flex-wrap">
            {MEALS.map((meal) => (
              <button
                key={meal}
                onClick={() => setSelectedMeal(meal)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
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

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-12 text-slate-400 dark:text-slate-500">
          <Loader2 size={28} className="animate-spin mb-2" />
          <p className="text-sm">Searching USDA database...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No results found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try a different search term</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 px-1 uppercase tracking-wide">
            {results.length} Results · USDA Database
          </p>
          {results.map((food) => (
            <div key={food.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 transition-colors duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">{food.name}</p>
                  {food.brand && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{food.brand}</p>
                  )}
                  {/* Macro pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-[11px] font-semibold rounded-full">
                      {Math.round(scale(food.calories, food.id, food.servingSize))} kcal
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium rounded-full">
                      P {scale(food.protein, food.id, food.servingSize)}g
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-medium rounded-full">
                      C {scale(food.carbs, food.id, food.servingSize)}g
                    </span>
                    <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[11px] font-medium rounded-full">
                      F {scale(food.fats, food.id, food.servingSize)}g
                    </span>
                  </div>
                </div>
              </div>

              {/* Serving + Add row */}
              <div className="flex items-center gap-2 mt-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    placeholder={`Serving (${food.servingUnit || "g"})`}
                    value={grams[food.id] || ""}
                    onChange={(e) => setGrams({ ...grams, [food.id]: Number(e.target.value) })}
                    className={inputCls}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 dark:text-slate-500">
                    {food.servingUnit || "g"}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                  base: {food.servingSize || 100}{food.servingUnit || "g"}
                </span>
                <button
                  onClick={() => handleAdd(food)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm flex-shrink-0"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>

              <div className="mt-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${MEAL_COLORS[selectedMeal]}`}>
                  → {selectedMeal}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
