require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");

// Models
const User = require("./models/User");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const messageRoutes = require("./routes/messages");
const adminRoutes = require("./routes/admin");
const teamRoutes = require("./routes/teams");
const reportingRoutes = require("./routes/reporting");
const auditRoutes = require("./routes/audit");
const singleUserRoutes = require("./routes/user");

const app = express();

/* =========================
   CORS CONFIG
========================= */
const allowedOrigins = [
  "http://localhost:3000",
  "https://ayrene.com",
  "https://www.ayrene.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // server-to-server requests
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Pragma", "Expires"],
  })
);
app.options("*", cors()); // preflight

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(morgan("dev"));

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/reporting", reportingRoutes);
app.use("/api/user", singleUserRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/audit", auditRoutes);

// Health check
app.get("/", (req, res) => res.send("API is running..."));

/* =========================
   ENV & DB
========================= */
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

/* =========================
   CREATE DEFAULT ADMIN
========================= */
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("Admin@123", 10);
      await User.create({
        name: "Super Admin",
        email: "admin@ayrene.com",
        password: hashedPassword,
        role: "admin",
      });
      console.log("✅ Default admin created");
    } else {
      console.log("ℹ️ Admin user already exists");
    }
  } catch (err) {
    console.error("❌ Error creating default admin:", err.message);
  }
};

/* =========================
   START SERVER
========================= */
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");

    await createDefaultAdmin();

    // Listen on all interfaces for Nginx proxy
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err.message);
    process.exit(1);
  }
};

// Catch unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

startServer();
