const KEY = "nutritrack_food_history";
const MAX = 20;

export function getFoodHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveFoodToHistory({ name, calories, protein, fats, carbs }) {
  if (!name) return;
  const history = getFoodHistory();
  const filtered = history.filter(
    (h) => h.name.toLowerCase() !== name.toLowerCase()
  );
  const updated = [
    { name, calories: Number(calories) || 0, protein: Number(protein) || 0,
      fats: Number(fats) || 0, carbs: Number(carbs) || 0, addedAt: Date.now() },
    ...filtered,
  ].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(updated));
}
