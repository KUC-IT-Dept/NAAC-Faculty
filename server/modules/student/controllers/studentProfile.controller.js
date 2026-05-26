const StudentProfile = require("../models/StudentProfile.js");
const Users = require("../../../auth/models/User.model.js");
const qs = require("qs");

exports.CreateOrUpdate = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students allowed" });
    }
    const userId = req.user._id;
    const files = req.files || {};
    const body = qs.parse(req.body);
    const users = await Users.findById(userId);
    if (!users || !users.canEdit) {
      return res.status(403).json({ message: "Editing not allowed" });
    }
    const existingProfile = await StudentProfile.findOne({ userId });
    const academic = body.academic_details;

    if (!existingProfile) {
      if (!academic?.rollNumber || !academic?.admissionApplicationNumber || !academic?.universityEnrollmentNumber) {
        return res.status(400).json({ message: "Academic identifiers required for first submission" });
      }
    }

    const admissionNumber = academic?.admissionApplicationNumber;
    const enrollmentNumber = academic?.universityEnrollmentNumber;
    const rollNumber = academic?.rollNumber;
    let errors = {};

    if (admissionNumber) {
      const existing = await StudentProfile.findOne({ "academic_details.admissionApplicationNumber": admissionNumber });
      if (existing && existing.userId.toString() !== userId.toString()) {
        errors.admissionApplicationNumber = "Already exists";
      }
    }
    if (enrollmentNumber) {
      const existing = await StudentProfile.findOne({ "academic_details.universityEnrollmentNumber": enrollmentNumber });
      if (existing && existing.userId.toString() !== userId.toString()) {
        errors.universityEnrollmentNumber = "Already exists";
      }
    }
    if (rollNumber) {
      const existing = await StudentProfile.findOne({ "academic_details.rollNumber": rollNumber });
      if (existing && existing.userId.toString() !== userId.toString()) {
        errors.rollNumber = "Already exists";
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Duplicate fields", errors });
    }

    let updateData = {};
    const sections = ["academic_details", "personal_details", "contact_details", "health_details", "family_details", "financial_details", "professional_details", "residential_details"];
    sections.forEach(section => {
      if (body[section]) {
        for (let key in body[section]) {
          updateData[`${section}.${key}`] = body[section][key];
        }
      }
    });

    const fileFieldMap = {
      fellowshipLetter: "academic_details.fellowshipLetter",
      passportDoc: "personal_details.passportDoc",
      visaDoc: "personal_details.visaDoc",
      birthCertificateDoc: "personal_details.birthCertificateDoc",
      disabilityCertificate: "health_details.disabilityCertificate",
      vaccinationDoc: "health_details.vaccinationDoc",
      migrationUrl: "education_details.migrationUrl",
      feeWaiveDocument: "financial_details.feeWaiveUrl.document",
      hostelDeclarationForm: "residential_details.hostelDeclarationForm",
      profilePhoto: "documents.profilePhoto",
      signature: "documents.signature",
      identityProof: "documents.identityProof.document",
      incomeCertificate: "documents.legalCertificates.incomeCertificate",
      casteCertificate: "documents.legalCertificates.casteCertificate",
      nonCreamyLayerCertificate: "documents.legalCertificates.nonCreamyLayerCertificate",
      nativityCertificate: "documents.legalCertificates.nativityCertificate"
    };

    Object.keys(fileFieldMap).forEach(field => {
      if (files[field]) {
        updateData[fileFieldMap[field]] = files[field][0].path;
      }
    });

    if (body.education_details?.education) {
      const educationArray = body.education_details.education;
      updateData["education_details.education"] = educationArray.map((edu, index) => ({
        ...edu,
        documentUrl: files.educationDocuments?.[index]?.path || ""
      }));
    }

    if (body.education_details?.competitiveExams) {
      const exams = body.education_details.competitiveExams;
      updateData["education_details.competitiveExams"] = exams.map((exam, index) => ({
        ...exam,
        documentUrl: files.competitiveExamDocs?.[index]?.path || ""
      }));
    }

    if (body.professional_details?.publications) {
      const publications = body.professional_details.publications;
      updateData["professional_details.publications"] = publications.map((pub, index) => ({
        ...pub,
        url: files.publicationDocs?.[index]?.path || ""
      }));
    }

    if (body.professional_details?.conferences) {
      const conferences = body.professional_details.conferences;
      updateData["professional_details.conferences"] = conferences.map((conf, index) => ({
        ...conf,
        url: files.conferenceDocs?.[index]?.path || ""
      }));
    }

    if (body.professional_details?.patents) {
      const patents = body.professional_details.patents;
      updateData["professional_details.patents"] = patents.map((patent, index) => ({
        ...patent,
        document: files.patentDocs?.[index]?.path || ""
      }));
    }

    if (body.professional_details?.experience) {
      const experience = body.professional_details.experience;
      updateData["professional_details.experience"] = experience.map((exp, index) => ({
        ...exp,
        url: files.experienceDocs?.[index]?.path || ""
      }));
    }

    if (files.transcripts) {
      updateData["documents.transcripts"] = files.transcripts.map(file => ({
        name: file.originalname,
        file: file.path
      }));
    }

    const profile = await StudentProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    // await Users.findByIdAndUpdate(userId, { canEdit: false }); // Disabled for demo multi-save
    return res.status(200).json({ message: "Profile saved successfully", profile });
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Duplicate value detected", field: Object.keys(error.keyValue) });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await StudentProfile.findOne({ userId: userId });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
