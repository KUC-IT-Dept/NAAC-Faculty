// auth/models/User.model.js
// THE canonical User model for the entire unified backend system.
//
// Merges fields from:
//   - naac-backend-main/models/Users.mjs  (phone, otp, otpExpiry, canEdit, editApprovedBy)
//   - ProfCV-main/server/models/User.js   (department, photo)
//
// All modules (naac, faculty/ProfCV) MUST import this model.
// Do NOT define separate User models in individual modules.

const mongoose = require("mongoose");
const { ALL_ROLES, ROLES } = require("../constants/roles");

const userSchema = new mongoose.Schema(
  {
    // ── Identity ─────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
    },

    // ── Authentication ───────────────────────────────────────────────────────
    password: {
      type: String,
      required: true,
      select: false, // Never returned in queries unless explicitly requested
    },

    // ── Role ─────────────────────────────────────────────────────────────────
    // Single canonical role field. Maps to ROLES constant.
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.STUDENT,
    },

    // ── Contact (from naac) ──────────────────────────────────────────────────
    phone: {
      type: String,
      match: [/^[0-9]{10}$/, "Invalid phone number — must be 10 digits"],
      default: null,
    },

    // ── Profile (from ProfCV) ─────────────────────────────────────────────────
    department: {
      type: String,
      default: null,
    },
    photo: {
      type: String,
      default: "",
    },

    // ── Account State ────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Edit Permission (from naac) ───────────────────────────────────────────
    canEdit: {
      type: Boolean,
      default: true,
    },
    editApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ── OTP (from naac) ───────────────────────────────────────────────────────
    // Used for 2-factor login flow in the naac module.
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Number, // Unix ms timestamp
      select: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("User", userSchema);