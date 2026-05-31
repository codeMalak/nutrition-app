import axios from "axios";

const getConfig = () => ({
  headers: { Authorization: localStorage.getItem("token") },
});

export const api = {
  // Auth
  login: (form) => axios.post("/api/auth/login", form),
  register: (form) => axios.post("/api/auth/register", form),
  getProfile: () => axios.get("/api/auth/profile", getConfig()),
  updateGoals: (goals) => axios.put("/api/auth/goals", goals, getConfig()),
  verifyEmail: (token) => axios.get(`/api/auth/verify/${token}`),
  resendVerification: (email) => axios.post("/api/auth/resend-verification", { email }),

  // Food entries
  getFoodEntries: (date) => axios.get(`/api/food/${date}`, getConfig()),
  getFoodTotals: (date) => axios.get(`/api/food/totals/${date}`, getConfig()),
  addFoodEntry: (entry) => axios.post("/api/food", entry, getConfig()),
  updateFoodEntry: (id, entry) => axios.put(`/api/food/${id}`, entry, getConfig()),
  deleteFoodEntry: (id) => axios.delete(`/api/food/${id}`, getConfig()),
  getWeeklyData: (startDate) => axios.get(`/api/food/weekly/${startDate}`, getConfig()),

  // USDA food search
  searchFoods: (query) => axios.get(`/api/usda/search?q=${encodeURIComponent(query)}`),
  getFoodByBarcode: (code) => axios.get(`/api/usda/barcode/${code}`),

  // AI food analysis
  analyzeFood: (imageData, mediaType) =>
    axios.post("/api/ai/analyze-food", { imageData, mediaType }, getConfig()),
};
