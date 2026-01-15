const AuditLog = require("../models/AuditLog");

/**
 * Logs an action to the AuditLog collection
 * @param {Object} param0
 * @param {String} param0.userId - User performing the action
 * @param {String} param0.action - Action type
 * @param {String} param0.details - Optional details
 * @param {String} param0.targetId - Optional target user/resource id
 */
async function logAction({ userId, action, details = "", targetId = null }) {
  try {
    await AuditLog.create({
      user_id: userId,
      action,
      details,
      target_id: targetId,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}

module.exports = logAction;
