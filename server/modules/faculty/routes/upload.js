const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, facultyOnly } = require('../middleware/auth');
const Faculty = require('../models/Faculty');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../../student/configs/cloudinary');

const router = express.Router();

// Apply auth middleware to all upload routes
router.use(auth);

// Helper to get or create user directory (kept for legacy support if needed)
const getUserDir = (userId, subfolder = 'documents', section = '') => {
  const base = path.join(process.cwd(), 'uploads', userId.toString(), subfolder);
  const finalDir = section ? path.join(base, section) : base;
  if (!fs.existsSync(finalDir)) {
    fs.mkdirSync(finalDir, { recursive: true });
  }
  return finalDir;
};

// ── Photo-specific multer config (images only) ──────────────────────────────
const photoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'faculty_photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    public_id: (req, file) => `profile-${req.user._id}-${Date.now()}`
  }
});

const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ── General file multer config (PDFs, images, docs, etc.) ───────────────────
const generalStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'faculty_documents',
    resource_type: 'auto',
    public_id: (req, file) => {
      const section = req.query.section || '';
      const safeSection = section.replace(/[^a-zA-Z0-9_-]/g, '');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const originalNameWithoutExt = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '');
      return safeSection ? `${req.user._id}/${safeSection}/${originalNameWithoutExt}-${uniqueSuffix}` : `${req.user._id}/${originalNameWithoutExt}-${uniqueSuffix}`;
    }
  }
});

const generalUpload = multer({
  storage: generalStorage,
  limits: { fileSize: 50 * 1024 * 1024 }
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

const extractCloudinaryPublicId = (url) => {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  
  // Skip 'upload' and version (e.g., 'v1734567890')
  let startIndex = uploadIndex + 1;
  if (parts[startIndex] && parts[startIndex].startsWith('v') && !isNaN(parts[startIndex].substring(1))) {
    startIndex++;
  }
  
  const fileWithExt = parts.slice(startIndex).join('/');
  const lastDotIndex = fileWithExt.lastIndexOf('.');
  if (lastDotIndex !== -1) {
    return fileWithExt.substring(0, lastDotIndex);
  }
  return fileWithExt;
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
        if (candidateUrl.includes('res.cloudinary.com')) {
          const publicId = extractCloudinaryPublicId(candidateUrl);
          if (publicId) {
            let destroyResult = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
            if (destroyResult.result !== 'ok') {
               destroyResult = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
            }
            if (destroyResult.result === 'ok') {
              fileRemoved = true;
            }
          }
        } else {
          // Legacy local deletion
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

    const url = req.file.path;
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

    const photoUrl = req.file.path;

    res.json({
      success: true,
      photoUrl: photoUrl,
      filename: req.file.originalname
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

    const photoUrl = req.file.path;

    res.json({
      success: true,
      url: photoUrl,
      filename: req.file.originalname
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
