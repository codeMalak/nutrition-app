const express = require("express");
const axios = require("axios");

const router = express.Router();

// USDA /foods/search returns nutrients per 100g for ALL food types.
// For Branded foods that include a servingSize we scale to per-serving so
// the displayed values match the Nutrition Facts label on the package.
// Foundation / SR Legacy foods have no meaningful servingSize so we keep
// them at the per-100g base and let the user adjust freely.
function normalise(food, rawNutrients) {
  const isBranded   = food.dataType === "Branded";
  const servingSize = food.servingSize || (isBranded ? null : 100);

  if (isBranded && servingSize) {
    const f = servingSize / 100;
    return {
      calories:    Math.round((rawNutrients.calories || 0) * f),
      protein:     parseFloat(((rawNutrients.protein  || 0) * f).toFixed(1)),
      fats:        parseFloat(((rawNutrients.fats     || 0) * f).toFixed(1)),
      carbs:       parseFloat(((rawNutrients.carbs    || 0) * f).toFixed(1)),
      servingSize,
      servingUnit: food.servingSizeUnit || "g",
    };
  }

  return {
    ...rawNutrients,
    servingSize:  100,
    servingUnit:  food.servingSizeUnit || "g",
  };
}

const PAGE_SIZE = 10;

router.get("/search", async (req, res) => {
  const query    = req.query.q;
  const page     = Math.max(1, parseInt(req.query.page) || 1);

  try {
    const response = await axios.get("https://api.nal.usda.gov/fdc/v1/foods/search", {
      params: {
        api_key:    process.env.USDA_API_KEY,
        query,
        pageSize:   PAGE_SIZE,
        pageNumber: page,
      },
    });

    const totalHits  = response.data.totalHits  || 0;
    const totalPages = Math.max(1, Math.ceil(totalHits / PAGE_SIZE));

    const foods = (response.data.foods || []).map((food) => {
      const raw = { calories: 0, protein: 0, fats: 0, carbs: 0 };

      (food.foodNutrients || []).forEach((n) => {
        const name  = n.nutrientName || n.nutrient?.name;
        const value = n.value ?? n.amount ?? 0;
        if (name === "Energy")                       raw.calories = value;
        if (name === "Protein")                      raw.protein  = value;
        if (name === "Total lipid (fat)")            raw.fats     = value;
        if (name === "Carbohydrate, by difference")  raw.carbs    = value;
      });

      const normed = normalise(food, raw);

      return {
        id:    food.fdcId,
        name:  food.description || "Unknown Food",
        brand: food.brandOwner  || null,
        ...normed,
      };
    });

    res.json({ foods, totalHits, currentPage: page, totalPages });
  } catch (err) {
    console.error("USDA ERROR:", err.message);
    res.status(500).json({ error: "USDA search failed" });
  }
});

module.exports = router;
