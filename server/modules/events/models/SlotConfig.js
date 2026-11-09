// modules/events/models/SlotConfig.js
// Institution-wide configuration for the three standard daily booking slots.
// Singleton document (key: 'standard_slots'). Times are "HH:mm" 24h, in the
// institution's configured timezone (see timezone field).
const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  slotNumber: { type: Number, required: true }, // 1, 2, 3
  label: { type: String, required: true },      // e.g. "Morning"
  startTime: { type: String, required: true },  // "09:30"
  endTime: { type: String, required: true },    // "12:30"
}, { _id: false });

const slotConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'standard_slots', unique: true },
  timezone: { type: String, default: 'Asia/Kolkata' },
  slots: {
    type: [slotSchema],
    default: [
      { slotNumber: 1, label: 'Morning', startTime: '09:30', endTime: '12:30' },
      { slotNumber: 2, label: 'Afternoon', startTime: '13:30', endTime: '16:00' },
      { slotNumber: 3, label: 'Evening', startTime: '16:00', endTime: '18:00' },
    ],
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.models.SlotConfig || mongoose.model('SlotConfig', slotConfigSchema);
