const express = require('express');
const router = express.Router();
const authenticate = require('../../../../auth/middleware/authenticate');
const authorize = require('../../../../auth/middleware/authorize');
const {
  getMyProfile,
  updateMyProfile,
  updateVisibility,
  uploadAttachment,
  uploadPhoto,
  uploadDocument,
  getProfileByUser,
  getPublicProfile,
} = require('../controllers/profileController');

// ── Public route (no auth) ────────────────────────────────────────────────────
router.get('/public/:userId', getPublicProfile);

// ── All routes below require authentication ───────────────────────────────────
router.use(authenticate);

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.patch('/me/visibility', updateVisibility);
router.post('/me/attachment', ...uploadAttachment);
router.post('/me/photo', ...uploadPhoto);
router.post('/me/document/:docKey', ...uploadDocument);

// HOD / VC / SUPERADMIN can view any profile
router.get(
  '/:userId',
  authorize('HOD', 'VC', 'SUPERADMIN'),
  getProfileByUser
);

module.exports = router;
