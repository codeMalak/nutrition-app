const mongoose = require("mongoose");

// A registration that hasn't proven ownership of its email yet. No `User`
// document is created until the verification link is clicked — so a bot
// hammering /register with junk/fake addresses never leaves a persistent
// account behind, only a short-lived pending row that expires on its own.
const pendingSignupSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // already bcrypt-hashed
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// MongoDB's TTL monitor deletes a document once its `expiresAt` is in the
// past — no manual cleanup job needed.
pendingSignupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PendingSignup", pendingSignupSchema);
