const express = require("express");
const WeightEntry = require("../models/WeightEntry");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const entries = await WeightEntry.find({ userId: req.user.id }).sort({ date: 1, createdAt: 1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Error fetching weight entries" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { date, weight, unit, note } = req.body;
    const entry = await WeightEntry.create({
      userId: req.user.id,
      date,
      weight,
      unit: unit || "lbs",
      note: note || "",
    });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Error adding weight entry" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { date, weight, unit, note } = req.body;
    const entry = await WeightEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { date, weight, unit, note },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: "Entry not found" });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Error updating weight entry" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await WeightEntry.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting weight entry" });
  }
});

module.exports = router;
