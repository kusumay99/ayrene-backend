const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Message = require("../models/Message");
const auth = require("../middleware/auth");

/* Admin only middleware */
const adminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access only" });
  next();
};

/* GET /api/admin/audit */
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const userCreations = await User.find().select("name email role createdAt").sort({ createdAt: -1 });
    const messages = await Message.find()
      .populate("user_id", "name email")
      .select("original_text processed_text detected_language ai_mode timestamp createdAt")
      .sort({ createdAt: -1 })
      .limit(50);

    const logins = await User.find().select("name email lastLogin").sort({ lastLogin: -1 }).limit(50);

    res.json({ userCreations, messages, logins });
  } catch (err) {
    console.error("Audit logs error:", err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

module.exports = router;
