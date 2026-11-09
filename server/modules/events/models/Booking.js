// modules/events/models/Booking.js
// A venue booking IS the event: the HOD creates/confirms it, faculty get
// assigned to it, and it carries the event lifecycle status through to
// publication in the Current Activities Register.
const mongoose = require('mongoose');

const ASSIGNMENT_HISTORY_ACTIONS = ['assigned_lead', 'reassigned_lead', 'added_support', 'removed_support'];

const assignmentHistorySchema = new mongoose.Schema({
  action: { type: String, enum: ASSIGNMENT_HISTORY_ACTIONS, required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, default: '' },
  at: { type: Date, default: Date.now },
}, { _id: false });

const BOOKING_STATUSES = ['draft', 'confirmed', 'cancelled', 'rescheduled'];

// Event lifecycle status, distinct from booking status: a booking can be
// 'confirmed' while its event moves through this separate state machine.
const EVENT_STATUSES = [
  'booked', 'assigned', 'event_completed', 'report_pending', 'submitted',
  'under_review', 'correction_required', 'approved', 'published', 'overdue', 'cancelled',
];

const bookingSchema = new mongoose.Schema({
  // ── Core event/programme info (HOD booking form) ──────────────────────
  programName: { type: String, required: true, trim: true },
  conductingDepartment: { type: String, required: true },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  customVenueName: { type: String, default: '' }, // used only when venue is the "Others" placeholder
  customRoomNumber: { type: String, default: '' },

  date: { type: Date, required: true }, // calendar date, local midnight UTC-normalized
  slotType: { type: String, enum: ['standard', 'custom'], required: true },
  standardSlotNumber: { type: Number, default: null }, // 1-3, required if slotType === 'standard'
  startTime: { type: Date, required: true }, // absolute instant, derived from date+slot or custom times
  endTime: { type: Date, required: true },

  targetGroups: { type: [String], default: [] },
  expectedStrength: { type: Number, default: null },
  objectives: { type: String, default: '' },
  resourcePerson: { type: String, default: '' },
  bookingNotes: { type: String, default: '' },

  // ── Faculty assignment ──────────────────────────────────────────────────
  leadFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, required: true },
  supportingFaculty: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  assignmentHistory: { type: [assignmentHistorySchema], default: [] },

  // ── Status ───────────────────────────────────────────────────────────────
  status: { type: String, enum: BOOKING_STATUSES, default: 'draft' },
  eventStatus: { type: String, enum: EVENT_STATUSES, default: 'booked' },
  cancelReason: { type: String, default: '' },

  // ── Deadline / eligibility enforcement ──────────────────────────────────
  reportDeadline: { type: Date, required: true }, // endTime + 48h, set on confirm
  remindersSent: {
    completion: { type: Boolean, default: false },
    hour24: { type: Boolean, default: false },
    hour40: { type: Boolean, default: false },
    overdue: { type: Boolean, default: false },
  },
  overdueAt: { type: Date, default: null },
  emergencyOverride: {
    granted: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    grantedAt: { type: Date, default: null },
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // HOD
  rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
}, { timestamps: true });

// Hard backstop for standard-slot double-booking: one confirmed booking per
// venue+date+slot. Partial index so draft/cancelled bookings never collide.
bookingSchema.index(
  { venue: 1, date: 1, standardSlotNumber: 1 },
  {
    unique: true,
    name: 'uniq_confirmed_standard_slot',
    partialFilterExpression: { status: 'confirmed', slotType: 'standard' },
  }
);
bookingSchema.index({ venue: 1, date: 1 });
bookingSchema.index({ leadFaculty: 1, eventStatus: 1 });
bookingSchema.index({ conductingDepartment: 1, date: 1 });
bookingSchema.index({ reportDeadline: 1, eventStatus: 1 });

module.exports = {
  Booking: mongoose.models.Booking || mongoose.model('Booking', bookingSchema),
  BOOKING_STATUSES,
  EVENT_STATUSES,
};
