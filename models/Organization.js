const mongoose = require("mongoose");

const orgSchema = new mongoose.Schema({
  name: String
});

module.exports = mongoose.model("Organization", orgSchema);
