const mongoose = require("mongoose");


const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
        enum: ["Diploma", "UG", "PG", "M.Phil", "PhD", "PostDoc", "FYIMP"]
      },

      degreeName: String,
      specialization: String,

      thesisTopic: String,
      researchSupervisor: String,

      admissionBatch: String,
      academicCycle: String,

      currentYear: String,

      currentSemester: {
        type: Number,
        enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      },

      modeOfStudy: {
        type: String,
        enum: ["Full-Time", "Part-Time", "Distance", "Executive"]
      },

      admissionCategory: {
        type: String,
        enum: ["Merit", "Entrance", "Management", "Sponsored", "International"]
      },

      fellowshipLetterNumber: String,
      fellowshipLetter: {
        url: String,
        public_id: String
      }
    },

    personal_details: {
      fullName: {
        type: String,
        trim: true
      },

      fullNameNative: String,

      dob: Date,

      gender: {
        type: String,
        enum: ["Male", "Female", "Others"]
      },

      nationality: String,

      dualCitizenship: {
        type: Boolean,
        default: false
      },

      domicileState: String,
      religion: String,

      caste: String,
      motherTongue: String,

      languagesKnown: [String],
      socialCategory: String,
      aadhaarNumber: {
        type: String,
        match: [/^\d{12}$/, "Aadhaar must be 12 digits"]
      },

      passportNumber: String,
      passportDoc: String,
      passportExpiry: String,
      visaDetails: {
        visaType: String,
        visaNumber: String,
        issuingCountry: String,
        issueDate: Date,
        expiryDate: Date,
        status: {
          type: String,
          enum: ["Active", "Expired", "Pending"]
        }
      },
      visaDoc: String,
      birthCertificateDoc: String,
    },
    contact_details: {
      personalEmail: {
        type: String,
        required: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
      },
      institutionalEmail: {

        type: String,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
      },
      personalMobile: {
        countryCode: String,
        number: String
      },

      whatsappNumber: {
        countryCode: String,
        number: String
      },


      emergencyContact: {
        name: String,
        relation: String,
        number: {
          countryCode: String,
          number: String
        }
      },

      permanentAddress: {
        addressLine: String,
        city: String,
        district: String,
        state: String,
        pinCode: String
      },

      correspondenceAddress: {
        addressLine: String,
        city: String,
        district: String,
        state: String,
        pinCode: String
      },

      distanceToCampus: Number
    },
    health_details: {
      bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
      },

      physicalDimensions: {
        height: {
          type: String
        },
        weight: {
          type: String
        }
      },

      disabilityStatus: {
        type: Boolean,
        default: false
      },

      disabilityDetails: {
        disabilityType: {
          type: String
        },
        percentage: {
          type: Number,
          min: 0,
          max: 100
        }
      },

      disabilityCertificate: {
        type: String
      },

      chronicConditions: {
        type: String
      },

      regularMedications: {
        type: String
      },

      insurance: {
        provider: String,
        policyNumber: String
      },

      vaccinationStatus: {
        type: String
      },
      vaccinationDoc: {
        type: String
      }
    },
    family_details: {
      father: {
        name: String,
        qualification: String,
        occupation: String
      },

      mother: {
        name: String,
        qualification: String,
        occupation: String
      },

      annualFamilyIncome: Number,

      siblings: [
        {
          name: String,
          educationStatus: String,
          email: String
        }
      ],

      parentContact: {
        countryCode: String,
        number: String
      },

      guardian: {
        name: String,
        relation: String,
        contact: {
          countryCode: String,
          number: String
        },
        address: {
          addressLine: String,
          city: String,
          district: String,
          state: String,
          pinCode: String
        }
      }
    },
    education_details: {
      education: [
        {
          qualType: {
            type: String,
            trim: true
          },

          stream: {
            type: String,
            trim: true
          },

          regNo: {
            type: String,
            trim: true
          },

          board: {
            type: String,
            trim: true
          },

          institution: {
            type: String,
            trim: true
          },

          passMonth: {
            type: String,
            enum: [
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ]
          },

          passYear: {
            type: Number,
            min: 1900,
            max: 2100
          },

          percentage: {
            type: Number,
            min: 0,
            max: 100
          },

          documentUrl: {
            type: String,
            default: ""
          }
        }
      ],

      competitiveExams: [
        {
          examName: {
            type: String,
            enum: ["NET", "GATE", "CAT", "NEET", "JEE", "Other"]
          },
          score: String,
          year: String,
          documentUrl: String
        }
      ],

      migrationUrl: String
    },
    financial_details: {

      schType: String,
      schId: String,

      feeWaiveUrl: {
        document: String   // UL (file path / URL)
      },

      educationLoan: {
        bankName: String,
        branch: String,
        amount: Number
      },

      bankAccount: {
        accountHolderName: String,
        accountNumber: String,
        bankName: String,
        branchName: String,
        ifscCode: String
      },
      loan: {
        bankName: String,
        branch: String,
        amount: String
      },

      pan: {
        type: String,
        match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"]
      }
    },
    professional_details: {
      publications: [
        {
          date: Date,
          journal: String,
          issn: String,
          url: String   // UL
        }
      ],

      conferences: [
        {
          title: String,
          name: String,
          url: String   // UL
        }
      ],

      patents: [
        {
          title: String,
          status: String,   // Filed / Published / Granted
          document: String  // UL
        }
      ],

      experience: [
        {
          company: String,
          designation: String,
          years: String,
          url: String   // UL
        }
      ],
      patentUrl: [String],
      membershipUrl: [String],

      skills: String
    },
    residential_details: {
      resType: {
        type: String,
        enum: ["Day Scholar", "Hosteller"],
      },

      hostel: {
        block: String,
        roomNo: String,
        bedType: String
      },
      hostelDeclarationForm: String,

      mess: {
        type: String,
        enum: ["Veg", "Non-Veg", "Special", "None"]
      },

      transport: {
        opted: {
          type: Boolean,
          default: false
        },

        routeNumber: String,
        boardingPoint: String,
        passNumber: String,
      },

      vehicleReg: String
    },
    documents: {
      profilePhoto: String,
      signature: String,

      transcripts: [
        {
          name: String,
          file: String
        }
      ],

      identityProof: {
        type: {
          type: String,
          enum: ["Aadhaar", "Passport", "Driving License", "Voter ID"]
        },
        document: String
      },

      legalCertificates: {
        incomeCertificate: String,
        casteCertificate: String,
        nonCreamyLayerCertificate: String,
        nativityCertificate: String
      }
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentProfile", studentProfileSchema);
