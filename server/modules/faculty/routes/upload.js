const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, facultyOnly } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all upload routes
router.use(auth);

// Helper to get or create user directory
const getUserDir = (userId, subfolder = 'documents', section = '') => {
  const base = path.join(process.cwd(), 'uploads', userId.toString(), subfolder);
  const finalDir = section ? path.join(base, section) : base;
  if (!fs.existsSync(finalDir)) {
    fs.mkdirSync(finalDir, { recursive: true });
  }
  return finalDir;
};

// ── Photo-specific multer config (images only) ──────────────────────────────
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUserDir(req.user._id, 'photos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// ── General file multer config (PDFs, images, docs, etc.) ───────────────────
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const section = req.query.section || '';
    // Basic sanitization for section to prevent path traversal
    const safeSection = section.replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, getUserDir(req.user._id, 'documents', safeSection));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const generalUpload = multer({
  storage: generalStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
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

// ── POST /api/faculty/upload  (general file upload — PDFs, docs, images) ────
router.post('/', facultyOnly, generalUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const section = req.query.section || '';
    const safeSection = section.replace(/[^a-zA-Z0-9_-]/g, '');
    const urlPath = safeSection ? `${safeSection}/${req.file.filename}` : req.file.filename;
    const url = `/api/faculty/files/${req.user._id}/${urlPath}`;
    
    res.json({ url, filename: req.file.originalname, size: req.file.size });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// ── POST /api/faculty/upload/photo ──────────────────────────────────────────
router.post('/photo', facultyOnly, photoUpload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const photoUrl = `/api/faculty/files/photo/${req.user._id}/${req.file.filename}`;

    res.json({
      success: true,
      photoUrl: photoUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ── POST /api/faculty/upload/profile-picture ────────────────────────────────
router.post('/profile-picture', facultyOnly, photoUpload.single('profilePicture'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const photoUrl = `/api/faculty/files/photo/${req.user._id}/${req.file.filename}`;

    res.json({
      success: true,
      url: photoUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;


