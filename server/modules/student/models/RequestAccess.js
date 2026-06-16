const mongoose = require('mongoose');

const RequestAccessSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String },
  status: { type: String, enum: ['cancelled', 'approved', 'pending'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('RequestAccess', RequestAccessSchema);
