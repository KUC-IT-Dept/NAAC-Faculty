const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    academic_details: {
      admissionApplicationNumber: String,
      universityEnrollmentNumber: String,
      rollNumber: String,
      faculty: String,
      programLevel: {
        type: String,
        enum: ['Diploma', 'UG', 'PG', 'M.Phil', 'PhD', 'PostDoc', 'FYIMP']
      },
      degreeName: String,
      specialization: String,
      department: String,
      thesisTopic: String,
      researchSupervisor: String,
      admissionBatch: String,
      academicCycle: String,
      currentYear: String,
      currentSemester: { type: Number, enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      modeOfStudy: { type: String, enum: ['Full-Time', 'Part-Time', 'Distance', 'Executive'] },
      admissionCategory: { type: String, enum: ['Merit', 'Entrance', 'Management', 'Sponsored', 'International'] },
      fellowshipLetterNumber: String,
      fellowshipLetter: { url: String, name: String }
    },

    personal_details: {
      fullName: { type: String, trim: true },
      fullNameNative: { type: String, trim: true },
      dob: { type: String, trim: true },
      gender: { type: String, enum: ['Male', 'Female', 'Other', 'Others'] },
      nationality: { type: String, trim: true },
      domicileState: { type: String, trim: true },
      religion: { type: String, trim: true },
      socialCategory: { type: String, trim: true },
      caste: { type: String, trim: true },
      dualCitizenship: { type: Boolean, default: false },
      aadhaarNo: { type: String, match: [/^\d{4}\s\d{4}\s\d{4}$|^\d{12}$/, 'Aadhaar must be a valid 12-digit format'] },
      passportNumber: { type: String, trim: true },
      passportCountry: { type: String, trim: true },
      passportExpiry: { type: String, trim: true },
      isInternational: { type: String, default: 'no', enum: ['yes', 'no'] },
      visaType: { type: String, trim: true },
      visaNo: { type: String, trim: true },
      visaCountry: { type: String, trim: true },
      visaIssueDate: { type: String, trim: true },
      visaExpiryDate: { type: String, trim: true },
      visaStatus: { type: String, enum: ['Active', 'Expired', 'Pending', ''] },
      motherTongue: { type: String, trim: true },
      languagesKnown: { type: [String], default: [] },
      birthCertificateDoc: { url: String, name: String },
      passportDoc: { url: String, name: String },
      visaDoc: { url: String, name: String }
    },

    contact_details: {
      personalEmail: { type: String, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email format'] },
      institutionalEmail: { type: String, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email format'] },
      personalMobile: { countryCode: String, number: String },
      whatsappNumber: { countryCode: String, number: String },
      emergencyContact: {
        name: String, relation: String,
        number: { countryCode: String, number: String }
      },
      permanentAddress: { addressLine: String, city: String, district: String, state: String, pinCode: String },
      correspondenceAddress: { addressLine: String, city: String, district: String, state: String, pinCode: String },
      distanceToCampus: Number,
      isSameAddress: { type: Boolean, default: false },
      isSameAsMobile: { type: Boolean, default: false }
    },

    health_details: {
      bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
      physicalDimensions: { height: String, weight: String },
      disabilityStatus: { type: Boolean, default: false },
      disabilityDetails: { disabilityType: String, percentage: { type: Number, min: 0, max: 100 } },
      disabilityCertificate: { url: String, name: String },
      chronicConditions: String,
      regularMedications: String,
      insurance: { provider: String, policyNumber: String },
      vaccinationStatus: String,
      vaccinationDoc: { url: String, name: String }
    },

    family_details: {
      father: { name: String, qualification: String, occupation: String },
      mother: { name: String, qualification: String, occupation: String },
      annualFamilyIncome: Number,
      siblings: [{ name: String, educationStatus: String, email: String }],
      parentContact: { countryCode: String, number: String },
      guardian: {
        name: String, relation: String,
        contact: { countryCode: String, number: String },
        address: { addressLine: String, city: String, district: String, state: String, pinCode: String }
      },
      parentEmail: String,
      guardianResidentialAddress: String,
      guardianOfficeAddress: String
    },

    education_details: {
      education: [{
        qualType: { type: String, trim: true },
        stream: { type: String, trim: true },
        regNo: { type: String, trim: true },
        board: { type: String, trim: true },
        institution: { type: String, trim: true },
        passMonth: { type: String, enum: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
        passYear: { type: Number, min: 1900, max: 2100 },
        percentage: { type: Number, min: 0, max: 100 },
        documentUrl: { url: String, name: String }
      }],
      competitiveExams: [{
        examName: { type: String, enum: ['NET', 'GATE', 'CAT', 'NEET', 'JEE', 'Other'] },
        score: String, year: String,
        documentUrl: { url: String, name: String }
      }],
      migrationUrl: { url: String, name: String }
    },

    financial_details: {
      schType: String, schOther: String, schId: String,
      feeWaiveUrl: { document: { url: String, name: String } },
      grantType: String, grantOther: String, grantId: String,
      grantWaiveUrl: { document: { url: String, name: String } },
      educationLoan: { bankName: String, amount: Number },
      bankAccount: { accountHolderName: String, accountNumber: String, bankName: String, branchName: String, ifscCode: String },
      loan: { bankName: String, branch: String, amount: String },
      pan: { type: String, uppercase: true, match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'] }
    },

    professional_details: {
      publications: [{
        paperTitle: String, journal: String, issn: String, date: Date, indexedIn: String,
        volume: String, issue: String, pages: String, impactFactor: String, coAuthors: String,
        doi: String, country: String, url: { url: String, name: String }
      }],
      conferences: [{
        presentationType: String, paperTitle: String, conferenceName: String, conferenceType: String,
        organizer: String, venue: String, date: Date, isbnIssn: String, doiLink: String,
        certificateUrl: String, url: { url: String, name: String }
      }],
      patents: [{
        title: String, status: String, publicationType: String, paperTitle: String, indexedIn: String,
        volume: String, issue: String, pages: String, impactFactor: String, coAuthors: String,
        doi: String, country: String, document: { url: String, name: String }
      }],
      experience: [{ company: String, designation: String, years: String, url: { url: String, name: String } }],
      membershipUrl: [{
        organizationName: String, membershipType: String, membershipId: String, joiningYear: String,
        document: { url: String, name: String }
      }],
      skills: String
    },

    residential_details: {
      resType: { type: String, enum: ['Day Scholar', 'Hosteller'] },
      hostel: { block: String, roomNo: String, bedType: String },
      hostelDeclarationForm: String,
      mess: { type: String, enum: ['Veg', 'Non-Veg', 'Special', 'None'] },
      transport: { opted: { type: Boolean, default: false }, routeNumber: String, boardingPoint: String, passNumber: String },
      vehicleReg: String
    },

    documents: {
      profilePhoto: { url: String, name: String },
      signature: { url: String, name: String },
      transcripts: [{ url: String, name: String }],
      identityProof: {
        type: { type: String, enum: ['Aadhaar', 'Passport', 'Driving License', 'Voter ID'] },
        document: { url: String, name: String }
      },
      legalCertificates: {
        incomeCertificate: { url: String, name: String },
        casteCertificate: { url: String, name: String },
        nonCreamyLayerCertificate: { url: String, name: String },
        nativityCertificate: { url: String, name: String }
      }
    },

    mentor_details: {
      hodName: String, hodEmail: String,
      tutorName: String, tutorEmail: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
