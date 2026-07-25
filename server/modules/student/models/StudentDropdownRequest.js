const mongoose = require('mongoose');

const studentDropdownRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestNo: { type: String, required: true },
  dropdownKey: { type: String, required: true }, // e.g., "admissionCategory"
  requestedValue: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedValue: { type: String, default: '' },
  remarks: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('StudentDropdownRequest', studentDropdownRequestSchema);
