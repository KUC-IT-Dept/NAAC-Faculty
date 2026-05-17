const express = require('express');
const Faculty = require('../models/Faculty');
const { auth, facultyOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
router.use(auth);

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    // Allow common document and image formats
    const allowedMimes = [
      'application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'application/zip'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

function calcCompletion(f) {
  let score = 0;
  const max = 10;
  const pi = f.personalInfo || {};
  if (pi.firstName || pi.fullName) score++;
  if (pi.dateOfBirth && pi.gender) score++;
  if (f.qualifications?.length > 0) score++;
  if (f.employmentDetails?.designation) score++;
  if (f.workExperience?.length > 0) score++;
  if (f.publications?.length > 0) score++;
  if (f.projects?.length > 0) score++;
  if (f.awards?.length > 0) score++;
  if (f.memberships?.length > 0) score++;
  if (f.researchGuidance?.phdCompleted || f.researchGuidance?.phdInProgress) score++;
  return Math.round((score / max) * 100);
}

// GET /api/faculty/me
router.get('/me', facultyOnly, async (req, res) => {
  try {
    let faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) faculty = await Faculty.create({ userId: req.user._id, username: req.user.username });
    res.json(faculty);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/faculty/me
router.put('/me', facultyOnly, async (req, res) => {
  try {
    const allowed = [
      'personalInfo', 'qualifications', 'eligibilityTests', 'employmentDetails',
      'workExperience', 'publications', 'awards', 'projects', 'patents',
      'researchGuidance', 'adminResponsibilities', 'fdpWorkshops', 'memberships',
      'internationalExperience', 'documents',
    ];
    const updateData = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

    if (updateData.personalInfo?.fullName && typeof updateData.personalInfo.fullName === 'string') {
      updateData.personalInfo.fullName = updateData.personalInfo.fullName.replace(/^temp--/i, '').trim();
    }

    let faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) faculty = new Faculty({ userId: req.user._id, username: req.user.username });

    Object.assign(faculty, updateData);
    faculty.completionPercentage = calcCompletion(faculty);
    faculty.profileComplete = faculty.completionPercentage >= 20;
    await faculty.save();
    res.json(faculty);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// PATCH /api/faculty/me/visibility
router.patch('/me/visibility', facultyOnly, async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) return res.status(404).json({ message: 'Profile not found' });
    const allowed = Object.keys(faculty.visibility.toObject());
    allowed.forEach(key => { if (req.body[key] !== undefined) faculty.visibility[key] = req.body[key]; });
    await faculty.save();
    res.json({ message: 'Visibility updated', visibility: faculty.visibility });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// POST /api/faculty/upload
router.post('/upload', facultyOnly, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.originalname, size: req.file.size });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

module.exports = router;
