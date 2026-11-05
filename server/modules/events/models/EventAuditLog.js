// modules/events/models/EventAuditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', default: null },
  action: { type: String, required: true }, // e.g. 'booking_confirmed', 'emergency_override', 'report_approved'
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, default: '' },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

auditLogSchema.index({ booking: 1, createdAt: -1 });

module.exports = mongoose.models.EventAuditLog || mongoose.model('EventAuditLog', auditLogSchema);
