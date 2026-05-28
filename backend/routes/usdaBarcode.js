const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/barcode/:code", async (req, res) => {
  try {

    const barcode = req.params.code;

    const response = await axios.get(
      `https://api.nal.usda.gov/fdc/v1/foods/search`,
      {
        params: {
          api_key: process.env.USDA_API_KEY,
          query: barcode
        }
      }
    );

    const food = response.data.foods[0];

    if (!food) {
      return res.status(404).json({ error: "Food not found" });
    }

    let calories = 0;
    let protein = 0;
    let fats = 0;
    let carbs = 0;

    food.foodNutrients.forEach(n => {
      if (n.nutrientName === "Energy") calories = n.value;
      if (n.nutrientName === "Protein") protein = n.value;
      if (n.nutrientName === "Total lipid (fat)") fats = n.value;
      if (n.nutrientName === "Carbohydrate, by difference") carbs = n.value;
    });

    res.json({
      name: food.description,
      calories,
      protein,
      fats,
      carbs
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Barcode lookup failed" });
  }
});

module.exports = router;