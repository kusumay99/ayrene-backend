const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Message = require("../models/Message");
const Team = require("../models/Team");
const AuditLog = require("../models/AuditLog");

const auth = require("../middleware/auth");
const logAction = require("../utils/auditLogger");

/* ================= ADMIN ONLY ================= */
const adminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
};

/* ================= DASHBOARD ================= */
router.get("/dashboard", auth, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalMessages, totalTeams] = await Promise.all([
      User.countDocuments(),
      Message.countDocuments(),
      Team.countDocuments(),
    ]);

    res.json({ totalUsers, totalMessages, totalTeams });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

/* ================= USERS ================= */

// GET all users
router.get("/users", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("team", "name organisation")
      .lean();

    res.json(users);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET single user
router.get("/users/:id", auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("team", "name organisation")
      .lean();

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Fetch user error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// CREATE user
router.post("/users", auth, adminOnly, async (req, res) => {
  try {
    let { name, email, password, role, team } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const allowedRoles = ["admin", "manager", "staff"];
    role = allowedRoles.includes(role) ? role : "staff";

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      team: team || null,
      isActive: true,
    });

    await logAction({
      userId: req.user._id,
      action: "CREATE_USER",
      targetId: user._id,
      details: `Created user ${email}`,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team,
      },
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// UPDATE user (activate/deactivate)
router.put("/users/:id", auth, adminOnly, async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    await logAction({
      userId: req.user._id,
      action: "UPDATE_USER",
      targetId: user._id,
      details: `Set isActive=${isActive} for ${user.email}`,
    });

    res.json(user);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE user
router.delete("/users/:id", auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    await logAction({
      userId: req.user._id,
      action: "DELETE_USER",
      targetId: user._id,
      details: `Deleted user ${user.email}`,
    });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

/* ================= TEAMS ================= */

router.get("/teams", auth, adminOnly, async (req, res) => {
  try {
    const teams = await Team.find().lean();

    const enriched = await Promise.all(
      teams.map(async (team) => {
        const users = await User.find({ team: team._id })
          .select("name email role")
          .lean();
        return { ...team, users };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("Fetch teams error:", err);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

router.post("/teams", auth, adminOnly, async (req, res) => {
  try {
    const { name, organisation } = req.body;

    const team = await Team.create({ name, organisation });

    await logAction({
      userId: req.user._id,
      action: "CREATE_TEAM",
      targetId: team._id,
      details: `Created team ${name}`,
    });

    res.status(201).json(team);
  } catch (err) {
    console.error("Create team error:", err);
    res.status(500).json({ error: "Failed to create team" });
  }
});

router.put("/teams/:id", auth, adminOnly, async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!team) return res.status(404).json({ error: "Team not found" });

    await logAction({
      userId: req.user._id,
      action: "UPDATE_TEAM",
      targetId: team._id,
      details: `Updated team ${team.name}`,
    });

    res.json(team);
  } catch (err) {
    console.error("Update team error:", err);
    res.status(500).json({ error: "Failed to update team" });
  }
});

router.delete("/teams/:id", auth, adminOnly, async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });

    await logAction({
      userId: req.user._id,
      action: "DELETE_TEAM",
      targetId: team._id,
      details: `Deleted team ${team.name}`,
    });

    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    console.error("Delete team error:", err);
    res.status(500).json({ error: "Failed to delete team" });
  }
});

/* ================= MESSAGES ================= */

// GET /api/admin/messages
router.get("/messages", auth, adminOnly, async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("user_id", "name email role")
      .sort({ timestamp: -1 })
      .lean();

    res.json(
      messages.map((m) => ({
        ...m,
        user: m.user_id, // 👈 frontend expects `user`
      }))
    );
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});


// SEND message
// POST /api/admin/messages
router.post("/messages", auth, adminOnly, async (req, res) => {
  try {
    const {
      userId,
      text,
      original_text,
      processed_text,
      ai_mode,
      detected_language,
    } = req.body;

    const messageText = original_text || text;

    if (!userId || !messageText) {
      return res.status(400).json({
        error: "userId and message text are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const message = await Message.create({
      user_id: userId,                     // ✅ FIXED
      original_text: messageText,
      processed_text: processed_text || messageText,
      ai_mode: ai_mode || "manual",
      detected_language: detected_language || "unknown",
      timestamp: new Date(),
    });

    await AuditLog.create({
      action: "ADMIN_MESSAGE_CREATED",
      performed_by: req.user._id,
      target_user: userId,
      metadata: { messageId: message._id },
    });

    res.status(201).json(message);
  } catch (err) {
    console.error("Admin message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});


/* ================= AUDIT LOGS ================= */

router.get("/audit", auth, adminOnly, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("performed_by", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    res.json(logs);
  } catch (err) {
    console.error("Fetch audit logs error:", err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

module.exports = router;
