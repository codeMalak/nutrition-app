const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    // 401, not 400 — an invalid/expired token is an auth failure (jwt.verify
    // throws this same way for a bad signature and for TokenExpiredError),
    // not a malformed request. The frontend's axios interceptor specifically
    // watches for 401 to force a clean logout — a 400 here would silently
    // slip past it and leave the app rendering an authenticated page whose
    // API calls just keep failing.
    res.status(401).json({ error: "Invalid or expired token" });
  }
};