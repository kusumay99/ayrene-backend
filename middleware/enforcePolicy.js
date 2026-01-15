const Team = require("../models/Team");

/**
 * Enforce AI policy based on team configuration
 * Safe version (no silent failures)
 */
module.exports = async function enforcePolicy(req, res, next) {
  try {
    const { ai_mode } = req.body;

    // 🔹 If no AI mode provided → allow default
    if (!ai_mode) {
      return next();
    }

    // 🔹 If user has no team → allow (important!)
    if (!req.user || !req.user.teamId) {
      console.warn("Policy: user has no team, skipping enforcement");
      return next();
    }

    // 🔹 Load team
    const team = await Team.findById(req.user.teamId);

    if (!team) {
      console.warn("Policy: team not found, skipping enforcement");
      return next(); // ❗ DO NOT BLOCK
    }

    // 🔹 If team has no restrictions → allow
    if (
      !Array.isArray(team.allowed_modes) ||
      team.allowed_modes.length === 0
    ) {
      return next();
    }

    // 🔹 Enforce allowed AI modes
    if (!team.allowed_modes.includes(ai_mode)) {
      return res.status(403).json({
        error: `AI mode '${ai_mode}' is not allowed for your team`,
      });
    }

    next();
  } catch (err) {
    console.error("Policy enforcement error:", err);
    // ❗ Never block user due to policy failure
    next();
  }
};
