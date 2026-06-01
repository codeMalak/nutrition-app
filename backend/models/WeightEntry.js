const mongoose = require("mongoose");

const weightEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date:   { type: String, required: true }, // YYYY-MM-DD
    weight: { type: Number, required: true },
    unit:   { type: String, enum: ["lbs", "kg"], default: "lbs" },
    note:   { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WeightEntry", weightEntrySchema);
