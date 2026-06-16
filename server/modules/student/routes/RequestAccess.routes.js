// routes/RequestAccess.routes.js  (original name: RequestAccess.routes.mjs)
const express = require('express');
const router = express.Router();
const { requestAccess, approveEdit } = require('../controllers/RequestAccess.controller');
const authMiddleware = require('../middlewares/middlewares.auth');

router.post('/request-access', authMiddleware, requestAccess);
router.post('/approve-request', authMiddleware, approveEdit);

module.exports = router;
