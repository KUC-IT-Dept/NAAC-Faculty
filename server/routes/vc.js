const express = require('express');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const { auth, vcOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth, vcOnly);

// GET /api/vc/faculty
// Get all faculty for the hierarchy builder
router.get('/faculty', async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['faculty', 'hod'] } }).select('-password').sort({ createdAt: -1 });
    const profiles = await Faculty.find({ userId: { $in: users.map(u => u._id) } })
      .select('userId personalInfo.fullName personalInfo.designation personalInfo.department personalInfo.photoUrl employmentDetails.designation employmentDetails.department profileComplete completionPercentage');
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.userId.toString()] = p; });
    res.json(users.map(u => ({ ...u.toObject(), profile: profileMap[u._id.toString()] || null })));
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/vc/hierarchy
// Gets all departments and their faculty
router.get('/hierarchy', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    const facultyUsers = await User.find({ role: { $in: ['faculty', 'hod'] }, isActive: true }).select('_id role');
    const facultyIds = facultyUsers.map(u => u._id);
    
    const profiles = await Faculty.find({ userId: { $in: facultyIds } })
      .select('userId username personalInfo.fullName personalInfo.photoUrl employmentDetails.department employmentDetails.designation');

    const hierarchy = departments.map(dept => {
      const deptFaculty = profiles.filter(p => p.employmentDetails?.department === dept.name);
      return {
        _id: dept._id,
        name: dept.name,
        faculty: deptFaculty
      };
    });

    res.json(hierarchy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Note: /api/departments handles adding new departments.

module.exports = router;
