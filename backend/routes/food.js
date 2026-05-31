const express = require("express");
const FoodEntry = require("../models/FoodEntry");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, calories, protein, fats, carbs, date, mealType } = req.body;
    const newEntry = await FoodEntry.create({
      userId: req.user.id,
      name,
      calories,
      protein,
      fats,
      carbs,
      date,
      mealType: mealType || "snacks"
    });
    res.json(newEntry);
  } catch (err) {
    res.status(500).json({ error: "Error adding food entry" });
  }
});

router.get("/weekly/:startDate", authMiddleware, async (req, res) => {
  try {
    const dates = [];
    const start = new Date(req.params.startDate + "T12:00:00");
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const entries = await FoodEntry.find({
      userId: req.user.id,
      date: { $in: dates }
    });

    const daily = dates.map(date => {
      const dayEntries = entries.filter(e => e.date === date);
      return {
        date,
        calories: dayEntries.reduce((acc, e) => acc + (e.calories || 0), 0),
        protein: dayEntries.reduce((acc, e) => acc + (e.protein || 0), 0),
        fats: dayEntries.reduce((acc, e) => acc + (e.fats || 0), 0),
        carbs: dayEntries.reduce((acc, e) => acc + (e.carbs || 0), 0)
      };
    });

    res.json(daily);
  } catch (err) {
    res.status(500).json({ error: "Error fetching weekly data" });
  }
});

router.get("/totals/:date", authMiddleware, async (req, res) => {
  try {
    const entries = await FoodEntry.find({
      userId: req.user.id,
      date: req.params.date
    });

    const totals = entries.reduce(
      (acc, item) => {
        acc.calories += item.calories || 0;
        acc.protein += item.protein || 0;
        acc.fats += item.fats || 0;
        acc.carbs += item.carbs || 0;
        return acc;
      },
      { calories: 0, protein: 0, fats: 0, carbs: 0 }
    );

    res.json(totals);
  } catch (err) {
    res.status(500).json({ error: "Error calculating totals" });
  }
});

router.get("/:date", authMiddleware, async (req, res) => {
  try {
    const entries = await FoodEntry.find({
      userId: req.user.id,
      date: req.params.date
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Error fetching entries" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, calories, protein, fats, carbs, mealType } = req.body;
    const entry = await FoodEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name, calories, protein, fats, carbs, mealType },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: "Entry not found" });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Error updating food entry" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await FoodEntry.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting entry" });
  }
});

module.exports = router;
