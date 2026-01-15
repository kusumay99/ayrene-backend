// models/Team.js
const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organisation: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Team", teamSchema);
