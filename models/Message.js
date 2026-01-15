const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    original_text: { type: String, required: true },
    processed_text: { type: String, default: "" },
    detected_language: { type: String, default: "unknown" },
    ai_mode: { type: String, default: "manual" },
    timestamp: { type: Date, default: Date.now },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    session_id: { type: String, default: null },
    organisation_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organisation", default: null },
    team_id: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    processing_time_ms: { type: Number, default: null },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

module.exports = mongoose.model("Message", MessageSchema);
