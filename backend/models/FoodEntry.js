const mongoose = require("mongoose");

const foodEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: { type: String, required: true },
  name: { type: String, required: true },
  calories: Number,
  protein: Number,
  fats: Number,
  carbs: Number,
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snacks"],
    default: "snacks"
  }
});

module.exports = mongoose.model("FoodEntry", foodEntrySchema);