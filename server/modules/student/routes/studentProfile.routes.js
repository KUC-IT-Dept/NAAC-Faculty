const express = require("express");
const {  Router  } = require("express");
const authMiddleware = require("../../../auth/middleware/authenticate.js");
const {  CreateOrUpdate, getStudentProfile  } = require("../controllers/studentProfile.controller.js");
const upload = require("../configs/multer.js");

const studentProfileRouter = Router();

studentProfileRouter.post(
  "/profile",
  authMiddleware,
  upload.fields([

    // 📘 Academic
    { name: "fellowshipLetter", maxCount: 1 },

    // 📘 Personal
    { name: "passportDoc", maxCount: 1 },
    { name: "visaDoc", maxCount: 1 },
    { name: "birthCertificateDoc", maxCount: 1 },

    // 📘 Health
    { name: "disabilityCertificate", maxCount: 1 },
    { name: "vaccinationDoc", maxCount: 1 },

    // 📘 Education
    { name: "educationDocuments", maxCount: 10 }, // for education[].documentUrl
    { name: "competitiveExamDocs", maxCount: 5 },
    { name: "migrationUrl", maxCount: 1 },

    // 📘 Financial
    { name: "feeWaiveDocument", maxCount: 1 },

    // 📘 Professional
    { name: "publicationDocs", maxCount: 5 },
    { name: "conferenceDocs", maxCount: 5 },
    { name: "patentDocs", maxCount: 5 },
    { name: "experienceDocs", maxCount: 5 },
    { name: "patentUrlDocs", maxCount: 5 },
    { name: "membershipDocs", maxCount: 5 },

    // 📘 Residential
    { name: "hostelDeclarationForm", maxCount: 1 },

    // 📘 Main Documents
    { name: "profilePhoto", maxCount: 1 },
    { name: "signature", maxCount: 1 },

    { name: "transcripts", maxCount: 10 },

    { name: "identityProof", maxCount: 1 },

    // 📘 Legal Certificates
    { name: "incomeCertificate", maxCount: 1 },
    { name: "casteCertificate", maxCount: 1 },
    { name: "nonCreamyLayerCertificate", maxCount: 1 },
    { name: "nativityCertificate", maxCount: 1 }

  ]),
  CreateOrUpdate
);

studentProfileRouter.get("/profile", authMiddleware, getStudentProfile);

module.exports = studentProfileRouter;
