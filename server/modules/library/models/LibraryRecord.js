// modules/library/models/LibraryRecord.js
//
// Institutional Library data (NAAC criterion 0.9). One document per
// academic year, following the same embedded-subdocument pattern already
// used by modules/faculty/models/Faculty.js. This is institution-wide data
// (not owned by an individual student/faculty user) - there is no per-user
// ownership field here on purpose; see the controller for how access is
// gated instead (role + modulePermissions, not resource ownership).
//
// Field structure follows the uploaded "0.9 Library Evaluation" PDF
// section-by-section (0.9.1 through 0.9.9). No field was added beyond what
// that document specifies.

const mongoose = require('mongoose');

// 0.9.1 — General / Librarian details
const librarianSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  qualifications: { type: String, default: '' },
  joiningDate: { type: Date },
  yearsOfService: { type: Number, default: 0 }
}, { _id: false });

// 0.9.2 — Infrastructure
const infrastructureSchema = new mongoose.Schema({
  totalFloorAreaSqFt: { type: Number, default: 0 },
  seatingCapacity: {
    readingRooms: { type: Number, default: 0 },
    studyCarrels: { type: Number, default: 0 },
    digitalLabs: { type: Number, default: 0 }
  },
  accessibility: {
    ramps: { type: Number, default: 0 },
    lifts: { type: Number, default: 0 },
    wheelchairs: { type: Number, default: 0 }
  },
  safetyMeasures: {
    fireAlarms: { type: Number, default: 0 },
    cctv: { type: Number, default: 0 },
    emergencyExits: { type: Number, default: 0 }
  },
  discussionRooms: { type: Number, default: 0 },
  computers: { type: Number, default: 0 },
  timing: {
    daysPerWeek: { type: Number, default: 0, min: 0, max: 7 },
    fromTime: { type: String, default: '' },
    toTime: { type: String, default: '' },
    closedOnSaturday: { type: Boolean, default: false },
    closedOnSunday: { type: Boolean, default: false }
  }
}, { _id: false });

// 0.9.3 — Collections
const collectionsSchema = new mongoose.Schema({
  totalBooks: {
    subject: { type: String, default: '' },
    number: { type: Number, default: 0 }
  },
  journalsAndPeriodicals: {
    print: { type: Number, default: 0 },
    electronic: { type: Number, default: 0 },
    national: { type: Number, default: 0 },
    international: { type: Number, default: 0 }
  },
  digitalResources: {
    databases: { type: Number, default: 0 },
    ebooks: { type: Number, default: 0 },
    institutionalRepository: { type: Number, default: 0 }
  },
  specialCollections: {
    rareBooks: { type: Number, default: 0 },
    theses: { type: Number, default: 0 },
    manuscripts: { type: Number, default: 0 }
  },
  annualAdditions: {
    newTitlesPurchased: { type: Number, default: 0 },
    subscribed: { type: Number, default: 0 }
  },
  contributionsByStudents: { type: Number, default: 0 }, // project/research contributions
  donations: {
    byAlumni: { type: Number, default: 0 },
    byStaff: { type: Number, default: 0 },
    byOthers: { type: Number, default: 0 }
  }
}, { _id: false });

// 0.9.4 — Technology & Digital Access
const technologySchema = new mongoose.Schema({
  libraryManagementSoftware: { type: String, default: '' }, // e.g. Koha, Libsys
  opacAvailable: { type: Boolean, default: false },
  institutionalRepositoryAccess: { type: Boolean, default: false },
  remoteAccessFacilities: { type: String, default: '' }, // VPN, proxy, federated login
  digitalLiteracyPrograms: {
    from: { type: Date },
    to: { type: Date }
  }
}, { _id: false });

// 0.9.5 — Staffing & Services
// Support staff count/qualifications are recorded manually here. Per the
// Phase 0 architecture report: no dedicated non-teaching-staff model exists
// in this codebase, and building one is out of scope for the Library
// module alone - so these remain plain manual fields, not a reference to a
// staff subsystem that doesn't exist.
const workshopSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  date: { type: Date },
  topic: { type: String, default: '' } // citation, plagiarism, research tools etc.
}, { _id: false });

const plagiarismCheckSchema = new mongoose.Schema({
  date: { type: Date },
  articlesOrThesesChecked: { type: Number, default: 0 },
  scope: { type: String, enum: ['internal', 'external', ''], default: '' }
}, { _id: false });

const staffingSchema = new mongoose.Schema({
  supportStaffCount: { type: Number, default: 0 },
  qualificationsAndTraining: { type: String, default: '' },
  userServices: { type: String, default: '' }, // reference desk, research assistance, interlibrary loan
  orientationPrograms: {
    date: { type: Date },
    photoUploads: [{ type: String, default: '' }] // uploaded photo URLs, proof of orientation
  },
  workshopsAndSeminars: [workshopSchema],
  plagiarismChecks: [plagiarismCheckSchema]
}, { _id: false });

// 0.9.6 — Usage & Engagement
const usageSchema = new mongoose.Schema({
  footfall: {
    daily: { type: Number, default: 0 },
    annual: { type: Number, default: 0 }
  },
  circulation: {
    booksIssued: { type: Number, default: 0 },
    booksReturned: { type: Number, default: 0 },
    // "Automatic updation FROM THE LIBRARY DATA + manual updation facility"
    // per the requirements doc - no real library-software integration
    // exists in this codebase today, so this stays manual-entry with a
    // source flag left for a future automated-sync phase.
    source: { type: String, enum: ['manual', 'auto'], default: 'manual' }
  },
  digitalResourceUsage: {
    date: { type: Date },
    totalDownloadsOrLogins: { type: Number, default: 0 }
  },
  feedbackMechanisms: { type: String, default: '' } // feedback form + suggestion box description
}, { _id: false });

// 0.9.7 — Compliance & Precautions
const complianceSchema = new mongoose.Schema({
  copyrightCompliance: { type: Boolean, default: false },
  dataPrivacyCompliance: { type: Boolean, default: false },
  disasterPreparedness: {
    fireSafety: { type: String, default: '' },
    digitalBackup: { type: Boolean, default: false }
  },
  preservationMeasures: [{ type: String, enum: ['binding', 'digitization', 'climate_control'] }]
}, { _id: false });

// 0.9.8 — Financial status
const financialSchema = new mongoose.Schema({
  annualBudgetAllocation: { type: Number, default: 0 },
  subscriptionsAndMemberships: { type: String, default: '' } // e.g. INFLIBNET, DELNET
}, { _id: false });

// 0.9.9 — Best practices / innovations
const bestPracticesSchema = new mongoose.Schema({
  practices: { type: String, default: '' }, // green library initiatives, open access promotion, etc.
  innovations: { type: String, default: '' }, // mobile apps, AI-based search tools, etc.
  details: { type: String, default: '' } // free-text field per the requirements doc
}, { _id: false });

const libraryRecordSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true },

    librarian: { type: librarianSchema, default: () => ({}) },
    infrastructure: { type: infrastructureSchema, default: () => ({}) },
    collections: { type: collectionsSchema, default: () => ({}) },
    technology: { type: technologySchema, default: () => ({}) },
    staffing: { type: staffingSchema, default: () => ({}) },
    usage: { type: usageSchema, default: () => ({}) },
    compliance: { type: complianceSchema, default: () => ({}) },
    financial: { type: financialSchema, default: () => ({}) },
    bestPractices: { type: bestPracticesSchema, default: () => ({}) },

    // Supporting uploads/photos (generic attachments not tied to a specific
    // sub-section, e.g. general facility photos). URL strings only in this
    // phase - see controller header comment for why an upload endpoint
    // isn't included here.
    uploads: [
      {
        url: { type: String, default: '' },
        caption: { type: String, default: '' },
        _id: false
      }
    ],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// One record per academic year, matching the "one Library document per
// academic year" architecture decision from the Phase 0 report and the
// unique-index precedent already established elsewhere in this codebase
// (DropdownConfig.key, Department.name, SectionConfig.sectionId, Metric.metricId).
libraryRecordSchema.index({ academicYear: 1 }, { unique: true });

module.exports = mongoose.models.LibraryRecord || mongoose.model('LibraryRecord', libraryRecordSchema);
