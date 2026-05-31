import { useState } from "react";
import { api } from "../api";
import { Search, Loader2, Barcode, Camera } from "lucide-react";
import BarcodeScanner from "./BarcodeScanner";
import FoodAdjustModal from "./FoodAdjustModal";
import PhotoAnalyzer from "./PhotoAnalyzer";

const MEALS = ["breakfast", "lunch", "dinner", "snacks"];

const MEAL_BADGE = {
  breakfast: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  lunch:     "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  dinner:    "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  snacks:    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
};

export default function FoodSearch({ onAdd, defaultMealType = "snacks" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(defaultMealType);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [adjustingFood, setAdjustingFood] = useState(null);

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

  const handleFoodConfirm = (food, mealType) => {
    onAdd(food, mealType);
    setAdjustingFood(null);
  };

  return (
    <>
      {showScanner && (
        <BarcodeScanner
          onAdd={(food, mealType) => { onAdd(food, mealType); setShowScanner(false); }}
          onClose={() => setShowScanner(false)}
          defaultMealType={selectedMeal}
        />
      )}

      {showPhoto && (
        <PhotoAnalyzer
          onAdd={(food, mealType) => { onAdd(food, mealType); }}
          mealType={selectedMeal}
          onClose={() => setShowPhoto(false)}
        />
      )}

      {adjustingFood && (
        <FoodAdjustModal
          food={adjustingFood}
          mealType={selectedMeal}
          onAdd={handleFoodConfirm}
          onClose={() => setAdjustingFood(null)}
        />
      )}

      <div className="space-y-4">
        {/* Search card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 transition-colors duration-200">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Search Food Database
          </h2>

          {/* Search row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                placeholder="Search foods, brands..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Photo analyzer button */}
            <button
              onClick={() => setShowPhoto(true)}
              className="p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Analyze food photo with AI"
            >
              <Camera size={18} />
            </button>

            {/* Barcode scan button */}
            <button
              onClick={() => setShowScanner(true)}
              className="p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              title="Scan barcode"
            >
              <Barcode size={18} />
            </button>

            {/* Search button */}
            <button
              onClick={searchFoods}
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Search size={15} />
              )}
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
            <p className="text-sm">Searching USDA database…</p>
          </div>
        )}

        {/* Empty results */}
        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No results found</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Try a different term,{" "}
              <button onClick={() => setShowScanner(true)} className="text-indigo-500 dark:text-indigo-400 font-medium hover:underline">
                scan a barcode
              </button>
              {", or "}
              <button onClick={() => setShowPhoto(true)} className="text-indigo-500 dark:text-indigo-400 font-medium hover:underline">
                analyze a photo
              </button>
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 px-1 uppercase tracking-wide">
              {results.length} Results · Tap a result to adjust &amp; add
            </p>
            {results.map((food) => (
              <button
                key={food.id}
                onClick={() => setAdjustingFood(food)}
                className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 text-left hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-150"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                      {food.name}
                    </p>
                    {food.brand && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{food.brand}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        { label: `${Math.round(food.calories || 0)} kcal`, cls: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" },
                        { label: `P ${(food.protein || 0).toFixed(1)}g`,   cls: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" },
                        { label: `C ${(food.carbs   || 0).toFixed(1)}g`,   cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
                        { label: `F ${(food.fats    || 0).toFixed(1)}g`,   cls: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" },
                      ].map(({ label, cls }) => (
                        <span key={label} className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
                          {label}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                      Base: {food.servingSize || 100}{food.servingUnit || "g"} · Tap to adjust serving &amp; add
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0 mt-0.5 ${MEAL_BADGE[selectedMeal]}`}>
                    {selectedMeal}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
