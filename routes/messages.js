const router = require("express").Router();
const Message = require("../models/Message");
const auth = require("../middleware/auth");
// ❌ disable enforcePolicy until stable
// const enforce = require("../middleware/enforcePolicy");
const ai = require("../services/aiProcessor");

/**
 * POST /api/messages
 * Create new message
 */
router.post("/", auth, async (req, res) => {
  try {
    console.log("POST /api/messages");
    console.log("User:", req.user);
    console.log("Body:", req.body);

    const { original_text, ai_mode } = req.body;

    if (!original_text || original_text.trim() === "") {
      return res.status(400).json({ error: "Message text required" });
    }

    // 🧠 AI processing (safe fallback)
    let result = {
      processed: original_text,
      lang: "en",
      time: 0,
    };

    try {
      result = await ai(original_text, ai_mode || "default");
    } catch (aiErr) {
      console.error("AI failed, fallback used");
    }

    const message = await Message.create({
      original_text,
      processed_text: result.processed,
      detected_language: result.lang,
      ai_mode: ai_mode || "default",
      user_id: req.user.id,
      team_id: req.user.teamId || null,
      organisation_id: req.user.organisationId || null,
      processing_time_ms: result.time || 0,
    });

    res.status(201).json(message);
  } catch (err) {
    console.error("Message POST error:", err);
    res.status(500).json({ error: "Message processing failed" });
  }
});

/**
 * GET /api/messages
 */
router.get("/", auth, async (req, res) => {
  try {
    const filters = {};

    // User → only own messages
    if (req.user.role === "user") {
      filters.user_id = req.user.id;
    }

    // Admin → optional filters
    if (req.user.role === "admin") {
      if (req.query.user_id) filters.user_id = req.query.user_id;
      if (req.query.team_id) filters.team_id = req.query.team_id;
    }

    const messages = await Message.find(filters).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error("Message GET error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

module.exports = router;
