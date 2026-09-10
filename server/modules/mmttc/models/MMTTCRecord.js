// modules/mmttc/models/MMTTCRecord.js
//
// Institutional MMTTC data (NAAC criterion 0.11). One document per academic
// year, same pattern as modules/library/models/LibraryRecord.js: no
// per-user ownership field, since this is institution-wide data gated by
// role + modulePermissions at the route layer, not by resource ownership.
//
// Field structure follows the uploaded "0.11 MMTTC – Details" document
// section-by-section (0.11.1 through 0.11.5). The document explicitly says
// course records repeat ("repeat for each course - so facility to add"),
// which is why `courses` is an array on the yearly record rather than a
// separate one-record-per-course collection - one MMTTC centre reports
// many courses within the same academic year.

const mongoose = require('mongoose');

// 0.11.1 — General / Centre details
const centreSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  affiliationDetails: { type: String, default: '' },
  parentInstitution: { type: String, default: '' },
  yearOfEstablishment: { type: Number },
  recognitionStatus: {
    status: { type: Boolean, default: false },
    date: { type: Date }
  },
  accreditationStatus: {
    status: { type: Boolean, default: false },
    date: { type: Date }
  },
  accreditationNumber: { type: String, default: '' }
}, { _id: false });

// 0.11.2 — Director details
const directorSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  academicQualification: { type: String, default: '' }, // PhD / Professor / Associate Professor / Assistant Professor / MTech / other
  dateOfJoining: { type: Date }
}, { _id: false });

// 0.11.3 — Infrastructure
const infrastructureSchema = new mongoose.Schema({
  numberOfClassrooms: { type: Number, default: 0 },
  totalSeatingCapacity: { type: Number, default: 0 },
  numberOfLabs: { type: Number, default: 0 },
  library: {
    numberOfBooks: { type: Number, default: 0 },
    spaceSqFt: { type: Number, default: 0 }
  },
  digitalResourcesDetails: { type: String, default: '' },
  equipment: [
    {
      name: { type: String, default: '' }, // e.g. Projector
      count: { type: Number, default: 0 },
      _id: false
    }
  ],
  numberOfSupportingStaff: { type: Number, default: 0 },
  roomsAvailableToStay: { type: Number, default: 0 },
  stayCapacity: { type: Number, default: 0 },
  annualBudgetAllocation: { type: Number, default: 0 }
}, { _id: false });

// 0.11.4 — Course details (repeatable per the source document)
const courseSchema = new mongoose.Schema({
  year: { type: Number, required: true }, // starting year, 2000 onwards
  courseType: { type: String, enum: ['refresher', 'orientation', 'short_term'], required: true },
  courseCode: { type: String, default: '' },
  periodFrom: { type: Date },
  periodTo: { type: Date },
  // "auto filling from period + manual filling from 1 to 30" per the
  // source doc - stored as a plain number; whether it's derived from
  // periodFrom/periodTo or entered manually is a client-side/UI concern,
  // not enforced here.
  durationDays: { type: Number, min: 1, max: 30 },
  subjects: [{ type: String }],
  courseTitle: { type: String, default: '' },
  coordinator: {
    name: { type: String, default: '' },
    department: { type: String, default: '' },
    qualification: { type: String, default: '' }
  },
  eligibility: { type: String, default: '' },
  participants: {
    total: { type: Number, min: 0, max: 100, default: 0 },
    outsideUniversity: { type: Number, min: 0, max: 100, default: 0 },
    outsideState: { type: Number, min: 0, max: 100, default: 0 },
    outsideIndia: { type: Number, min: 0, max: 100, default: 0 }
  },
  facultyParticipants: { type: Number, default: 0 },
  mode: { type: String, enum: ['online', 'offline'], required: true },
  fundingSource: { type: String, enum: ['govt', 'private', 'trust'], required: true },
  expenditure: { type: Number, default: 0 },
  publications: { type: String, default: '' },
  feedbackFormUrl: { type: String, default: '' } // "attaching facility"
});

// 0.11.5 — Impact and Outreach
const impactSchema = new mongoose.Schema({
  collaborations: { type: String, default: '' }, // Collaborations with Universities/Institutions
  communityOutreach: { type: String, default: '' } // Community Outreach/Extension Activities
}, { _id: false });

const mmttcRecordSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true },

    centre: { type: centreSchema, default: () => ({}) },
    director: { type: directorSchema, default: () => ({}) },
    infrastructure: { type: infrastructureSchema, default: () => ({}) },
    courses: [courseSchema],
    impact: { type: impactSchema, default: () => ({}) },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// One record per academic year - same identity rule as LibraryRecord
// (Phase 0 architecture decision: "one MMTTC document per academic year
// with a repeatable courses[] structure"), same unique-index precedent
// already established elsewhere in this codebase.
mmttcRecordSchema.index({ academicYear: 1 }, { unique: true });

module.exports = mongoose.models.MMTTCRecord || mongoose.model('MMTTCRecord', mmttcRecordSchema);
