const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, facultyOnly } = require('../middleware/auth');
const Faculty = require('../models/Faculty');

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

const DOCUMENT_FIELDS = new Set([
  'photo', 'signature', 'aadhar', 'pan', 'ssc', 'hsc', 'ug', 'pg', 'phd', 'mphil',
  'net', 'gate', 'apptLetter', 'experienceCert', 'publications', 'noc', 'casteCert',
  'disabilityCert', 'dobProof', 'nationalId'
]);

const persistDocumentReference = async (userId, fieldKey, url) => {
  if (!fieldKey || !DOCUMENT_FIELDS.has(fieldKey)) return;

  try {
    const faculty = await Faculty.findOne({ userId });
    if (!faculty) return;

    if (!faculty.documents) {
      faculty.documents = {};
    }

    faculty.documents[fieldKey] = url;
    await faculty.save();
  } catch (err) {
    console.error('Failed to persist uploaded document reference:', err);
  }
};

const removeDocumentReference = async (userId, fieldKey, url) => {
  if (!fieldKey || !DOCUMENT_FIELDS.has(fieldKey)) return { removed: false, fileRemoved: false };

  try {
    const faculty = await Faculty.findOne({ userId });
    if (!faculty) return { removed: false, fileRemoved: false };

    if (!faculty.documents) {
      faculty.documents = {};
    }

    const previousValue = faculty.documents[fieldKey];
    faculty.documents[fieldKey] = '';
    await faculty.save();

    let fileRemoved = false;
    const candidateUrls = [];
    if (typeof url === 'string' && url) candidateUrls.push(url);
    if (typeof previousValue === 'string' && previousValue) candidateUrls.push(previousValue);

    for (const candidateUrl of candidateUrls) {
      try {
        const normalized = candidateUrl.replace(/\\/g, '/');
        const prefix = `/api/faculty/files/${userId}/`;
        const relativePath = normalized.startsWith(prefix)
          ? normalized.slice(prefix.length)
          : normalized.replace(/^\/uploads\//, '');

        if (!relativePath) continue;

        const absolutePath = path.resolve(process.cwd(), 'uploads', userId.toString(), 'documents', relativePath);
        if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
          fs.unlinkSync(absolutePath);
          fileRemoved = true;
        }
      } catch (fileErr) {
        console.error('Failed to remove document file:', fileErr);
      }
    }

    return { removed: true, fileRemoved };
  } catch (err) {
    console.error('Failed to remove uploaded document reference:', err);
    return { removed: false, fileRemoved: false };
  }
};

// ── POST /api/faculty/upload  (general file upload — PDFs, docs, images) ────
router.post('/', facultyOnly, generalUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const section = req.query.section || '';
    const safeSection = section.replace(/[^a-zA-Z0-9_-]/g, '');
    const urlPath = safeSection ? `${safeSection}/${req.file.filename}` : req.file.filename;
    const url = `/api/faculty/files/${req.user._id}/${urlPath}`;

    const fieldKey = typeof req.query.field === 'string' ? req.query.field : '';
    await persistDocumentReference(req.user._id, fieldKey, url);

    res.json({ url, filename: req.file.originalname, size: req.file.size });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// ── DELETE /api/faculty/upload  (remove a previously uploaded document) ────
router.delete('/', facultyOnly, async (req, res) => {
  try {
    const fieldKey = typeof req.query.field === 'string' ? req.query.field : (req.body && typeof req.body.field === 'string' ? req.body.field : '');
    const url = typeof req.query.url === 'string' ? req.query.url : (req.body && typeof req.body.url === 'string' ? req.body.url : '');

    const result = await removeDocumentReference(req.user._id, fieldKey, url);
    if (!result.removed) {
      return res.status(400).json({ message: 'Unable to remove document reference' });
    }

    return res.json({ success: true, removed: true, fileRemoved: result.fileRemoved });
  } catch (err) {
    console.error('Delete upload error:', err);
    return res.status(500).json({ message: 'Delete failed' });
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


