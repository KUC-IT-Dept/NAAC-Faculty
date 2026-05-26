const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Profile = require('../models/Profile');
const User = require('../../../../auth/models/User.model');

// ── Centralized Uploads Directory ──────────────────────────────────────────
const uploadsDir = path.resolve(process.cwd(), 'uploads', 'faculty');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created faculty uploads directory:', uploadsDir);
}

// ── Multer Configuration ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeName = `${uuidv4()}-${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, WEBP, and PDF files are allowed.'));
    }
  },
});

// ── Controller Functions ─────────────────────────────────────────────────────

/** GET /api/profile/me */
const getMyProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id }).populate('user', 'name email role department');
    if (!profile) {
      profile = await Profile.create({ user: req.user.id });
      profile = await profile.populate('user', 'name email role department');
    }
    return res.status(200).json(profile);
  } catch (err) {
    console.error('[profileController.getMyProfile]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/** PUT /api/profile/me */
const updateMyProfile = async (req, res) => {
  const {
    name, bio, headline, photo, subjects, workExperiences, qualifications, publications,
    projects, awards, customDetails, professionalDetails, entranceTests, academicResponsibilities, researchSupervision, media, documents, interests,
    internationalExperiences, professionalMemberships, trainings, onlineCoursesCertifications,
    dob, gender, phoneNumber, address,
    mobileNumber, alternatePhone, officialEmail, personalEmail, aadhaar, passport, nationality, stateCity, permanentAddress, currentAddress, religion, category, subCategory, differentlyAbled, maritalStatus, spouse, emergencyContact, panNumber, bloodGroup
  } = req.body;
  try {
    // Update User document if name is provided
    if (name || photo) {
      await User.findByIdAndUpdate(req.user.id, { name, photo }, { runValidators: true, new: true });
    }
    // Update Profile document
    let profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          bio, headline, photo, subjects, workExperiences, qualifications, publications,
          projects, awards, customDetails, professionalDetails, entranceTests, academicResponsibilities, researchSupervision, media, documents, interests,
          internationalExperiences, professionalMemberships, trainings, onlineCoursesCertifications,
          dob, gender, phoneNumber, address,
          mobileNumber, alternatePhone, officialEmail, personalEmail, aadhaar, passport, nationality, stateCity, permanentAddress, currentAddress, religion, category, subCategory, differentlyAbled, maritalStatus, spouse, emergencyContact, panNumber, bloodGroup
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
    // Populate with fresh user data to ensure name is latest
    profile = await profile.populate('user', 'name email role department');
    return res.status(200).json(profile);
  } catch (err) {
    console.error('[profileController.updateMyProfile]', err);
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Server error.' });
  }
};

/** PATCH /api/profile/me/visibility */
const updateVisibility = async (req, res) => {
  const allowed = [
    'bio', 'professionalDetails', 'entranceTests', 'workExperiences', 'qualifications', 'publications', 'projects', 'subjects',
    'professionalMemberships', 'customDetails', 'media', 'interests', 'photo', 'dob', 'gender', 'phoneNumber', 'address'
  ];
  const update = {};
  allowed.forEach((key) => {
    if (typeof req.body[key] === 'boolean') update[`visibility.${key}`] = req.body[key];
  });
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: update },
      { new: true, upsert: true }
    );
    return res.status(200).json(profile.visibility);
  } catch (err) {
    console.error('[profileController.updateVisibility]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/** POST /api/profile/me/attachment */
const uploadAttachment = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const sizeKB = Math.round(req.file.size / 1024);
    const fileUrl = `/uploads/${req.file.filename}`;
    try {
      const profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $push: { 'media.attachments': { name: req.file.originalname, url: fileUrl, fileType: req.file.mimetype, sizeKB } } },
        { new: true, upsert: true }
      );
      return res.status(200).json({
        message: 'File uploaded successfully.',
        attachment: { name: req.file.originalname, url: fileUrl, fileType: req.file.mimetype, sizeKB },
        profile,
      });
    } catch (err) {
      console.error('[profileController.uploadAttachment]', err);
      return res.status(500).json({ message: 'Server error.' });
    }
  },
];

/** POST /api/profile/me/photo */
const uploadPhoto = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    
    const fileUrl = `/uploads/${req.file.filename}`;
    const filePath = path.join(uploadsDir, req.file.filename);
    
    // Verify file was actually saved to disk
    if (!fs.existsSync(filePath)) {
      console.error('[profileController.uploadPhoto] File not saved to disk:', filePath);
      return res.status(500).json({ message: 'File was not saved successfully.' });
    }
    
    try {
      // Update User document with photo URL
      await User.findByIdAndUpdate(req.user.id, { photo: fileUrl });
      
      // Update Profile document with photo URL
      const profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: { photo: fileUrl } },
        { new: true, upsert: true }
      );

      console.log('[profileController.uploadPhoto] Photo saved successfully:', fileUrl);
      
      return res.status(200).json({
        message: 'Photo uploaded and URL stored in database successfully.',
        photoUrl: fileUrl,
        profile,
      });
    } catch (err) {
      console.error('[profileController.uploadPhoto]', err);
      // Clean up file if database update fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('[profileController.uploadPhoto] Cleaned up file due to database error:', filePath);
      }
      return res.status(500).json({ message: 'Server error during photo upload.' });
    }
  },
];
/** POST /api/profile/me/document/:docKey */
const uploadDocument = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const { docKey } = req.params;
    const validKeys = [
      'passportPhoto', 'signature', 'dobProof', 'categoryCertificate', 
      'degreeCertificates', 'netSetJrfCertificate', 'experienceCertificates', 
      'appointmentOrders', 'awardCertificates', 'publicationProofs', 
      'aadhaarCard', 'panCard'
    ];
    if (!validKeys.includes(docKey)) {
      return res.status(400).json({ message: 'Invalid document key.' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    try {
      const updateQuery = {};
      updateQuery[`documents.${docKey}`] = fileUrl;

      const profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: updateQuery },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        message: 'Document uploaded successfully.',
        fileUrl,
        profile,
      });
    } catch (err) {
      console.error('[profileController.uploadDocument]', err);
      return res.status(500).json({ message: 'Server error during document upload.' });
    }
  },
];
/** GET /api/profile/:userId  (HOD / VC / SUPERADMIN) */
const getProfileByUser = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate('user', 'name email role department');
    if (!profile) return res.status(404).json({ message: 'Profile not found.' });
    return res.status(200).json(profile);
  } catch (err) {
    console.error('[profileController.getProfileByUser]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * GET /api/profile/public/:userId  — NO AUTH REQUIRED
 * Returns profile filtered by teacher's own visibility settings.
 */
const getPublicProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId })
      .populate('user', 'name email role department');
    if (!profile) return res.status(404).json({ message: 'Profile not found.' });

    const vis = profile.visibility || {};
    const out = {
      user: profile.user,
      headline: profile.headline,
      bio: vis.bio !== false ? profile.bio : undefined,
      subjects: vis.subjects !== false ? profile.subjects : undefined,
      workExperiences: vis.workExperiences !== false ? profile.workExperiences : undefined,
      interests: vis.interests !== false ? profile.interests : undefined,
      qualifications: vis.qualifications !== false ? profile.qualifications : undefined,
      publications: vis.publications !== false ? profile.publications : undefined,
      projects: vis.projects !== false ? profile.projects : undefined,
      customDetails: vis.customDetails !== false ? profile.customDetails : undefined,
      professionalDetails: vis.professionalDetails !== false ? profile.professionalDetails : undefined,
      academicResponsibilities: profile.academicResponsibilities || undefined,
      entranceTests: vis.entranceTests !== false ? profile.entranceTests : undefined,
      media: vis.media === true ? profile.media : undefined,
      photo: vis.photo !== false ? profile.photo : undefined,
      dob: vis.dob === true ? profile.dob : undefined,
      gender: vis.gender === true ? profile.gender : undefined,
      phoneNumber: vis.phoneNumber === true ? profile.phoneNumber : undefined,
      address: vis.address === true ? profile.address : undefined,
      visibility: profile.visibility,
    };
    return res.status(200).json(out);
  } catch (err) {
    console.error('[profileController.getPublicProfile]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  updateVisibility,
  uploadAttachment,
  uploadPhoto,
  uploadDocument,
  getProfileByUser,
  getPublicProfile,
};
