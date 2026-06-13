const express = require('express');
const Department = require('../models/Department');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const { auth, adminOrVc } = require('../middleware/auth');

const router = express.Router();
router.use(auth, adminOrVc);

// GET /api/departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('hod', 'username email')
      .sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/departments
router.post('/', async (req, res) => {
  try {
    const { name, hodEmail, hodFullName } = req.body;
    if (!name || !hodEmail) {
      return res.status(400).json({ message: 'Department name and HOD email are required' });
    }

    const existingDept = await Department.findOne({ name: name.trim() });
    if (existingDept) {
      return res.status(409).json({ message: 'Department already exists' });
    }

    const email = hodEmail.trim().toLowerCase();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Derive username from email prefix
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
    let username = baseUsername;
    let counter = 1;
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter++}`;
    }

    // Create HOD User
    const hodUser = await User.create({
      username,
      email,
      password: 'password123',
      role: 'hod',
      isFirstLogin: true,
      createdBy: req.user._id,
    });

    // Create Faculty Profile for HOD
    const adminFullName = hodFullName ? `temp--${hodFullName}` : '';
    await Faculty.create({
      userId: hodUser._id,
      username: hodUser.username,
      personalInfo: { fullName: adminFullName, officialEmail: email },
      employmentDetails: { department: name.trim(), designation: 'HOD' },
    });

    // Create Department
    const department = await Department.create({
      name: name.trim(),
      hod: hodUser._id,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: 'Department and HOD account created successfully',
      department,
      hodUser: { id: hodUser._id, username: hodUser.username, email: hodUser.email },
      defaultPassword: 'password123',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
