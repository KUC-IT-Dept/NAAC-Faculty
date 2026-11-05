// modules/events/models/EventNotification.js
// In-app notifications for the events module. Named EventNotification (not
// Notification) to avoid colliding with the existing student module's
// Notification collection.
const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'event_completion', 'reminder_24h', 'reminder_40h', 'deadline_overdue',
  'pending_hod_review', 'correction_requested', 'report_approved',
  'report_rejected', 'faculty_reassigned', 'booking_cancelled', 'emergency_override',
];

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: NOTIFICATION_TYPES, required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  // Dedup key so a scheduled job can never fire the same reminder twice for
  // the same booking+type, even on retry/overlapping runs.
  dedupKey: { type: String, required: true },
}, { timestamps: true });

notificationSchema.index({ dedupKey: 1 }, { unique: true });
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = {
  EventNotification: mongoose.models.EventNotification || mongoose.model('EventNotification', notificationSchema),
  NOTIFICATION_TYPES,
};
