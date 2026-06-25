const express = require('express');
const User = require('../../../auth/models/User.model');
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

// GET /api/vc/stats
// General dashboard counts for VC
router.get('/stats', async (req, res) => {
  try {
    const totalFaculty = await User.countDocuments({ role: { $in: ['faculty', 'hod'] } });
    const totalDepartments = await Department.countDocuments();
    const facultyProfiles = await Faculty.countDocuments();

    // publications, projects, awards aggregated across faculty profiles
    const pubsAgg = await Faculty.aggregate([
      { $project: { pubs: { $ifNull: ['$publications', []] }, projs: { $ifNull: ['$projects', []] }, awds: { $ifNull: ['$awards', []] } } },
      { $group: { _id: null, totalPubs: { $sum: { $size: '$pubs' } }, totalProjects: { $sum: { $size: '$projs' } }, totalAwards: { $sum: { $size: '$awds' } } } }
    ]);

    const totalPublications = (pubsAgg[0] && pubsAgg[0].totalPubs) || 0;
    const totalProjects = (pubsAgg[0] && pubsAgg[0].totalProjects) || 0;
    const totalAwards = (pubsAgg[0] && pubsAgg[0].totalAwards) || 0;

    // students count (if StudentProfile model exists)
    let totalStudents = 0;
    try {
      // require here to avoid circular deps if student module missing
      // eslint-disable-next-line global-require
      const StudentProfile = require('../../student/models/StudentProfile');
      totalStudents = await StudentProfile.countDocuments();
    } catch (e) {
      totalStudents = 0;
    }

    // active users (all roles)
    const activeUsers = await User.countDocuments({ isActive: true });

    res.json({ totalFaculty, totalDepartments, facultyProfiles, totalStudents, totalPublications, totalProjects, totalAwards, activeUsers });
  } catch (err) {
    console.error('[GET /vc/stats]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/vc/faculty-by-department
router.get('/faculty-by-department', async (req, res) => {
  try {
    const depts = await Department.find().sort({ name: 1 });
    const result = [];
    for (const d of depts) {
      const members = await Faculty.find({ 'employmentDetails.department': d.name }).select('userId username personalInfo.fullName profileComplete completionPercentage');
      result.push({ department: d.name, count: members.length, avgCompletion: members.reduce((s, m) => s + (m.completionPercentage || 0), 0) / (members.length || 1), members });
    }
    res.json(result);
  } catch (err) {
    console.error('[GET /vc/faculty-by-department]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/vc/recent-faculty
router.get('/recent-faculty', async (req, res) => {
  try {
    const recent = await Faculty.find().sort({ createdAt: -1 }).limit(10).select('userId username personalInfo.fullName personalInfo.photoUrl completionPercentage createdAt');
    res.json(recent);
  } catch (err) {
    console.error('[GET /vc/recent-faculty]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/vc/recent-students
router.get('/recent-students', async (req, res) => {
  try {
    let recent = [];
    try {
      // eslint-disable-next-line global-require
      const StudentProfile = require('../../student/models/StudentProfile');
      recent = await StudentProfile.find().sort({ createdAt: -1 }).limit(10).select('userId personal_details.fullName contact_details.personalEmail createdAt');
    } catch (e) {
      recent = [];
    }
    res.json(recent);
  } catch (err) {
    console.error('[GET /vc/recent-students]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Note: /api/departments handles adding new departments.

module.exports = router;


