import axios from "axios";

// Capacitor webview always serves from capacitor:// protocol — use absolute URL
const BASE = window.location.protocol === "capacitor:"
  ? "https://www.leanhostzone.com"
  : "";

// Catches a token the backend rejects for any reason not visible client-side
// (secret rotation, account deleted, etc.) — the client-side expiry check in
// utils/auth.js only catches the token's own declared expiry. Either way,
// nothing should keep rendering an authenticated page with a token that
// doesn't actually authenticate.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

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
  searchFoods:     (query, page = 1) => axios.get(`${BASE}/api/usda/search?q=${encodeURIComponent(query)}&page=${page}`),
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

  // Running tracker
  getRunEntries:  ()         => axios.get(`${BASE}/api/running`, getConfig()),
  addRunEntry:    (entry)    => axios.post(`${BASE}/api/running`, entry, getConfig()),
  updateRunEntry: (id, entry)=> axios.put(`${BASE}/api/running/${id}`, entry, getConfig()),
  deleteRunEntry: (id)       => axios.delete(`${BASE}/api/running/${id}`, getConfig()),
};
