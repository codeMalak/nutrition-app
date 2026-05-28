require("dotenv").config();
const mongoose = require("mongoose");
const FoodDatabase = require("./models/FoodDatabase");

mongoose.connect(process.env.MONGO_URI);

async function seed() {

  await FoodDatabase.deleteMany({});

  await FoodDatabase.insertMany([
    {
      name: "Chicken Breast 100g",
      calories: 165,
      protein: 31,
      fats: 3.6,
      carbs: 0
    },
    {
      name: "White Rice 1 cup",
      calories: 205,
      protein: 4,
      fats: 0.4,
      carbs: 45
    },
    {
      name: "Egg",
      calories: 78,
      protein: 6,
      fats: 5,
      carbs: 0.6
    }
  ]);

  console.log("Food database seeded");
  process.exit();
}

seed();