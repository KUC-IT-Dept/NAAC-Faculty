const mongoose = require('mongoose');

const visibilitySchema = new mongoose.Schema({
  personalInfo: { type: Boolean, default: true },
  photo: { type: Boolean, default: true },
  qualifications: { type: Boolean, default: true },
  eligibilityTests: { type: Boolean, default: true },
  employmentDetails: { type: Boolean, default: true },
  workExperience: { type: Boolean, default: true },
  publications: { type: Boolean, default: true },
  projects: { type: Boolean, default: true },
  awards: { type: Boolean, default: true },
  patents: { type: Boolean, default: true },
  researchGuidance: { type: Boolean, default: true },
  adminResponsibilities: { type: Boolean, default: true },
  fdpWorkshops: { type: Boolean, default: true },
  memberships: { type: Boolean, default: true },
  internationalExperience: { type: Boolean, default: true },
}, { _id: false });

// Section 2: Qualifications
const qualificationSchema = new mongoose.Schema({
  degreeLevel: { type: String, default: '' }, // 10th / 12th / UG / PG / Ph.D / M.Phil / Other
  degreeName: { type: String, default: '' },
  specialization: { type: String, default: '' },
  institution: { type: String, default: '' },
  university: { type: String, default: '' },
  boardUniversity: { type: String, default: '' },
  yearOfPassing: { type: String, default: '' },
  percentageCGPA: { type: String, default: '' },
  division: { type: String, default: '' }, // First / Second / Third
  mode: { type: String, default: '' }, // Regular / Distance / Part-time
}, { _id: false });

// Section 3: Eligibility Tests
const eligibilityTestSchema = new mongoose.Schema({
  examName: { type: String, default: '' }, // NET / SET / GATE / JRF / Other
  subject: { type: String, default: '' },
  year: { type: String, default: '' },
  certificateNo: { type: String, default: '' },
  score: { type: String, default: '' },
  state: { type: String, default: '' }, // for SET/SLET
}, { _id: false });

// Section 5: Previous Work Experience
const workExpSchema = new mongoose.Schema({
  organization: { type: String, default: '' },
  designation: { type: String, default: '' },
  from: { type: String, default: '' },
  to: { type: String, default: '' },
  nature: { type: String, default: '' }, // Teaching / Research / Industry
  reasonForLeaving: { type: String, default: '' },
}, { _id: false });

// Section 6: Publications
const publicationSchema = new mongoose.Schema({
  type: { type: String, enum: ['journal', 'book', 'bookChapter', 'conference'], default: 'journal' },
  title: { type: String, default: '' },
  authors: { type: String, default: '' },
  authorRole: { type: String, default: '' }, // Principal / Co-Author
  journal: { type: String, default: '' }, // journal name / publisher / conference name
  year: { type: String, default: '' },
  volume: { type: String, default: '' },
  issue: { type: String, default: '' },
  issn: { type: String, default: '' },
  isbn: { type: String, default: '' },
  pages: { type: String, default: '' },
  impactFactor: { type: String, default: '' },
  indexedIn: { type: String, default: '' }, // Scopus / WoS / UGC Care
  peerReviewed: { type: String, default: '' }, // Yes / No
  doi: { type: String, default: '' },
  level: { type: String, default: '' }, // National / International
  presentationType: { type: String, default: '' }, // Oral / Poster (for conference)
  venue: { type: String, default: '' }, // for conference
  conferenceDates: { type: String, default: '' }, // for conference
  documentUrl: { type: String, default: '' }, // proof document
  editors: { type: String, default: '' }, // for book chapters
  bookType: { type: String, default: '' }, // Authored / Edited / Co-authored
  organizedBy: { type: String, default: '' }, // for conference
  publishedInProceedings: { type: String, default: '' }, // Yes / No
}, { _id: false });

// Section 8: Research Projects
const projectSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  fundingAgency: { type: String, default: '' },
  amountSanctioned: { type: String, default: '' },
  duration: { type: String, default: '' },
  status: { type: String, default: '' }, // Completed / Ongoing
  role: { type: String, default: '' }, // PI / Co-PI
}, { _id: false });

// Section 7: Awards
const awardSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  awardingAgency: { type: String, default: '' },
  dateOfAward: { type: String, default: '' },
  level: { type: String, default: '' }, // International / National / State / University
}, { _id: false });

// Section 9: Patents
const patentSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  patentNumber: { type: String, default: '' },
  dateOfFiling: { type: String, default: '' },
  status: { type: String, default: '' }, // Filed / Published / Granted
}, { _id: false });

// Section 11: Admin Responsibilities
const adminRespSchema = new mongoose.Schema({
  committeeName: { type: String, default: '' },
  role: { type: String, default: '' }, // Member / Coordinator / Chair
  from: { type: String, default: '' },
  to: { type: String, default: '' },
}, { _id: false });

// Section 12: FDP / Workshops
const fdpSchema = new mongoose.Schema({
  programTitle: { type: String, default: '' },
  type: { type: String, default: '' },
  organizingInstitution: { type: String, default: '' },
  duration: { type: String, default: '' },
  mode: { type: String, default: '' },
  certificate: { type: String, default: '' },
  year: { type: String, default: '' },
  documentUrl: { type: String, default: '' },
}, { _id: false });

// Section 13: Memberships
const membershipSchema = new mongoose.Schema({
  professionalBody: { type: String, default: '' },
  membershipType: { type: String, default: '' }, // Life / Annual
  membershipId: { type: String, default: '' },
  yearOfJoining: { type: String, default: '' },
  documentUrl: { type: String, default: '' },
}, { _id: false });

// Section 14: International Experience
const internationalExpSchema = new mongoose.Schema({
  country: { type: String, default: '' },
  purpose: { type: String, default: '' }, // Research / Teaching / Conference
  institution: { type: String, default: '' },
  duration: { type: String, default: '' },
  fundingSource: { type: String, default: '' },
}, { _id: false });

const facultySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  username: { type: String, required: true, unique: true },
  profileComplete: { type: Boolean, default: false },
  completionPercentage: { type: Number, default: 0 },
  visibility: { type: visibilitySchema, default: () => ({}) },

  // Section 1: Personal Information
  personalInfo: {
    // Name
    firstName: { type: String, default: '' },
    middleName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    fullName: { type: String, default: '' }, // derived or manually set
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    nationality: { type: String, default: '' },
    // Address
    permanentAddress: { type: String, default: '' },
    permanentState: { type: String, default: '' },
    permanentCity: { type: String, default: '' },
    permanentPin: { type: String, default: '' },
    currentAddress: { type: String, default: '' },
    currentState: { type: String, default: '' },
    currentCity: { type: String, default: '' },
    currentPin: { type: String, default: '' },
    stateAndCity: { type: String, default: '' },
    // Contact
    mobilePersonal: { type: String, default: '' },
    alternatePhone: { type: String, default: '' },
    officialEmail: { type: String, default: '' },
    personalEmail: { type: String, default: '' },
    // IDs
    aadhaarNumber: { type: String, default: '' },
    passportNumber: { type: String, default: '' },
    panNumber: { type: String, default: '' },
    // Social
    religion: { type: String, default: '' },
    category: { type: String, default: '' }, // General / OBC / SC / ST / EWS
    subCategory: { type: String, default: '' },
    differentlyAbled: { type: String, default: '' }, // Yes / No
    disabilityType: { type: String, default: '' },
    maritalStatus: { type: String, default: '' },
    spouseName: { type: String, default: '' },
    spouseOccupation: { type: String, default: '' },
    emergencyContactName: { type: String, default: '' },
    emergencyContactMobile: { type: String, default: '' },
    // Photo
    photoUrl: { type: String, default: '' },
    // Online IDs
    orcidId: { type: String, default: '' },
    googleScholarId: { type: String, default: '' },
    scopusId: { type: String, default: '' },
    linkedIn: { type: String, default: '' },
    website: { type: String, default: '' },
  },

  // Section 2: Educational Qualifications
  qualifications: { type: [qualificationSchema], default: [] },

  // Section 3: Eligibility Tests
  eligibilityTests: { type: [eligibilityTestSchema], default: [] },

  // Section 4: Employment Details (current)
  employmentDetails: {
    employeeId: { type: String, default: '' },
    designation: { type: String, default: '' },
    department: { type: String, default: '' },
    institution: { type: String, default: '' },
    affiliatedUniversity: { type: String, default: '' },
    dateOfAppointment: { type: String, default: '' },
    natureOfAppointment: { type: String, default: '' }, // Regular / Ad-hoc / Contract / Guest
    approvalOfAppointment: { type: String, default: '' },
    approvalLetterNo: { type: String, default: '' },
    approvalLetterDate: { type: String, default: '' },
    scaleOfPay: { type: String, default: '' },
    currentBasicPay: { type: String, default: '' },
    totalExperienceYears: { type: String, default: '' },
    totalExperienceMonths: { type: String, default: '' },
    dateOfRetirement: { type: String, default: '' },
  },

  // Section 5: Work Experience (previous)
  workExperience: { type: [workExpSchema], default: [] },

  // Section 6: Publications
  publications: { type: [publicationSchema], default: [] },

  // Section 7: Awards
  awards: { type: [awardSchema], default: [] },

  // Section 8: Research Projects
  projects: { type: [projectSchema], default: [] },

  // Section 9: Patents
  patents: { type: [patentSchema], default: [] },

  // Section 10: Research Guidance
  researchGuidance: {
    phdCompleted: { type: String, default: '' },
    phdInProgress: { type: String, default: '' },
    mphilCompleted: { type: String, default: '' },
    mphilInProgress: { type: String, default: '' },
    pgProjectsSupervised: { type: String, default: '' },
  },

  // Section 11: Admin & Academic Responsibilities
  adminResponsibilities: { type: [adminRespSchema], default: [] },

  // Section 12: FDP / Workshops / Seminars
  fdpWorkshops: { type: [fdpSchema], default: [] },

  // Section 13: Professional Memberships
  memberships: { type: [membershipSchema], default: [] },

  // Section 14: International Experience
  internationalExperience: { type: [internationalExpSchema], default: [] },

}, { timestamps: true });

module.exports = mongoose.model('Faculty', facultySchema);
