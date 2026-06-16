const mongoose = require('mongoose');

const unlockRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestNo: { type: String, required: true },
  requestType: { type: String, enum: ['field_correction', 'full_unlock'], required: true },
  correctionFields: [{
    section: String,
    field: String,
    currentValue: mongoose.Schema.Types.Mixed,
    requestedValue: mongoose.Schema.Types.Mixed
  }],
  formData: { type: Object, default: {} },
  reason: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  remarks: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('UnlockRequest', unlockRequestSchema);
