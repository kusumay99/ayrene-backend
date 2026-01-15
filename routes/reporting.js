const router = require("express").Router();
const Message = require("../models/Message");
const auth = require("../middleware/auth");

/**
 * GET /api/reporting/messages
 */
router.get("/messages", auth, async (req, res) => {
  try {
    const reports = await Message.find().sort({ timestamp: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

module.exports = router;
