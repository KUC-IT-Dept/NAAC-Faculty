// core/db/connect.js
// Shared database connection for the unified backend.
//
// Replaces:
//   - naac-backend-main/db/config.mjs
//   - ProfCV-main/server/server.js (inline mongoose.connect)
//
// Usage (in server.mjs):
//   const connectDB = require('./core/db/connect');
//   connectDB();
//
// Mongoose maintains a single global connection pool — safe to call once at startup.
// Individual modules do not need their own connect() calls.

const mongoose = require("mongoose");

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!MONGO_URI) {
    console.error("❌ [DB] Missing MongoDB URI. Set MONGO_URI in your .env file.");
    process.exit(1);
  }

  // Fail fast — do not buffer commands if mongo is unavailable
  mongoose.set("bufferCommands", false);

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ [DB] MongoDB connected.");
  } catch (error) {
    console.error("❌ [DB] MongoDB connection failed:", error.message);
    process.exit(1);
  }

  mongoose.connection.on("error", (err) => {
    console.error("[DB] Connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠  [DB] MongoDB disconnected.");
  });
};

module.exports = connectDB;
