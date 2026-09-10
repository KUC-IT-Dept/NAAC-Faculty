// modules/student/routes/profileUpdateRequest.routes.js
// Mounted flat at /api/profile-update-request in index.js (NOT nested under
// /api/student), matching what the Student frontend already calls:
//   submitProfileUpdateRequest()      -> POST ${SERVER}/api/profile-update-request
//   submitFieldCorrectionRequest()    -> POST ${SERVER}/api/profile-update-request
//
// GET /my is not currently called by the frontend (verified against
// src/store.js) but is added per spec for parity/forward compatibility.
//
// Admin-side routes (/pending, /:id, /:id/approve, /:id/reject) already
// exist in routes/studentRequestsAdmin.js and are mounted separately at
// /api - untouched by this file.

const express = require('express');
const authMiddleware = require('../middlewares/middlewares.auth');
const {
  createProfileUpdateRequest,
  getMyProfileUpdateRequests
} = require('../controllers/profileUpdateRequest.controller');

const router = express.Router();

router.post('/', authMiddleware, createProfileUpdateRequest);
router.get('/my', authMiddleware, getMyProfileUpdateRequests);

module.exports = router;
