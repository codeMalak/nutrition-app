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
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date }
});

module.exports = mongoose.model("User", userSchema);
