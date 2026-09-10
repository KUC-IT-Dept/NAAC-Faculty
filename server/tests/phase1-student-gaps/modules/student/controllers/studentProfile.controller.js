// controllers/studentProfile.controller.js
const qs = require('qs');
const StudentProfile = require('../models/StudentProfile');
const User = require('../../../auth/models/User.model');
const ProfileUpdateRequest = require('../models/ProfileUpdateRequest');
const { deepMerge } = require('../utils/deepMerge');
const { buildNestedObjectFromDotPaths, isEmptyFileValue, sanitizeProfilePayload, setByDotPath } = require('../utils/profileDataSanitizer');

const CreateOrUpdate = async (req, res) => {
  const body = qs.parse(req.body);
  const files = req.files || {};
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students allowed' });
    const userId = req.user._id;
    const jsonSections = ['academic_details', 'personal_details', 'contact_details', 'health_details', 'family_details', 'financial_details', 'professional_details', 'residential_details', 'education_details'];
    jsonSections.forEach((section) => {
      if (body[section] && typeof body[section] === 'string') {
        try { body[section] = JSON.parse(body[section]); } catch { /* ignore */ }
      }
    });
    const users = await User.findById(userId);
    if (!users || !users.canEdit) return res.status(403).json({ message: 'Editing not allowed' });
    const existingProfile = await StudentProfile.findOne({ userId });
    const academic = body.academic_details;
    if (!existingProfile) {
      if (!academic?.rollNumber || !academic?.admissionApplicationNumber || !academic?.universityEnrollmentNumber) {
        return res.status(400).json({ message: 'Academic identifiers required for first submission' });
      }
    }
    let errors = {};
    const checkDuplicate = async (field, value) => {
      const existing = await StudentProfile.findOne({ [field]: value });
      return existing && existing.userId.toString() !== userId.toString();
    };
    if (academic?.admissionApplicationNumber && await checkDuplicate('academic_details.admissionApplicationNumber', academic.admissionApplicationNumber)) errors.admissionApplicationNumber = 'Already exists';
    if (academic?.universityEnrollmentNumber && await checkDuplicate('academic_details.universityEnrollmentNumber', academic.universityEnrollmentNumber)) errors.universityEnrollmentNumber = 'Already exists';
    if (academic?.rollNumber && await checkDuplicate('academic_details.rollNumber', academic.rollNumber)) errors.rollNumber = 'Already exists';
    if (Object.keys(errors).length > 0) return res.status(400).json({ message: 'Duplicate fields', errors });

    let updateData = {};
    const sections = ['academic_details', 'personal_details', 'contact_details', 'health_details', 'family_details', 'financial_details', 'professional_details', 'residential_details'];
    sections.forEach((section) => {
      if (body[section]) {
        for (let key in body[section]) {
          const value = body[section][key];
          if (value === undefined || (section === 'academic_details' && key === 'fellowshipLetter' && isEmptyFileValue(value))) continue;
          updateData[`${section}.${key}`] = value;
        }
      }
    });
    const fileFieldMap = {
      fellowshipLetter: 'academic_details.fellowshipLetter', passportDoc: 'personal_details.passportDoc', visaDoc: 'personal_details.visaDoc',
      birthCertificateDoc: 'personal_details.birthCertificateDoc', disabilityCertificate: 'health_details.disabilityCertificate',
      vaccinationDoc: 'health_details.vaccinationDoc', migrationUrl: 'education_details.migrationUrl',
      feeWaiveDocument: 'financial_details.feeWaiveUrl.document', hostelDeclarationForm: 'residential_details.hostelDeclarationForm',
      profilePhoto: 'documents.profilePhoto', signature: 'documents.signature', identityProof: 'documents.identityProof.document',
      incomeCertificate: 'documents.legalCertificates.incomeCertificate', casteCertificate: 'documents.legalCertificates.casteCertificate',
      nonCreamyLayerCertificate: 'documents.legalCertificates.nonCreamyLayerCertificate', nativityCertificate: 'documents.legalCertificates.nativityCertificate'
    };
    Object.keys(fileFieldMap).forEach((field) => {
      if (files[field]) updateData[fileFieldMap[field]] = { url: files[field][0].path, name: files[field][0].originalname };
    });
    if (body.education_details?.education) {
      updateData['education_details.education'] = body.education_details.education.map((edu, i) => ({
        ...edu, documentUrl: files.educationDocuments?.[i] ? { url: files.educationDocuments[i].path, name: files.educationDocuments[i].originalname } : edu.documentUrl
      }));
    }
    if (body.education_details?.competitiveExams) {
      updateData['education_details.competitiveExams'] = body.education_details.competitiveExams.map((exam, i) => ({
        ...exam, documentUrl: files.competitiveExamDocs?.[i] ? { url: files.competitiveExamDocs[i].path, name: files.competitiveExamDocs[i].originalname } : exam.documentUrl
      }));
    }
    if (body.professional_details?.publications) {
      updateData['professional_details.publications'] = body.professional_details.publications.map((pub, i) => ({
        ...pub, url: files.publicationDocs?.[i] ? { url: files.publicationDocs[i].path, name: files.publicationDocs[i].originalname } : pub.url
      }));
    }
    if (body.professional_details?.experience) {
      updateData['professional_details.experience'] = body.professional_details.experience.map((exp, i) => ({
        ...exp, url: files.experienceDocs?.[i] ? { url: files.experienceDocs[i].path, name: files.experienceDocs[i].originalname } : exp.url
      }));
    }
    if (files.transcripts) updateData['documents.transcripts'] = files.transcripts.map((f) => ({ url: f.path, name: f.originalname }));
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined || (key === 'academic_details.fellowshipLetter' && isEmptyFileValue(updateData[key]))) delete updateData[key];
    });

    const existingData = await StudentProfile.findOne({ userId });
    let finalData = { ...(existingData?.toObject() || {}) };
    Object.keys(updateData).forEach((key) => setByDotPath(finalData, key, updateData[key]));
    finalData = sanitizeProfilePayload(finalData);

    let profile = null;
    if (!existingData) {
      profile = await StudentProfile.create({ userId, ...finalData });
    } else {
      const requestChanges = buildNestedObjectFromDotPaths(updateData);
      await ProfileUpdateRequest.create({ studentId: userId, requestNo: `REQ-${Date.now()}`, changes: requestChanges, status: 'pending' });
    }
    await User.findByIdAndUpdate(userId, { canEdit: false });
    return res.status(200).json({ message: 'Profile saved successfully', profile });
  } catch (error) {
    console.log(error);
    if (error.code === 11000) return res.status(400).json({ message: 'Duplicate value detected', field: Object.keys(error.keyValue) });
    return res.status(500).json({ message: error.message });
  }
};

const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await StudentProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ success: false, message: 'Student profile not found' });
    return res.status(200).json({ success: true, data: profile });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await StudentProfile.find();
    return res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const getStudentsByDepartment = async (req, res) => {
  try {
    const { department } = req.body;
    if (!department) return res.status(400).json({ success: false, message: 'Department is required' });
    const students = await StudentProfile.find({ 'academic_details.department': department });
    return res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await ProfileUpdateRequest.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    return res.json(requests);
  } catch (err) { return res.status(500).json({ message: err.message }); }
};

const getPendingRequests = async (req, res) => {
  try {
    const requests = await ProfileUpdateRequest.find({ status: 'pending' }).populate('studentId').sort({ createdAt: -1 });
    return res.status(200).json(requests);
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

const getRequestById = async (req, res) => {
  try {
    const request = await ProfileUpdateRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    return res.status(200).json(request);
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

const approveRequest = async (req, res) => {
  try {
    const request = await ProfileUpdateRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Already processed' });
    const profile = await StudentProfile.findOne({ userId: request.studentId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    const sanitizedChanges = sanitizeProfilePayload(request.changes || {});
    const mergedData = sanitizeProfilePayload(deepMerge(profile.toObject(), sanitizedChanges));
    delete mergedData._id; delete mergedData.__v;
    await StudentProfile.findOneAndUpdate({ userId: request.studentId }, mergedData, { new: true });
    request.status = 'approved'; request.reviewedAt = new Date(); request.reviewedBy = req.user._id;
    await request.save();
    return res.json({ success: true, message: 'Request approved' });
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

const rejectRequest = async (req, res) => {
  try {
    const request = await ProfileUpdateRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    request.status = 'rejected'; request.remarks = req.body.remarks || '';
    request.reviewedBy = req.user._id; request.reviewedAt = new Date();
    await request.save();
    return res.status(200).json({ message: 'Request rejected successfully' });
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

const updateStudentAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const role = (req.user.role || '').toLowerCase();
    if (!['admin', 'superadmin', 'vc', 'hod'].includes(role)) {
      return res.status(403).json({ message: `Not authorized to update students. Your role: ${req.user.role}` });
    }
    const { department, tutorName, tutorEmail } = req.body;
    let profile = await StudentProfile.findById(id);
    if (!profile) {
      profile = await StudentProfile.findOne({ userId: id });
    }
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    if (department) profile.academic_details.department = department;
    if (tutorName || tutorEmail) {
      if (!profile.mentor_details) profile.mentor_details = {};
      if (tutorName) profile.mentor_details.tutorName = tutorName;
      if (tutorEmail) profile.mentor_details.tutorEmail = tutorEmail;
    }

    await profile.save();
    return res.status(200).json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('[updateStudentAdmin]', error);
    return res.status(500).json({ message: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const role = (req.user.role || '').toLowerCase();
    console.log('[deleteStudent] user role:', role, 'payload:', req.user);
    if (!['admin', 'superadmin', 'vc', 'hod'].includes(role)) {
      return res.status(403).json({ message: `Not authorized to delete students. Your role: ${req.user.role}` });
    }
    let profile = await StudentProfile.findById(id);
    if (!profile) {
      profile = await StudentProfile.findOne({ userId: id });
    }
    
    if (!profile) {
      // fallback in case there's a User but no profile
      const user = await User.findByIdAndDelete(id);
      if (!user) return res.status(404).json({ message: 'Student not found' });
      return res.status(200).json({ message: 'Student deleted successfully (no profile)' });
    }
    
    await User.findByIdAndDelete(profile.userId);
    await StudentProfile.findByIdAndDelete(profile._id);
    
    return res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('[deleteStudent]', error);
    return res.status(500).json({ message: error.message });
  }
};

// Restored from kuc-backend-main/controllers/studentProfile.controller.mjs
// (ESM -> CommonJS). Deletes one sub-record (e.g. one education entry, one
// publication) from an array field within the authenticated student's own
// profile. Ownership is enforced the same way as the original: the query
// is scoped to { userId: req.user._id }, so a student can only ever affect
// their own profile document - there is no separate id-based lookup that
// could be pointed at someone else's profile.
//
// sectionMap is adapted to this backend's actual StudentProfile schema
// (modules/student/models/StudentProfile.js). The old backend also listed
// "scholarships" -> "financial_details.scholarships" and
// "grants" -> "financial_details.grants", but in this schema
// financial_details.schType/grantType etc. are scalar fields, not arrays -
// there is nothing to $pull from, so those two keys are intentionally
// omitted here rather than silently mapped to a non-existent path.
const deleteProfileRecord = async (req, res) => {
  try {
    const { section, recordId } = req.params;
    const userId = req.user._id;

    const sectionMap = {
      education: 'education_details.education',
      competitiveExams: 'education_details.competitiveExams',
      siblings: 'family_details.siblings',
      publications: 'professional_details.publications',
      conferences: 'professional_details.conferences',
      experience: 'professional_details.experience',
      patents: 'professional_details.patents',
      membershipUrl: 'professional_details.membershipUrl'
    };

    const arrayPath = sectionMap[section];

    if (!arrayPath) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section.'
      });
    }

    const profile = await StudentProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.'
      });
    }

    await StudentProfile.updateOne(
      { userId },
      {
        $pull: {
          [arrayPath]: { _id: recordId }
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Record deleted successfully.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = { CreateOrUpdate, getStudentProfile, getAllStudents, getStudentsByDepartment, getMyRequests, getPendingRequests, getRequestById, approveRequest, rejectRequest, deleteStudent, updateStudentAdmin, deleteProfileRecord };
