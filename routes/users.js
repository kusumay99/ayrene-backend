const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const User = require("../models/User");
const Message = require("../models/Message");

/* =========================================================
   USER DASHBOARD  (Sprint 1 + Sprint 2)
   GET /api/users/dashboard
========================================================= */
router.get("/dashboard", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    /* ---------- USER PROFILE (Sprint 1) ---------- */
    const user = await User.findById(userId)
      .select("name email role")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    /* ---------- USER STATS (Sprint 1) ---------- */
    const totalMessages = await Message.countDocuments({
      user_id: userId,
    });

    /* ---------- MESSAGE HISTORY (Sprint 2) ---------- */
    const messages = await Message.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "original_text processed_text detected_language ai_mode session_id createdAt"
      )
      .lean();

    res.json({
      user,
      stats: {
        totalMessages,
      },
      messages,
    });
  } catch (err) {
    console.error("User dashboard error:", err);
    res.status(500).json({ error: "Failed to load user dashboard" });
  }
});

module.exports = router;
