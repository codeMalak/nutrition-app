const express = require("express");
const RunEntry = require("../models/RunEntry");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const entries = await RunEntry.find({ userId: req.user.id }).sort({ startTime: 1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Error fetching run entries" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      date, title, note, source, startTime, endTime, duration, distance,
      maxSpeed, elevationGain, elevationLoss, calories, mileSplits, kmSplits, route,
    } = req.body;

    if (!date || !startTime || !endTime || duration == null || distance == null) {
      return res.status(400).json({ error: "Missing required run fields" });
    }

    const entry = await RunEntry.create({
      userId: req.user.id,
      date,
      title: title || "",
      note: note || "",
      source: source === "manual" ? "manual" : "gps",
      startTime,
      endTime,
      duration,
      distance,
      maxSpeed: maxSpeed || 0,
      elevationGain: elevationGain || 0,
      elevationLoss: elevationLoss || 0,
      calories: calories || 0,
      mileSplits: mileSplits || [],
      kmSplits: kmSplits || [],
      route: route || [],
    });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Error saving run entry" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, note, date, distance, duration, calories } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (note !== undefined) update.note = note;
    if (date !== undefined) update.date = date;
    if (distance !== undefined) update.distance = distance;
    if (duration !== undefined) update.duration = duration;
    if (calories !== undefined) update.calories = calories;

    const entry = await RunEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      update,
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: "Run not found" });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Error updating run entry" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await RunEntry.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting run entry" });
  }
});

module.exports = router;
