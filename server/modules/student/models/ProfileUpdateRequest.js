const mongoose = require('mongoose');

const profileUpdateRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestNo: { type: String, required: true },
  // Additive field (Phase 1): records what the Student frontend actually
  // sends (submitProfileUpdateRequest / submitFieldCorrectionRequest both
  // send `updateType`). Optional so it never affects the existing
  // admin approve/reject flow in routes/studentRequestsAdmin.js, which does
  // not read this field.
  updateType: { type: String, enum: ['full_profile', 'field_correction'], default: 'field_correction' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  changes: { type: mongoose.Schema.Types.Mixed, required: true },
  remarks: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('ProfileUpdateRequest', profileUpdateRequestSchema);
