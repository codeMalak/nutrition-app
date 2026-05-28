const mongoose = require("mongoose");

const FoodDatabaseSchema = new mongoose.Schema({
    name: String,
    calories: Number,
    protein: Number,
    fats: Number,
    carbs: Number
});

module.exports = mongoose.model("FoodDatabase", FoodDatabaseSchema);