// modules/student/routes/forgotPasswordRequest.routes.js
// Mounted flat at /api/forgot-password-request in index.js (NOT nested
// under /api/student), matching what the Student frontend already calls:
//   submitForgotPasswordRequest(email) -> POST ${SERVER}/api/forgot-password-request
//
// POST / is intentionally NOT behind authMiddleware - see controller
// comment for why (this is the pre-login "I forgot my password" entry
// point).
//
// GET /my is not currently called by the frontend (verified against
// src/store.js) but is added per spec for parity/forward compatibility.
// NOTE: the old backend's equivalent route had no auth middleware even
// though its handler read req.user._id, which would have thrown on any
// real request. That is fixed here (authMiddleware added) since the route
// is not in current use, so this carries zero regression risk while being
// the only version of the route that could actually work.
//
// Admin-side routes (/pending, /:id/reset, /:id/reject) already exist in
// routes/studentRequestsAdmin.js and are mounted separately at /api -
// untouched by this file.

const express = require('express');
const authMiddleware = require('../middlewares/middlewares.auth');
const {
  createForgotPasswordRequest,
  getMyForgotPasswordRequests
} = require('../controllers/forgotPasswordRequest.controller');

const router = express.Router();

router.post('/', createForgotPasswordRequest);
router.get('/my', authMiddleware, getMyForgotPasswordRequests);

module.exports = router;
