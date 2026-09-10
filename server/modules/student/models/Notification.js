// modules/student/models/Notification.js
// Ported from kuc-backend-main/models/notification.mjs (ESM -> CommonJS).
// Schema unchanged from the original.

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ['approved', 'rejected', 'info', 'warning'],
      default: 'info'
    },

    isSeen: {
      type: Boolean,
      default: false,
      index: true
    },

    metadata: {
      profileRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProfileUpdateRequest'
      },

      forgotPasswordRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ForgotPasswordRequest'
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
