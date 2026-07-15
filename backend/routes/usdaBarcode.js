const express = require("express");
const axios = require("axios");

const router = express.Router();

// USDA /foods/search returns nutrients per 100g for ALL food types.
// Branded foods have a servingSize field (e.g. 28g). We scale nutrients
// to per-serving so the values match what's printed on the package label.
function scaleToServing(raw, servingSize) {
  const f = (servingSize || 100) / 100;
  return {
    calories: Math.round((raw.calories || 0) * f),
    protein:  parseFloat(((raw.protein  || 0) * f).toFixed(1)),
    fats:     parseFloat(((raw.fats     || 0) * f).toFixed(1)),
    carbs:    parseFloat(((raw.carbs    || 0) * f).toFixed(1)),
  };
}

router.get("/barcode/:code", async (req, res) => {
  try {
    const barcode = req.params.code;

    const response = await axios.get("https://api.nal.usda.gov/fdc/v1/foods/search", {
      params: {
        api_key: process.env.USDA_API_KEY,
        query: barcode,
        dataType: "Branded",
        pageSize: 5,
      },
    });

    const foods = response.data.foods || [];
    if (!foods.length) return res.status(404).json({ error: "Food not found" });

    // Prefer exact GTIN/UPC match (strip leading zeros); fall back to first result
    const stripped = barcode.replace(/^0+/, "");
    const food =
      foods.find((f) => f.gtinUpc && f.gtinUpc.replace(/^0+/, "") === stripped) ||
      foods[0];

    const raw = { calories: 0, protein: 0, fats: 0, carbs: 0 };
    (food.foodNutrients || []).forEach((n) => {
      const name  = n.nutrientName || n.nutrient?.name || "";
      const value = n.value ?? n.amount ?? 0;
      if (name === "Energy")                       raw.calories = value;
      if (name === "Protein")                      raw.protein  = value;
      if (name === "Total lipid (fat)")            raw.fats     = value;
      if (name === "Carbohydrate, by difference")  raw.carbs    = value;
    });

    const servingSize = food.servingSize || 100;
    const scaled = scaleToServing(raw, servingSize);

    res.json({
      name:        food.description    || "Unknown Product",
      brand:       food.brandOwner     || food.brandName || null,
      ...scaled,
      servingSize,
      servingUnit: food.servingSizeUnit || "g",
    });
  } catch (err) {
    console.error("Barcode lookup error:", err.message);
    res.status(500).json({ error: "Barcode lookup failed" });
  }
});

module.exports = router;
