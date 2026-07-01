const express = require('express');
const User = require('../../../auth/models/User.model');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const { auth, vcOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth, vcOnly);

// GET /api/vc/stats
// Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalFaculty = await User.countDocuments({ role: { $in: ['faculty', 'hod'] } });
    const totalDepartments = await Department.countDocuments();
    const facultyProfiles = await Faculty.countDocuments({ profileComplete: true });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeUsers = await User.countDocuments({ isActive: true });
    
    const aggregates = await Faculty.aggregate([
      {
        $group: {
          _id: null,
          totalPublications: { $sum: { $size: { $ifNull: ["$publications", []] } } },
          totalProjects: { $sum: { $size: { $ifNull: ["$projects", []] } } },
          totalAwards: { $sum: { $size: { $ifNull: ["$awards", []] } } }
        }
      }
    ]);
    
    const counts = aggregates[0] || { totalPublications: 0, totalProjects: 0, totalAwards: 0 };
    
    res.json({
      totalFaculty,
      totalDepartments,
      facultyProfiles,
      totalStudents,
      totalPublications: counts.totalPublications,
      totalProjects: counts.totalProjects,
      totalAwards: counts.totalAwards,
      activeUsers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/vc/faculty
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

// GET /api/vc/publications
// Gets all publications across all faculty members
router.get('/publications', async (req, res) => {
  try {
    const publications = await Faculty.aggregate([
      { $unwind: "$publications" },
      {
        $project: {
          _id: 0,
          facultyId: "$userId",
          authorName: { $ifNull: ["$personalInfo.fullName", "$username"] },
          department: "$employmentDetails.department",
          title: "$publications.title",
          type: "$publications.type",
          authors: "$publications.authors",
          journal: "$publications.journal",
          year: "$publications.year",
          indexedIn: "$publications.indexedIn",
          documentUrl: "$publications.documentUrl",
          createdAt: "$publications.createdAt"
        }
      },
      { $sort: { year: -1, title: 1 } }
    ]);
    res.json(publications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
