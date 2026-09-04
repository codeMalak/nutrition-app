const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const foodRoutes = require("./routes/food");
const FoodDatabaseRoutes = require("./routes/foodDatabase");
const usdaSearchRoutes = require("./routes/usdaFoodSearch");
const barcodeRoutes = require("./routes/usdaBarcode");
const aiRoutes = require("./routes/ai");
const paymentRoutes = require("./routes/payments");
const weightRoutes  = require("./routes/weight");
const adsRoutes     = require("./routes/ads");
const runningRoutes = require("./routes/running");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://www.leanhostzone.com",
    "capacitor://localhost",
    "ionic://localhost",
    "http://localhost",
  ],
  credentials: true,
}));

// Stripe webhook needs raw body — must be registered BEFORE express.json()
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// Raised from Express's 100kb default — GPS route points from a tracked run
// (and base64 photo uploads from the AI food analyzer) can exceed that.
app.use(express.json({ limit: "3mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/fooddb", FoodDatabaseRoutes);
app.use("/api/usda", usdaSearchRoutes);
app.use("/api/usda", barcodeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/weight",   weightRoutes);
app.use("/api/running",  runningRoutes);
app.use("/api",          adsRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.json({ message: "Nutrition API Running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});
