require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");

// Models
const User = require("./models/User");

// Routes
const authRoutes = require("./routes/auth");       // login & register
const userRoutes = require("./routes/users");      // CRUD for users
const messageRoutes = require("./routes/messages"); // messages
const adminRoutes = require("./routes/admin");      // admin dashboard
const teamRoutes = require("./routes/teams");      // team management
const reportingRoutes = require("./routes/reporting"); // reporting
const auditRoutes = require("./routes/audit");     // audit logs
const singleUserRoutes = require("./routes/user"); // /api/user

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);          // login & register
app.use("/api/users", userRoutes);         // user CRUD
app.use("/api/messages", messageRoutes);   // messages
app.use("/api/admin", adminRoutes);        // admin routes
app.use("/api/teams", teamRoutes);         // team routes
app.use("/api/reporting", reportingRoutes); // reporting
app.use("/api/admin/audit", auditRoutes);  // audit logs
app.use("/api/user", singleUserRoutes);    // single user operations

// Health check
app.get("/", (req, res) => res.send("API is running..."));

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in .env");
  process.exit(1);
}

// Function to create default admin
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("Admin@123", 10);
      const adminUser = new User({
        name: "Super Admin",
        email: "admin@ayrene.com",
        password: hashedPassword,
        role: "admin",
      });
      await adminUser.save();
      console.log("✅ Default admin created: admin@ayrene.com / Admin@123");
    } else {
      console.log("Admin user already exists.");
    }
  } catch (err) {
    console.error("❌ Error creating default admin:", err);
  }
};

// Start server
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    await createDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

startServer();
