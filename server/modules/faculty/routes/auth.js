// modules/faculty/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../../auth/models/User.model');
const Faculty = require('../models/Faculty');
const { auth } = require('../middleware/auth');

const router = express.Router();

const generateToken = (user) => jwt.sign(
  { id: user._id, role: user.role, username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// POST /api/faculty/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.info('[auth.login] Request received', {
      username: username || null,
      hasPassword: Boolean(password),
      origin: req.headers.origin || 'no-origin',
      ip: req.ip,
    });

    if (!username || !password) {
      console.warn('[auth.login] Missing credentials');
      return res.status(400).json({ message: 'Username and password required' });
    }

    const user = await User.findOne({ $or: [{ username: username.trim() }, { email: username.trim().toLowerCase() }] }).select('+password');
    
    console.info('[auth.login] User lookup result', {
      username: username.trim().toLowerCase(),
      found: Boolean(user),
    });

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isActive) {
      console.warn('[auth.login] Account deactivated', { userId: user._id });
      return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn('[auth.login] Password mismatch', { email: user.email });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    let facultyProfile = null;
    if (user.role === 'faculty' || user.role === 'hod') {
      facultyProfile = await Faculty.findOne({ userId: user._id }).select('profileComplete completionPercentage personalInfo.fullName personalInfo.photoUrl employmentDetails.department');
    }
    const token = generateToken(user);
    
    console.info('[auth.login] Login success', {
      userId: String(user._id),
      role: user.role,
    });

    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role, isFirstLogin: user.isFirstLogin, isActive: user.isActive }, faculty: facultyProfile });
  } catch (err) { 
    console.error('[auth.login] Error:', err); 
    res.status(500).json({ message: 'Server error' }); 
  }
});

// POST /api/faculty/auth/change-password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    console.info('[auth.change-password] Request received', {
      userId: req.user?._id || null,
      hasCurrentPassword: Boolean(currentPassword),
      hasNewPassword: Boolean(newPassword),
    });

    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both current and new password required' });
    if (newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      console.warn('[auth.change-password] Incorrect current password', { userId: user._id });
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.password = await bcrypt.hash(newPassword, 12);
    user.isFirstLogin = false;
    await user.save();
    console.info('[auth.change-password] Password updated successfully', { userId: user._id });
    res.json({ message: 'Password changed successfully' });
  } catch (err) { 
    console.error('[auth.change-password] Error:', err); 
    res.status(500).json({ message: 'Server error' }); 
  }
});

// GET /api/faculty/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = req.user;
    let facultyProfile = null;
    if (user.role === 'faculty' || user.role === 'hod') {
      facultyProfile = await Faculty.findOne({ userId: user._id }).select('profileComplete completionPercentage personalInfo.fullName personalInfo.photoUrl employmentDetails.department');
    }
    res.json({ user, faculty: facultyProfile });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;

