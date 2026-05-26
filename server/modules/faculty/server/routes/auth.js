const express = require('express');
const router = express.Router();

const {
    login,
    getMe,
    updatePassword
} = require('../controllers/authController');

const authenticate = require('../../../../auth/middleware/authenticate');

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/password', authenticate, updatePassword);

module.exports = router;