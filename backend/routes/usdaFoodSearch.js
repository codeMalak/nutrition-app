const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/search", async (req, res) => {

  const query = req.query.q;

  try {

    const response = await axios.get(
      "https://api.nal.usda.gov/fdc/v1/foods/search",
      {
        params: {
          api_key: process.env.USDA_API_KEY,
          query: query,
          pageSize: 10
        }
      }
    );

    const foods = response.data.foods.map(food => {

      let calories = 0;
      let protein = 0;
      let fats = 0;
      let carbs = 0;

      if (food.foodNutrients) {

        food.foodNutrients.forEach(n => {

          const name = n.nutrientName || n.nutrient?.name;
          const value = n.value ?? n.amount ?? 0;

          if (name === "Energy") calories = value;
          if (name === "Protein") protein = value;
          if (name === "Total lipid (fat)") fats = value;
          if (name === "Carbohydrate, by difference") carbs = value;

        });

      }

      return {
        id: food.fdcId,
        name: food.description || "Unknown Food",
        calories,
        protein,
        fats,
        carbs,
        servingSize: food.servingSize || 100,
        servingUnit: food.servingSizeUnit || "g",
        brand: food.brandOwner || null
      };

    });

    res.json(foods);

  } catch (err) {
    console.error("USDA ERROR:", err.message);
    res.status(500).json({ error: "USDA search failed" });
  }

});

module.exports = router;