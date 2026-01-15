const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // 1️⃣ Check Authorization header
    if (!authHeader) {
      return res.status(401).json({
        error: "Authorization header missing",
      });
    }

    // 2️⃣ Check Bearer token format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authorization format must be Bearer <token>",
      });
    }

    // 3️⃣ Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Token not found",
      });
    }

    // 4️⃣ Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "AYRENE_SECRET"
    );

    // 5️⃣ Fetch user from DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        error: "User not found for this token",
      });
    }

    // 6️⃣ Attach user to request
    req.user = user; // full user object
    req.userId = user._id; // optional helper

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);

    // Token expired
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired, please login again",
      });
    }

    // Invalid token
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid authentication token",
      });
    }

    return res.status(401).json({
      error: "Authentication failed",
    });
  }
};
