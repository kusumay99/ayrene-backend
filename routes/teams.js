const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

/**
 * ===============================
 * CREATE USER (ADMIN ONLY)
 * Sprint 1 + Sprint 2
 * ===============================
 */
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, team } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      team: team || null,
      createdBy: req.user.id
    });

    /**
     * Sprint 2 — Audit Log
     */
    await AuditLog.create({
      action: "USER_CREATED",
      performedBy: req.user.id,
      targetUser: newUser._id,
      role: newUser.role,
      ipAddress: req.ip
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        team: newUser.team
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "User creation failed" });
  }
});

module.exports = router;
