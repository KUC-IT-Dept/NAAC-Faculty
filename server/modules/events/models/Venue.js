// modules/events/models/Venue.js
// Bookable venues for campus events. Not hardcoded: seeded once from the
// Current Activities tracker list, then editable via the venue admin API.
const mongoose = require('mongoose');

const maintenancePeriodSchema = new mongoose.Schema({
  from: { type: Date, required: true },
  to: { type: Date, required: true },
  reason: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: true, timestamps: true });

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  venueType: { type: String, default: 'Hall' }, // Hall / Ground / Lab / Other
  building: { type: String, default: '' },
  roomNumber: { type: String, default: '' },
  capacity: { type: Number, default: null },
  isActive: { type: Boolean, default: true },
  // Whether this venue can be chosen directly, or only via "Others + room no."
  isCustom: { type: Boolean, default: false },
  bookingRestrictions: { type: String, default: '' }, // free text, shown to HOD at booking time
  maintenancePeriods: { type: [maintenancePeriodSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

venueSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.models.Venue || mongoose.model('Venue', venueSchema);
