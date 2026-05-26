const mongoose = require('mongoose');

const qualificationSchema = new mongoose.Schema({
  educationlevel: String,
  degree: String,
  specialisation: String,
  institution: String,
  university: String,
  yearofpassing: String,
  cgpa: String,
  division: String,
  mode: String,
  country: String,
  state: String,
  tenthcertificate: String,
  twelfthcertificate: String,
  ugcertificate: String,
  pgcertificate: String,
  mphilcertificate: String,
  phdcertificate: String,

  // Legacy fields kept for backward compatibility.
  year: String,
  grade: String,
});

const publicationSchema = new mongoose.Schema({
  publicationType: { type: String, enum: ['Journal Articles', 'Book Chapters', 'Books Authored / Edited', 'Conference Papers', 'Other'], default: 'Journal Articles' },
  title: { type: String, required: true },
  authors: String,
  journal: String,
  organisation: String,
  volume: String,
  issue: String,
  month: String,
  year: { type: String, required: true },
  pages: String,
  doi: String,
  url: String,

  issn: String,
  indexedIn: String,
  impactFactor: String,
  bookTitle: String,
  publisher: String,
  isbn: String,
  editors: String,
  bookType: String,
  conferenceName: String,
  nationalInternational: String,
  venueDate: String,
  organizedBy: String,
  publishedInProceedings: String
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  year: String,
  url: String,
  fundingAgency: String,
  role: { type: String, enum: ['Principal Investigator', 'Co-PI'] },
  amount: String,
  sanctionedAmount: String,
  duration: String,
  durationFrom: String,
  durationTo: String,
  status: { type: String, enum: ['Ongoing', 'Completed'] },
  referenceNumber: String
});

const awardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  awardingBody: { type: String, required: true },
  level: { type: String, enum: ['Institution', 'State', 'National', 'International'], default: 'Institution' },
  year: { type: String, required: true },
  description: String,
});

const customDetailSchema = new mongoose.Schema({
  sectionTitle: { type: String, required: true },
  content: { type: String, required: true },
  isVisible: { type: Boolean, default: true },
});

const attachmentSchema = new mongoose.Schema({
  name: String,
  url: String,
  fileType: String,
  sizeKB: Number,
});

const professionalDetailSchema = new mongoose.Schema({
  employeeId: String,
  designation: String,
  department: String,
  institutionName: String,
  affiliatedUniversity: String,
  institutionType: String, // Government / Aided / Private / Deemed / Central University
  natureOfAppointment: String, // Regular / Contract / Guest etc
  dateOfJoining: String,
  dateOfConfirmation: String,
  payBand: String,
  bankAccountDetails: String,
  pfNumber: String,
  serviceBookNumber: String,

  // Additional fields used by the current form UI.
  collegeName: String,
  universityAffiliation: String,
  appointmentNature: String,
  payScale: String,
  accountNumber: String,
  ifscCode: String,
  bankName: String,
  branchName: String,
  promotions: [{
    date: String,
    nature: String,
    payScale: String,
  }],

  // First promotion
  dateOfFirstPromotion: String,
  natureOfFirstAppointment: String,
  firstPayBand: String,

  // Second promotion
  dateOfSecondPromotion: String,
  natureOfSecondAppointment: String,
  secondPayBand: String,

  // Third promotion
  dateOfThirdPromotion: String,
  natureOfThirdAppointment: String,
  thirdPayBand: String,
}, { _id: false });

const entranceTestSchema = new mongoose.Schema({
  net: { subject: String, year: String, certificateNo: String },
  set: { subject: String, year: String, state: String },
  gate: { score: String, year: String },
  jrf: { agency: String, year: String },
  other: String, // Any other competitive exam qualified
}, { _id: false });

const workExperienceSchema = new mongoose.Schema({
  institutionName: String,
  designation: String,
  department: String,
  fromDate: String,
  toDate: String,
  totalDuration: String,
  natureOfAppointment: String,
  reasonForLeaving: String,
});

const internationalExperienceSchema = new mongoose.Schema({
  countryVisited: String,
  purpose: String,
  institutionName: String,
  duration: String,
  fundingSource: String,
});

const trainingSchema = new mongoose.Schema({
  programName: String,
  type: String,
  organizedBy: String,
  durationDates: String,
  mode: String,
  certificate: String,
});

const onlineCourseCertificationSchema = new mongoose.Schema({
  courseName: String,
  platform: String,
  duration: String,
  scoreGrade: String,
  certificateNumber: String,
  year: String,
});

const documentsSchema = new mongoose.Schema({
  passportPhoto: String,
  signature: String,
  dobProof: String,
  categoryCertificate: String,
  degreeCertificates: String,
  netSetJrfCertificate: String,
  experienceCertificates: String,
  appointmentOrders: String,
  awardCertificates: String,
  publicationProofs: String,
  aadhaarCard: String,
  panCard: String
}, { _id: false });

const professionalMembershipSchema = new mongoose.Schema({
  bodyName: String,
  membershipType: String,
  membershipId: String,
  yearOfJoining: String,
});

const visibilitySchema = new mongoose.Schema({
  bio: { type: Boolean, default: true },
  professionalDetails: { type: Boolean, default: true },
  entranceTests: { type: Boolean, default: true },
  workExperiences: { type: Boolean, default: true },
  qualifications: { type: Boolean, default: true },
  professionalMemberships: { type: Boolean, default: true },
  publications: { type: Boolean, default: true },
  awards: { type: Boolean, default: true },
  projects: { type: Boolean, default: true },
  researchSupervision: { type: Boolean, default: true },
  subjects: { type: Boolean, default: true },
  customDetails: { type: Boolean, default: true },
  media: { type: Boolean, default: false },
  documents: { type: Boolean, default: false },
  interests: { type: Boolean, default: true },
  photo: { type: Boolean, default: true },
  phoneNumber: { type: Boolean, default: false },
  address: { type: Boolean, default: false },
  dob: { type: Boolean, default: false },
  gender: { type: Boolean, default: false },
}, { _id: false });

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: { type: String, default: '' },
    headline: { type: String, default: '' },
    photo: { type: String, default: '' },
    dob: { type: String, default: '' },
    gender: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    address: { type: String, default: '' },
    mobileNumber: { type: String, default: '' },
    alternatePhone: { type: String, default: '' },
    officialEmail: { type: String, default: '' },
    personalEmail: { type: String, default: '' },
    aadhaar: { type: String, default: '' },
    passport: { type: String, default: '' },
    nationality: { type: String, default: '' },
    stateCity: { type: String, default: '' },
    permanentAddress: { type: String, default: '' },
    currentAddress: { type: String, default: '' },
    religion: { type: String, default: '' },
    category: { type: String, default: '' },
    subCategory: { type: String, default: '' },
    differentlyAbled: { type: String, default: '' },
    maritalStatus: { type: String, default: '' },
    spouse: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    panNumber: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    subjects: [String],
    workExperiences: [workExperienceSchema],
    qualifications: [qualificationSchema],
    internationalExperiences: [internationalExperienceSchema],
    professionalMemberships: [professionalMembershipSchema],
    publications: [publicationSchema],
    awards: [awardSchema],
    projects: [projectSchema],
    trainings: [trainingSchema],
    onlineCoursesCertifications: [onlineCourseCertificationSchema],
    researchSupervision: {
      phdAwardedCount: { type: String, default: '' },
      phdOngoingCount: { type: String, default: '' },
      mphilGuidedCount: { type: String, default: '' },
      completedStudentsNames: { type: String, default: '' },
      studentDetails: { type: String, default: '' }
    },
    customDetails: [customDetailSchema],
    professionalDetails: { type: professionalDetailSchema, default: () => ({}) },
    entranceTests: { type: entranceTestSchema, default: () => ({}) },
    academicResponsibilities: {
      courses: {
        type: [{
          course: { type: String, default: '' },
          year: { type: String, default: '' },
          programme: { type: String, default: '' },
          subject: { type: String, default: '' },
        }],
        default: []
      },
      classesHandled: { type: String, default: '' },
      administrativeRoles: { type: String, default: '' },
      committeeMemberships: { type: String, default: '' },
    },
    documents: { type: documentsSchema, default: () => ({}) },
    media: {
      attachments: {
        type: [attachmentSchema],
        validate: [
          {
            validator: function (arr) {
              return arr.every((a) => a.sizeKB <= 5120);
            },
            message: 'All attachments must be under 5 MB (5120 KB).',
          },
        ],
      },
      videoEmbeds: [String],
    },
    interests: [String],
    visibility: { type: visibilitySchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);

