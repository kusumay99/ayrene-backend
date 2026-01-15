const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff", "user"], default: "user" },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
