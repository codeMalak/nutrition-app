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


const app = express();   // ✅ app created first

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/fooddb", FoodDatabaseRoutes);
app.use("/api/usda", usdaSearchRoutes);
app.use("/api/usda", barcodeRoutes);
app.use("/api/ai", aiRoutes);

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