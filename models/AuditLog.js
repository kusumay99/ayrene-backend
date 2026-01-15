// models/AuditLog.js
const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },

    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    target_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    details: {
      type: String,
    },

    metadata: {
      type: Object,
    },
  },
  {
    timestamps: true, // ✅ creates createdAt & updatedAt
  }
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);
