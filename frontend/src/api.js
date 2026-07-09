import axios from "axios";

// In Capacitor (native app), relative URLs resolve to capacitor://localhost
// which doesn't reach the backend — use the live server URL instead.
const isCapacitor = !!(window.Capacitor?.isNativePlatform?.());
const BASE = isCapacitor ? "https://www.leanhostzone.com" : "";

const getConfig = () => ({
  headers: { Authorization: localStorage.getItem("token") },
});

export const api = {
  // Auth
  login:               (form)   => axios.post(`${BASE}/api/auth/login`, form),
  register:            (form)   => axios.post(`${BASE}/api/auth/register`, form),
  getProfile:          ()       => axios.get(`${BASE}/api/auth/profile`, getConfig()),
  updateGoals:         (goals)  => axios.put(`${BASE}/api/auth/goals`, goals, getConfig()),
  verifyEmail:         (token)  => axios.get(`${BASE}/api/auth/verify/${token}`),
  resendVerification:  (email)  => axios.post(`${BASE}/api/auth/resend-verification`, { email }),

  // Food entries
  getFoodEntries:  (date)       => axios.get(`${BASE}/api/food/${date}`, getConfig()),
  getFoodTotals:   (date)       => axios.get(`${BASE}/api/food/totals/${date}`, getConfig()),
  addFoodEntry:    (entry)      => axios.post(`${BASE}/api/food`, entry, getConfig()),
  updateFoodEntry: (id, entry)  => axios.put(`${BASE}/api/food/${id}`, entry, getConfig()),
  deleteFoodEntry: (id)         => axios.delete(`${BASE}/api/food/${id}`, getConfig()),
  getWeeklyData:   (startDate)  => axios.get(`${BASE}/api/food/weekly/${startDate}`, getConfig()),

  // USDA food search
  searchFoods:     (query)      => axios.get(`${BASE}/api/usda/search?q=${encodeURIComponent(query)}`),
  getFoodByBarcode: (code)      => axios.get(`${BASE}/api/usda/barcode/${code}`),

  // AI food analysis
  analyzeFood: (imageData, mediaType) =>
    axios.post(`${BASE}/api/ai/analyze-food`, { imageData, mediaType }, getConfig()),

  // Payments
  createCheckoutSession: () =>
    axios.post(`${BASE}/api/payments/create-checkout-session`, {}, getConfig()),

  // Weight tracking
  getWeightEntries:  ()         => axios.get(`${BASE}/api/weight`, getConfig()),
  addWeightEntry:    (entry)    => axios.post(`${BASE}/api/weight`, entry, getConfig()),
  updateWeightEntry: (id, entry)=> axios.put(`${BASE}/api/weight/${id}`, entry, getConfig()),
  deleteWeightEntry: (id)       => axios.delete(`${BASE}/api/weight/${id}`, getConfig()),
};
