const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dailyCalorieGoal: { type: Number, default: 2000 },
  macroGoals: {
    protein: { type: Number, default: 150 },
    fats: { type: Number, default: 70 },
    carbs: { type: Number, default: 200 }
  },
  // Every User is created only after verifying email ownership (see
  // PendingSignup) — this stays around for pre-existing accounts from
  // before that was true, and for reference, but nothing gates on it.
  emailVerified: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", userSchema);
