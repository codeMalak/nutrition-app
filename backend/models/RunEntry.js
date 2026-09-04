const mongoose = require("mongoose");

// All measurements are stored in canonical SI units (meters, seconds, m/s)
// so the frontend can freely convert to mi/km for display without any
// server-side unit juggling. `mileSplits`/`kmSplits` are both recorded live
// during a GPS run so "fastest mile" style PRs work regardless of which
// display unit the user prefers.
const runEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date:   { type: String, required: true }, // YYYY-MM-DD, local start date
    title:  { type: String, default: "" },
    note:   { type: String, default: "" },
    source: { type: String, enum: ["gps", "manual"], default: "gps" },

    startTime: { type: Date, required: true },
    endTime:   { type: Date, required: true },
    duration:  { type: Number, required: true, min: 0 }, // moving seconds (excludes auto-pause)
    distance:  { type: Number, required: true, min: 0 }, // meters

    maxSpeed:      { type: Number, default: 0 }, // m/s
    elevationGain: { type: Number, default: 0 }, // meters
    elevationLoss: { type: Number, default: 0 }, // meters
    calories:      { type: Number, default: 0 },

    mileSplits: [{ index: Number, duration: Number, _id: false }],
    kmSplits:   [{ index: Number, duration: Number, _id: false }],

    route: [{
      lat: Number,
      lng: Number,
      elevation: Number,
      t: Number,        // ms epoch
      accuracy: Number,
      _id: false,
    }],
  },
  { timestamps: true }
);

runEntrySchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("RunEntry", runEntrySchema);
