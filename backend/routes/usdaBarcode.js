const express = require("express");
const axios = require("axios");

const router = express.Router();

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

    // Prefer exact GTIN/UPC match (strip leading zeros for comparison); fall back to first result
    const stripped = barcode.replace(/^0+/, "");
    const food =
      foods.find((f) => f.gtinUpc && f.gtinUpc.replace(/^0+/, "") === stripped) ||
      foods[0];

    let calories = 0, protein = 0, fats = 0, carbs = 0;

    (food.foodNutrients || []).forEach((n) => {
      const name = n.nutrientName || n.nutrient?.name || "";
      const value = n.value ?? n.amount ?? 0;
      if (name === "Energy") calories = value;
      if (name === "Protein") protein = value;
      if (name === "Total lipid (fat)") fats = value;
      if (name === "Carbohydrate, by difference") carbs = value;
    });

    res.json({
      name: food.description || "Unknown Product",
      brand: food.brandOwner || food.brandName || null,
      calories,
      protein,
      fats,
      carbs,
      servingSize: food.servingSize || 100,
      servingUnit: food.servingSizeUnit || "g",
    });
  } catch (err) {
    console.error("Barcode lookup error:", err.message);
    res.status(500).json({ error: "Barcode lookup failed" });
  }
});

module.exports = router;
