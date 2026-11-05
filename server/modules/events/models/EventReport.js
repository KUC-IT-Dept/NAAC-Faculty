// modules/events/models/EventReport.js
// The event report, preserving the exact 15 fields from the Current
// Activities tracker (0.19). One Booking can have several report VERSIONS
// (draft saves, corrections after HOD feedback) — each version is its own
// document so prior submissions are never lost. `isCurrent` marks the
// version the HOD is reviewing / that was approved.
const mongoose = require('mongoose');

const evidenceFileSchema = new mongoose.Schema({
  url: { type: String, required: true },          // signed/proxied storage reference
  publicId: { type: String, default: '' },
  originalName: { type: String, default: '' },
  category: {
    type: String,
    enum: ['photo', 'attendance_register', 'brochure', 'document', 'feedback'],
    required: true,
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  // Geo-tag metadata for photos — never used alone to "verify" a photo.
  capturedAt: { type: Date, default: null },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  gpsAccuracyMeters: { type: Number, default: null },
  gpsMissing: { type: Boolean, default: false }, // true => flagged for HOD review
}, { _id: true });

const reportSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  version: { type: Number, required: true, default: 1 },
  isCurrent: { type: Boolean, default: true },

  // ── The 15 tracker fields, verbatim ─────────────────────────────────────
  nameOfProgram: { type: String, default: '' },                 // 1
  conductingDepartment: { type: String, default: '' },          // 2
  personInCharge: { type: String, default: '' },                // 3
  programVenue: { type: String, default: '' },                  // 4 (label, e.g. "Seminar Hall 2" or "Others: <name> Rm <no>")
  targetGroupBeneficiaries: { type: [String], default: [] },    // 5
  dateFrom: { type: Date, default: null },                      // 6
  dateTo: { type: Date, default: null },                        // 6
  expectedStrength: { type: Number, default: null },            // 7
  objectives: { type: String, default: '' },                    // 8
  resourcePerson: { type: String, default: '' },                // 9
  numberOfParticipants: { type: Number, default: null },        // 10
  // 11 Upload Photos (Geo Tagged), 13 Attendance Register, 14 Detailed Files,
  // 15 Feedback files — all live in `evidence`, filtered by category.
  briefEventReport: { type: String, default: '' },              // 12
  feedbackText: { type: String, default: '' },                  // 15 (text variant)

  evidence: { type: [evidenceFileSchema], default: [] },

  // ── Draft vs submitted ───────────────────────────────────────────────────
  isDraft: { type: Boolean, default: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  submittedAt: { type: Date, default: null },

  // ── Review / approval ────────────────────────────────────────────────────
  reviewStatus: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'correction_requested', 'approved', 'rejected'],
    default: 'draft',
  },
  correctionNotes: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: '' },

  // ── Prefill tracking ──────────────────────────────────────────────────────
  // Which booking-prefilled fields the faculty member changed, so the
  // original booking data is never silently lost (Part 5.4).
  changedFromBooking: { type: [String], default: [] },
}, { timestamps: true });

reportSchema.index({ booking: 1, version: 1 }, { unique: true });
reportSchema.index({ booking: 1, isCurrent: 1 });
reportSchema.index({ reviewStatus: 1 });

module.exports = mongoose.models.EventReport || mongoose.model('EventReport', reportSchema);
