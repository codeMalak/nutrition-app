import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Share2 } from "lucide-react";
import { Bar } from "react-chartjs-2";
import Navbar from "../components/Navbar";
import BottomTabBar from "../components/BottomTabBar";
import FoodSearch from "../components/FoodSearch";
import CalorieRing from "../components/CalorieRing";
import MacroBar from "../components/MacroBar";
import MealSection from "../components/MealSection";
import EditFoodModal from "../components/EditFoodModal";
import AdBanner from "../components/AdBanner";
import PremiumBanner from "../components/PremiumBanner";
import ShareModal from "../components/ShareModal";
import WeightTracker from "../components/WeightTracker";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const MEALS = ["breakfast", "lunch", "dinner", "snacks"];

const MACRO_COLORS = {
  protein: "#10B981",
  carbs: "#3B82F6",
  fats: "#F59E0B",
};

export default function DashboardPage({ toggleDark, darkMode }) {
  const [activeTab, setActiveTab] = useState("home");
  const [foodEntries, setFoodEntries] = useState([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, fats: 0, carbs: 0 });
  const [goals, setGoals] = useState({
    dailyCalorieGoal: 2000,
    macroGoals: { protein: 150, fats: 70, carbs: 200 },
  });
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weeklyData, setWeeklyData] = useState([]);
  const [newFood, setNewFood] = useState({
    name: "", calories: "", protein: "", fats: "", carbs: "", mealType: "snacks",
  });
  const [editingGoals, setEditingGoals] = useState({
    dailyCalorieGoal: 2000, protein: 150, fats: 70, carbs: 200,
  });
  const [goalsSaved, setGoalsSaved] = useState(false);
  const [activeMealType, setActiveMealType] = useState("snacks");
  const [water, setWater] = useState(0);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const WATER_GOAL = 8;

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchFood = useCallback(async () => {
    try {
      const [entriesRes, totalsRes] = await Promise.all([
        api.getFoodEntries(date),
        api.getFoodTotals(date),
      ]);
      setFoodEntries(entriesRes.data);
      setTotals(totalsRes.data);
    } catch (err) {
      console.error("fetchFood error:", err);
    }
  }, [date]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.getProfile();
      const { dailyCalorieGoal, macroGoals, isPremium: premiumStatus } = res.data;
      setGoals({ dailyCalorieGoal, macroGoals });
      setIsPremium(!!premiumStatus);
      setEditingGoals({
        dailyCalorieGoal,
        protein: macroGoals.protein,
        fats: macroGoals.fats,
        carbs: macroGoals.carbs,
      });
    } catch (err) {
      console.error("fetchProfile error:", err);
    }
  }, []);

  const fetchWeekly = useCallback(async () => {
    try {
      const d = new Date(date + "T12:00:00");
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diff);
      const startDate = monday.toISOString().slice(0, 10);
      const res = await api.getWeeklyData(startDate);
      setWeeklyData(res.data);
    } catch (err) {
      console.error("fetchWeekly error:", err);
    }
  }, [date]);

  useEffect(() => { fetchFood(); }, [fetchFood]);
  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => { if (activeTab === "profile") fetchWeekly(); }, [activeTab, fetchWeekly]);

  useEffect(() => {
    const saved = localStorage.getItem(`water_${date}`);
    setWater(saved ? Number(saved) : 0);
  }, [date]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const updateWater = (delta) => {
    const next = Math.max(0, Math.min(WATER_GOAL, water + delta));
    setWater(next);
    localStorage.setItem(`water_${date}`, next);
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    try {
      await api.addFoodEntry({ ...newFood, date });
      setNewFood({ name: "", calories: "", protein: "", fats: "", carbs: "", mealType: "snacks" });
      await fetchFood();
      setActiveTab("home");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteFoodEntry(id);
      await fetchFood();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSave = async (id, form) => {
    try {
      await api.updateFoodEntry(id, form);
      await fetchFood();
      setEditingEntry(null);
    } catch (err) {
      console.error(err);
    }
  };

  const addFoodFromSearch = async (food, mealType = "snacks") => {
    try {
      await api.addFoodEntry({
        name: food.name,
        calories: Number(food.calories) || 0,
        protein: Number(food.protein) || 0,
        fats: Number(food.fats) || 0,
        carbs: Number(food.carbs) || 0,
        mealType,
        date,
      });
      await fetchFood();
      setActiveTab("home");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFromMeal = (mealType) => {
    setActiveMealType(mealType);
    setNewFood((prev) => ({ ...prev, mealType }));
    setActiveTab("search");
  };

  const handleSaveGoals = async () => {
    try {
      await api.updateGoals({
        dailyCalorieGoal: Number(editingGoals.dailyCalorieGoal),
        macroGoals: {
          protein: Number(editingGoals.protein),
          fats: Number(editingGoals.fats),
          carbs: Number(editingGoals.carbs),
        },
      });
      setGoals({
        dailyCalorieGoal: Number(editingGoals.dailyCalorieGoal),
        macroGoals: {
          protein: Number(editingGoals.protein),
          fats: Number(editingGoals.fats),
          carbs: Number(editingGoals.carbs),
        },
      });
      setGoalsSaved(true);
      setTimeout(() => setGoalsSaved(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Weekly chart ───────────────────────────────────────────────────────────

  const weeklyChartData = {
    labels: weeklyData.map((d) => {
      const dt = new Date(d.date + "T12:00:00");
      return dt.toLocaleDateString("en-US", { weekday: "short" });
    }),
    datasets: [
      {
        label: "Calories",
        data: weeklyData.map((d) => d.calories),
        backgroundColor: weeklyData.map((d) =>
          d.calories > goals.dailyCalorieGoal
            ? "rgba(239,68,68,0.75)"
            : "rgba(99,102,241,0.75)"
        ),
        hoverBackgroundColor: weeklyData.map((d) =>
          d.calories > goals.dailyCalorieGoal
            ? "rgba(239,68,68,1)"
            : "rgba(99,102,241,1)"
        ),
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const weeklyChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.raw.toLocaleString()} kcal` },
        backgroundColor: darkMode ? "#1E293B" : "#0F172A",
        titleColor: darkMode ? "#94A3B8" : "#CBD5E1",
        bodyColor: "#F1F5F9",
        padding: 10,
        cornerRadius: 10,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: darkMode ? "#1E293B" : "#F1F5F9" },
        ticks: { font: { size: 11 }, color: darkMode ? "#64748B" : "#94A3B8" },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 12 }, color: darkMode ? "#94A3B8" : "#64748B" },
        border: { display: false },
      },
    },
  };

  const inputCls =
    "w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar
        date={date}
        setDate={setDate}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        toggleDark={toggleDark}
        darkMode={darkMode}
      />

      {/* Share modal */}
      {showShare && (
        <ShareModal
          totals={totals}
          goals={goals}
          water={water}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Edit food entry modal */}
      {editingEntry && (
        <EditFoodModal
          entry={editingEntry}
          onSave={handleEditSave}
          onClose={() => setEditingEntry(null)}
        />
      )}

      <main className="max-w-2xl mx-auto px-4 py-5 pb-28 md:pb-10">

        {/* ── HOME TAB ── */}
        {activeTab === "home" && (
          <div className="space-y-4 animate-fadeIn">

            {/* Calorie + Macro summary */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Daily Summary
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full font-medium">
                    Goal: {goals.dailyCalorieGoal.toLocaleString()} kcal
                  </span>
                  <button
                    onClick={() => setShowShare(true)}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title="Share progress"
                  >
                    <Share2 size={15} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <CalorieRing consumed={totals.calories} goal={goals.dailyCalorieGoal} />
                <div className="flex-1 space-y-3">
                  <MacroBar label="Protein" current={totals.protein} goal={goals.macroGoals.protein} color={MACRO_COLORS.protein} />
                  <MacroBar label="Carbs" current={totals.carbs} goal={goals.macroGoals.carbs} color={MACRO_COLORS.carbs} />
                  <MacroBar label="Fat" current={totals.fats} goal={goals.macroGoals.fats} color={MACRO_COLORS.fats} />
                </div>
              </div>
            </div>

            {/* Ad / premium banner */}
            {isPremium ? null : <AdBanner />}
            {!isPremium && <PremiumBanner />}

            {/* Macro stat pills */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Protein", value: Math.round(totals.protein), bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", sub: "text-emerald-400 dark:text-emerald-600" },
                { label: "Carbs",   value: Math.round(totals.carbs),   bg: "bg-blue-50 dark:bg-blue-900/20",    text: "text-blue-700 dark:text-blue-400",    sub: "text-blue-400 dark:text-blue-600"    },
                { label: "Fat",     value: Math.round(totals.fats),    bg: "bg-amber-50 dark:bg-amber-900/20",  text: "text-amber-700 dark:text-amber-400",  sub: "text-amber-400 dark:text-amber-600"  },
              ].map(({ label, value, bg, text, sub }) => (
                <div key={label} className={`${bg} rounded-2xl p-3.5 text-center transition-colors duration-200`}>
                  <p className={`text-xl font-bold ${text}`}>
                    {value}<span className="text-sm font-medium">g</span>
                  </p>
                  <p className={`text-[11px] mt-0.5 ${sub} font-medium`}>{label}</p>
                </div>
              ))}
            </div>

            {/* Water Tracker */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm px-4 py-3.5 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                    <span className="text-sm">💧</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Water</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {water} / {WATER_GOAL} glasses
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateWater(-1)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-base flex items-center justify-center">−</button>
                  <div className="flex gap-1">
                    {Array.from({ length: WATER_GOAL }).map((_, i) => (
                      <div key={i} className={`w-2 h-5 rounded-full transition-all duration-200 ${i < water ? "bg-cyan-400" : "bg-slate-100 dark:bg-slate-700"}`} />
                    ))}
                  </div>
                  <button onClick={() => updateWater(1)} className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-bold hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors text-base flex items-center justify-center">+</button>
                </div>
              </div>
            </div>

            {/* Meals */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-0.5">
                Today&apos;s Meals
              </p>
              {MEALS.map((meal) => (
                <MealSection
                  key={meal}
                  mealType={meal}
                  entries={foodEntries}
                  onDelete={handleDelete}
                  onAdd={handleAddFromMeal}
                  onEdit={setEditingEntry}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── SEARCH TAB ── */}
        {activeTab === "search" && (
          <div className="animate-fadeIn">
            <FoodSearch onAdd={addFoodFromSearch} defaultMealType={activeMealType} />
          </div>
        )}

        {/* ── ADD TAB ── */}
        {activeTab === "add" && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 animate-fadeIn transition-colors duration-200">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-5">
              Add Custom Food
            </h2>
            <form onSubmit={handleAddFood} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">Food Name</label>
                <input type="text" placeholder="e.g. Grilled Chicken Breast" value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  className={inputCls} required />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">Meal</label>
                <div className="grid grid-cols-4 gap-2">
                  {MEALS.map((meal) => (
                    <button key={meal} type="button"
                      onClick={() => setNewFood({ ...newFood, mealType: meal })}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                        newFood.mealType === meal
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "calories", label: "Calories", placeholder: "kcal" },
                  { key: "protein",  label: "Protein",  placeholder: "grams" },
                  { key: "carbs",    label: "Carbs",    placeholder: "grams" },
                  { key: "fats",     label: "Fat",      placeholder: "grams" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                    <input type="number" placeholder={placeholder} value={newFood[key]}
                      onChange={(e) => setNewFood({ ...newFood, [key]: e.target.value })}
                      className={inputCls} required min="0" />
                  </div>
                ))}
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-sm mt-1">
                Add to Log
              </button>
            </form>
          </div>
        )}

        {/* ── LOG TAB ── */}
        {activeTab === "log" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Totals banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-4 text-white shadow-md shadow-indigo-200/30">
              <p className="text-xs font-semibold text-indigo-200 mb-2 uppercase tracking-wider">Daily Totals</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "Calories", value: totals.calories },
                  { label: "Protein",  value: `${Math.round(totals.protein)}g` },
                  { label: "Carbs",    value: `${Math.round(totals.carbs)}g` },
                  { label: "Fat",      value: `${Math.round(totals.fats)}g` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/20 rounded-xl py-2.5">
                    <p className="text-base font-bold leading-none">{value}</p>
                    <p className="text-[10px] text-indigo-200 mt-1 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {foodEntries.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">🍽️</p>
                <p className="text-slate-600 dark:text-slate-400 font-semibold">No foods logged</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Search or add foods to get started</p>
                <button onClick={() => setActiveTab("search")} className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all">
                  Search Foods
                </button>
              </div>
            ) : (
              MEALS.map((meal) => {
                const mealEntries = foodEntries.filter((e) => (e.mealType || "snacks") === meal);
                if (mealEntries.length === 0) return null;
                const mealCals = mealEntries.reduce((s, e) => s + (e.calories || 0), 0);
                return (
                  <div key={meal} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <p className="text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">{meal}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{mealCals} kcal</p>
                    </div>
                    {mealEntries.map((entry) => (
                      <div key={entry._id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{entry.name}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            P {Math.round(entry.protein)}g · C {Math.round(entry.carbs)}g · F {Math.round(entry.fats)}g
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mr-1">{entry.calories}</span>
                          <button
                            onClick={() => setEditingEntry(entry)}
                            className="w-6 h-6 rounded-lg text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button onClick={() => handleDelete(entry._id)} className="w-6 h-6 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center text-base leading-none">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (
          <div className="space-y-4 animate-fadeIn">

            {/* Goals editor */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 transition-colors duration-200">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Daily Goals</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">Calorie Goal (kcal)</label>
                  <input type="number" value={editingGoals.dailyCalorieGoal}
                    onChange={(e) => setEditingGoals({ ...editingGoals, dailyCalorieGoal: e.target.value })}
                    className={inputCls} min="0" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "protein", label: "Protein (g)", color: "text-emerald-600 dark:text-emerald-400" },
                    { key: "carbs",   label: "Carbs (g)",   color: "text-blue-600 dark:text-blue-400" },
                    { key: "fats",    label: "Fat (g)",     color: "text-amber-600 dark:text-amber-400" },
                  ].map(({ key, label, color }) => (
                    <div key={key}>
                      <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${color}`}>{label}</label>
                      <input type="number" value={editingGoals[key]}
                        onChange={(e) => setEditingGoals({ ...editingGoals, [key]: e.target.value })}
                        className={inputCls} min="0" />
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveGoals}
                  className={`w-full rounded-xl py-2.5 font-semibold text-sm transition-all ${goalsSaved ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99]"}`}>
                  {goalsSaved ? "✓ Goals Saved!" : "Save Goals"}
                </button>
              </div>
            </div>

            {/* Weekly chart */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">This Week</h2>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Goal: {goals.dailyCalorieGoal.toLocaleString()} kcal</span>
              </div>
              {weeklyData.length > 0 ? (
                <Bar data={weeklyChartData} options={weeklyChartOptions} />
              ) : (
                <div className="h-36 flex items-center justify-center">
                  <p className="text-slate-400 dark:text-slate-500 text-sm">Loading chart...</p>
                </div>
              )}
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-2">
                Purple = under goal · Red = over goal
              </p>
            </div>

            {/* Weight tracker */}
            <WeightTracker darkMode={darkMode} />

            {/* Macro split */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 transition-colors duration-200">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Today&apos;s Macro Split</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Protein", value: totals.protein, cals: 4, bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", pct: "text-emerald-400 dark:text-emerald-600" },
                  { label: "Carbs",   value: totals.carbs,   cals: 4, bg: "bg-blue-50 dark:bg-blue-900/20",       text: "text-blue-700 dark:text-blue-400",       pct: "text-blue-400 dark:text-blue-600"       },
                  { label: "Fat",     value: totals.fats,    cals: 9, bg: "bg-amber-50 dark:bg-amber-900/20",     text: "text-amber-700 dark:text-amber-400",     pct: "text-amber-400 dark:text-amber-600"     },
                ].map(({ label, value, cals, bg, text, pct }) => {
                  const pctVal = totals.calories > 0 ? Math.round(((value * cals) / totals.calories) * 100) : 0;
                  return (
                    <div key={label} className={`${bg} rounded-xl p-3 text-center transition-colors duration-200`}>
                      <p className={`text-lg font-bold ${text}`}>{Math.round(value)}g</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
                      <p className={`text-[11px] font-semibold mt-0.5 ${pct}`}>{pctVal}%</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ad / premium banner */}
            {isPremium ? null : <AdBanner />}
            {!isPremium && <PremiumBanner />}

            {/* Logout */}
            <button onClick={handleLogout} className="w-full border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 rounded-2xl py-3 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              Log Out
            </button>
          </div>
        )}
      </main>

      <BottomTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
