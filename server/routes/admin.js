const express = require('express');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth, adminOnly);

// GET /api/admin/faculty
router.get('/faculty', async (req, res) => {
  try {
    const users = await User.find({ role: 'faculty' }).select('-password').sort({ createdAt: -1 });
    const profiles = await Faculty.find({ userId: { $in: users.map(u => u._id) } })
      .select('userId personalInfo.fullName personalInfo.designation personalInfo.department personalInfo.photoUrl profileComplete completionPercentage');
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.userId.toString()] = p; });
    res.json(users.map(u => ({ ...u.toObject(), profile: profileMap[u._id.toString()] || null })));
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/admin/faculty — create faculty (email + optional fullName, password defaults to password123)
router.post('/faculty', async (req, res) => {
  try {
    const { email, fullName } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    // Derive username from email prefix
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
    let username = baseUsername;
    let counter = 1;
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter++}`;
    }

    const user = await User.create({
      username,
      email: email.trim().toLowerCase(),
      password: 'password123',
      role: 'faculty',
      isFirstLogin: true,
      createdBy: req.user._id,
    });

    await Faculty.create({
      userId: user._id,
      username: user.username,
      personalInfo: { fullName: fullName || '', officialEmail: email.trim().toLowerCase() },
    });

    res.status(201).json({
      message: 'Faculty account created',
      user: { id: user._id, username: user.username, email: user.email },
      defaultPassword: 'password123',
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// PATCH /api/admin/faculty/:id/status
router.patch('/faculty/:id/status', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'faculty' });
    if (!user) return res.status(404).json({ message: 'Faculty not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `Account ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/admin/faculty/:id
router.delete('/faculty/:id', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'faculty' });
    if (!user) return res.status(404).json({ message: 'Faculty not found' });
    await Faculty.deleteOne({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'Faculty account deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const total = await User.countDocuments({ role: 'faculty' });
    const active = await User.countDocuments({ role: 'faculty', isActive: true });
    const profilesComplete = await Faculty.countDocuments({ profileComplete: true });
    res.json({ total, active, inactive: total - active, profilesComplete });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
