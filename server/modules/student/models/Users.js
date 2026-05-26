const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email"],
    },
    phone: {
      type: String,
      match: [/^[0-9]{10}$/, "Invalid phone number"],
       required: true
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "professor", "staff", "office"],
      default: "student"
    },
    canEdit: {
      type: Boolean,
      default: true
    },

    editApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    otp: {
      type: String,
      select: false
    },
    otpExpiry: {
      type: String,
      select: false
    }
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
