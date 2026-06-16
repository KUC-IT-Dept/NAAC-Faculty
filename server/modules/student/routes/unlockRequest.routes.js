// routes/unlockRequest.routes.js  (was unlockRequest.routes.mjs)
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/middlewares.auth');
const { createUnlockRequest, getMyUnlockRequests, getPendingUnlockRequests, getUnlockRequestById, approveUnlockRequest, rejectUnlockRequest, getEligibility } = require('../controllers/unlockRequest.controller');

router.post('/', authMiddleware, createUnlockRequest);
router.get('/my', authMiddleware, getMyUnlockRequests);
router.get('/pending', authMiddleware, getPendingUnlockRequests);
router.get('/eligibility', authMiddleware, getEligibility);
router.get('/:id', authMiddleware, getUnlockRequestById);
router.post('/:id/approve', authMiddleware, approveUnlockRequest);
router.post('/:id/reject', authMiddleware, rejectUnlockRequest);

module.exports = router;
