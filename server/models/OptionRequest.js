const mongoose = require('mongoose');

const optionRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dropdownKey: {
    type: String,
    required: true
  },
  requestedValue: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  previousValue: {
    type: String,
    default: ''
  },
  adminMessage: {
    type: String,
    default: ''
  },
  dismissed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('OptionRequest', optionRequestSchema);
