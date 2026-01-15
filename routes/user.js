const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const User = require("../models/User");
const Message = require("../models/Message");
const AuditLog = require("../models/AuditLog");

/**
 * GET /api/user/dashboard
 * Get user dashboard info (profile, recent messages, stats, admin activities)
 */
router.get("/dashboard", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1️⃣ User profile
    const user = await User.findById(userId)
      .select("name email role team createdAt")
      .populate("team", "name")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2️⃣ Message stats
    const totalMessages = await Message.countDocuments({ user_id: userId });

    // 3️⃣ Recent 5 messages
    const recentMessages = await Message.find({ user_id: userId })
      .sort({ timestamp: -1 }) // use schema timestamp
      .limit(5)
      .select("original_text processed_text ai_mode detected_language timestamp")
      .lean();

    // 4️⃣ Admin activities affecting this user
    const adminActivities = await AuditLog.find({ target_user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("performed_by", "name role")
      .lean();

    // Prevent caching
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    return res.status(200).json({
      profile: user,
      stats: { totalMessages },
      recentMessages,
      adminActivities,
    });
  } catch (err) {
    console.error("User dashboard error:", err.message);
    return res.status(500).json({ error: "Unable to load dashboard" });
  }
});

/**
 * GET /api/user/messages
 * Fetch all messages for logged-in user
 */
router.get("/messages", auth, async (req, res) => {
  try {
    const messages = await Message.find({ user_id: req.user._id })
      .sort({ timestamp: -1 }) // newest first
      .select("original_text processed_text ai_mode detected_language timestamp")
      .lean();

    res.set("Cache-Control", "no-store");
    return res.json(messages);
  } catch (err) {
    console.error("User messages error:", err);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});

module.exports = router;
