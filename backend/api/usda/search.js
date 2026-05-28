const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/search", async (req, res) => {
  try {

    const query = req.query.q;

    const response = await axios.get(
      "https://api.nal.usda.gov/fdc/v1/foods/search",
      {
        params: {
          query: query,
          pageSize: 10,
          api_key: process.env.USDA_API_KEY
        }
      }
    );

    const foods = response.data.foods.map(food => {

      const getNutrient = (id, name) => {

        if (!food.foodNutrients) return 0;

        const nutrient = food.foodNutrients.find(n =>
          n.nutrientId === id ||
          n.nutrient?.id === id ||
          n.nutrientName === name ||
          n.nutrient?.name === name
        );

        if (!nutrient) return 0;

        return Number(
          nutrient.value ||
          nutrient.amount ||
          nutrient.nutrient?.amount ||
          0
        );
      };

      return {
        id: food.fdcId,

        name: food.description || "Unknown Food",

        calories: getNutrient(1008, "Energy"),
        protein: getNutrient(1003, "Protein"),
        carbs: getNutrient(1005, "Carbohydrate, by difference"),
        fats: getNutrient(1004, "Total lipid (fat)"),

        servingSize: food.servingSize || 100,
        servingUnit: food.servingSizeUnit || "g",

        brand: food.brandOwner || null
      };
    });

    res.json(foods);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Food search failed" });
  }
});

module.exports = router;