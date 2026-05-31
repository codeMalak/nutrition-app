const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT =
  "You are a nutrition expert. When given a food photo, identify every visible food item and estimate its nutritional content based on the visible portion. Be practical — assume typical serving sizes when portions are unclear.";

router.post("/analyze-food", authMiddleware, async (req, res) => {
  try {
    const { imageData, mediaType } = req.body;
    if (!imageData) return res.status(400).json({ error: "No image data provided" });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: imageData,
              },
            },
            {
              type: "text",
              text: 'List every food item you can see and estimate its nutrition for the visible portion. Return ONLY a valid JSON array — no other text:\n[\n  {"name":"Food Name","calories":250,"protein":25,"carbs":10,"fats":8}\n]\nIf no food is visible return [].',
            },
          ],
        },
      ],
    });

    const text = message.content[0].text.trim();
    const match = text.match(/\[[\s\S]*\]/);
    const foods = match ? JSON.parse(match[0]) : [];
    res.json({ foods });
  } catch (err) {
    console.error("AI analysis error:", err);
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

module.exports = router;
