// routes/auth.routes.js  (original name: auth.routes.mjs)
const express = require('express');
const router = express.Router();
const { register, login, ResetPassword, changePassword, checkAuth } = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/middlewares.auth');
const { validatePassword } = require('../middlewares/middlewares.passwordvalidator');
const { verifyOTP } = require('../utils/verifyOTP');

router.post('/register', validatePassword, register);
router.post('/login', login);
router.post('/reset-password', authMiddleware, validatePassword, ResetPassword);
router.post('/change-password', validatePassword, changePassword);
router.post('/verify-otp', verifyOTP);
router.get('/check-auth', authMiddleware, checkAuth);

module.exports = router;
