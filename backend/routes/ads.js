const express = require("express");
const axios   = require("axios");

const router = express.Router();

const AD_SCRIPT = "https://pl29604187.effectivecpmnetwork.com/be31c58e35dac8eeb0699a8eb0551d17/invoke.js";

// Proxy the ad script through your own domain so ad blockers
// that filter known ad-network domains won't block it.
router.get("/v1/metrics.js", async (req, res) => {
  try {
    const upstream = await axios.get(AD_SCRIPT, {
      headers: { "User-Agent": req.headers["user-agent"] || "Mozilla/5.0" },
      timeout: 8000,
    });
    res.set("Content-Type",  "application/javascript");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(upstream.data);
  } catch (err) {
    // Return empty script silently — never show an error to the browser
    res.set("Content-Type", "application/javascript");
    res.status(200).send("// ok");
  }
});

module.exports = router;
