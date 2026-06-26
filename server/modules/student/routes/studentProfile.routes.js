// routes/studentProfile.routes.js  (original name: studentProfile.routes.mjs)
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/middlewares.auth');
const upload = require('../configs/multer');
const { CreateOrUpdate, getStudentProfile, getStudentsByDepartment, getMyRequests, getPendingRequests, getRequestById, approveRequest, rejectRequest, getAllStudents, deleteStudent, updateStudentAdmin } = require('../controllers/studentProfile.controller');

router.post('/profile', authMiddleware, upload.fields([
  { name: 'fellowshipLetter', maxCount: 1 }, { name: 'passportDoc', maxCount: 1 },
  { name: 'visaDoc', maxCount: 1 }, { name: 'birthCertificateDoc', maxCount: 1 },
  { name: 'disabilityCertificate', maxCount: 1 }, { name: 'vaccinationDoc', maxCount: 1 },
  { name: 'educationDocuments', maxCount: 10 }, { name: 'competitiveExamDocs', maxCount: 5 },
  { name: 'migrationUrl', maxCount: 1 }, { name: 'feeWaiveDocument', maxCount: 1 },
  { name: 'publicationDocs', maxCount: 5 }, { name: 'conferenceDocs', maxCount: 5 },
  { name: 'patentDocs', maxCount: 5 }, { name: 'experienceDocs', maxCount: 5 },
  { name: 'membershipDocs', maxCount: 5 }, { name: 'hostelDeclarationForm', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 }, { name: 'signature', maxCount: 1 },
  { name: 'transcripts', maxCount: 10 }, { name: 'identityProof', maxCount: 1 },
  { name: 'incomeCertificate', maxCount: 1 }, { name: 'casteCertificate', maxCount: 1 },
  { name: 'nonCreamyLayerCertificate', maxCount: 1 }, { name: 'nativityCertificate', maxCount: 1 }
]), CreateOrUpdate);

router.get('/profile', authMiddleware, getStudentProfile);
router.post('/by-department', getStudentsByDepartment);
router.post('/all-students', getAllStudents);
router.get('/my-requests', authMiddleware, getMyRequests);
router.get('/my-requests/:id', authMiddleware, getRequestById);
router.get('/requests/pending', authMiddleware, getPendingRequests);
router.post('/requests/:id/approve', authMiddleware, approveRequest);
router.post('/requests/:id/reject', authMiddleware, rejectRequest);
router.delete('/:id', authMiddleware, deleteStudent);
router.put('/:id', authMiddleware, updateStudentAdmin);

module.exports = router;
