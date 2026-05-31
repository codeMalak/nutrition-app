const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 10000,
  });
}

async function sendVerificationEmail(email, token) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  // Always log the link so the server console works as a fallback
  console.log(`[VERIFY] Link for ${email}: ${verifyUrl}`);

  const transporter = createTransporter();
  await Promise.race([
    transporter.sendMail({
      from: `"NutriTrack" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify your NutriTrack account",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#4f46e5;margin-bottom:8px">Welcome to NutriTrack!</h2>
          <p style="color:#374151;margin-bottom:24px">Click the button below to verify your email address. The link expires in 24 hours.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">
            Verify Email
          </a>
          <p style="color:#9ca3af;font-size:13px;margin-top:24px">If you didn't create a NutriTrack account you can safely ignore this email.</p>
        </div>
      `,
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email timed out after 10s")), 10000)
    ),
  ]);
}

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await User.create({
      email,
      password: hashedPassword,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: expires,
    });

    // Fire email but don't let it block or hang the response
    sendVerificationEmail(email, verificationToken).catch((err) => {
      console.error(`[EMAIL ERROR] ${err.message}`);
    });

    res.json({ message: "Account created. Please check your email to verify your account." });
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

router.get("/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: req.params.token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification link." });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: "Email verified! You can now log in." });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, emailVerified: false });

    if (!user) {
      return res.json({ message: "If that account exists and is unverified, a new email has been sent." });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    sendVerificationEmail(email, verificationToken).catch((err) => {
      console.error(`[EMAIL ERROR] ${err.message}`);
    });

    res.json({ message: "Verification email resent. Check your spam folder too." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/goals", authMiddleware, async (req, res) => {
  try {
    const { dailyCalorieGoal, macroGoals } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { dailyCalorieGoal, macroGoals },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/test-email", async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: "Provide a 'to' email address" });
  try {
    const transporter = createTransporter();
    await transporter.verify();
    await transporter.sendMail({
      from: `"NutriTrack Test" <${process.env.SMTP_USER}>`,
      to,
      subject: "NutriTrack SMTP Test",
      text: "If you received this, your SMTP config is working correctly.",
    });
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
