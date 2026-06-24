const express = require('express');
const bcrypt = require('bcryptjs');
const Department = require('../models/Department');
const User = require('../../../auth/models/User.model');
const Faculty = require('../models/Faculty');
const { auth, adminOrVc } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('hod', 'name username email')
      .sort({ name: 1 });
    
    // For each department, find the faculty count
    const deptsWithStats = await Promise.all(departments.map(async (dept) => {
      const facultyCount = await Faculty.countDocuments({ 'employmentDetails.department': dept.name });
      let studentCount = 0;
      try {
        const StudentProfile = require('../../student/models/StudentProfile');
        studentCount = await StudentProfile.countDocuments({ 'academic_details.department': dept.name });
      } catch (e) {
        studentCount = 0;
      }
      
      let hodName = 'No HOD Assigned';
      if (dept.hod) {
        const hodProfile = await Faculty.findOne({ userId: dept.hod._id }).select('personalInfo.fullName');
        if (hodProfile && hodProfile.personalInfo?.fullName) {
          hodName = hodProfile.personalInfo.fullName;
        } else if (dept.hod.name) {
          hodName = dept.hod.name;
        } else {
          hodName = dept.hod.username || 'No HOD';
        }
      }
      
      return {
        ...dept.toObject(),
        facultyCount,
        hodName,
        studentCount
      };
    }));
    
    res.json(deptsWithStats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/departments/:name/faculty
router.get('/:name/faculty', async (req, res) => {
  try {
    console.log(`[DEBUG] Fetching faculty for department: "${req.params.name}"`);
    const profiles = await Faculty.find({ 'employmentDetails.department': req.params.name })
      .select('userId username personalInfo.fullName personalInfo.designation personalInfo.photoUrl employmentDetails.designation employmentDetails.department profileComplete completionPercentage');

    console.log(`[DEBUG] Found ${profiles.length} profiles for department "${req.params.name}"`);

    const userIds = profiles.map(p => p.userId);
    const users = await User.find({ _id: { $in: userIds }, role: { $in: ['faculty', 'hod'] } }).select('-password').sort({ createdAt: -1 });

    console.log(`[DEBUG] Found ${users.length} users matching those profiles`);

    const profileMap = {};
    profiles.forEach(p => { profileMap[p.userId.toString()] = p; });
    res.json(users.map(u => ({ ...u.toObject(), profile: profileMap[u._id.toString()] || null })));
  } catch (err) {
    console.error("[DEBUG] Error fetching faculty by department:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/departments/:name/overview
router.get('/:name/overview', async (req, res) => {
  try {
    const deptName = req.params.name.trim();
    const department = await Department.findOne({ name: deptName })
      .populate('hod', 'name username email');
      
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // 1. Fetch HOD profile if available
    let hodName = 'No HOD Assigned';
    if (department.hod) {
      const hodProfile = await Faculty.findOne({ userId: department.hod._id }).select('personalInfo.fullName');
      if (hodProfile && hodProfile.personalInfo?.fullName) {
        hodName = hodProfile.personalInfo.fullName;
      } else if (department.hod.name) {
        hodName = department.hod.name;
      } else {
        hodName = department.hod.username || 'No HOD';
      }
    }

    // 2. Fetch all faculty profiles in this department
    const facultyProfiles = await Faculty.find({ 'employmentDetails.department': deptName });
    const facultyCount = facultyProfiles.length;

    // 3. Compute stats
    let totalPublications = 0;
    let totalProjects = 0;
    let totalQualifications = 0;
    let totalAwards = 0;
    let sumCompletion = 0;

    let scopusPubs = 0;
    let ugcPubs = 0;
    let bookChapters = 0;
    let books = 0;

    facultyProfiles.forEach(profile => {
      const pubs = profile.publications || [];
      const projs = profile.projects || [];
      const quals = profile.qualifications || [];
      const awds = profile.awards || [];

      totalPublications += pubs.length;
      totalProjects += projs.length;
      totalQualifications += quals.length;
      totalAwards += awds.length;
      sumCompletion += (profile.completionPercentage || 0);

      pubs.forEach(pub => {
        const typeLower = (pub.type || '').toLowerCase();
        const indexedLower = (pub.indexedIn || '').toLowerCase();

        if (indexedLower.includes('scopus')) {
          scopusPubs++;
        }
        if (indexedLower.includes('ugc')) {
          ugcPubs++;
        }
        if (typeLower.includes('chapter')) {
          bookChapters++;
        }
        if (typeLower.includes('book') && !typeLower.includes('chapter')) {
          books++;
        }
      });
    });

    const avgPublications = facultyCount > 0 ? parseFloat((totalPublications / facultyCount).toFixed(2)) : 0;
    const profileCompletionRate = facultyCount > 0 ? parseFloat((sumCompletion / facultyCount).toFixed(2)) : 0;

    // 4. Fetch students count matching this department
    let totalStudents = 0;
    let ugStudents = 0;
    let pgStudents = 0;
    let scholarStudents = 0;

    try {
      const StudentProfile = require('../../student/models/StudentProfile');
      totalStudents = await StudentProfile.countDocuments({ 'academic_details.department': deptName });
      ugStudents = await StudentProfile.countDocuments({ 'academic_details.department': deptName, 'academic_details.programLevel': 'UG' });
      pgStudents = await StudentProfile.countDocuments({ 'academic_details.department': deptName, 'academic_details.programLevel': 'PG' });
      scholarStudents = await StudentProfile.countDocuments({ 
        'academic_details.department': deptName, 
        'academic_details.programLevel': { $in: ['PhD', 'M.Phil', 'PostDoc'] } 
      });
    } catch (e) {
      console.error('[GET department overview] StudentProfile load/query error', e);
    }

    // 5. Format faculty list
    const facultyMembers = facultyProfiles.map(p => ({
      name: p.personalInfo?.fullName || p.username || 'Faculty',
      designation: p.employmentDetails?.designation || 'Faculty',
      completionPercentage: p.completionPercentage || 0
    }));

    res.json({
      name: department.name,
      hodName,
      stats: {
        facultyCount,
        totalPublications,
        totalProjects,
        totalQualifications,
        avgPublications,
        studentCount: totalStudents
      },
      facultyMembers,
      publications: {
        total: totalPublications,
        scopus: scopusPubs,
        ugc: ugcPubs,
        bookChapters,
        books
      },
      students: {
        total: totalStudents,
        ug: ugStudents,
        pg: pgStudents,
        scholars: scholarStudents
      },
      performance: {
        facultyCount,
        publications: totalPublications,
        projects: totalProjects,
        awards: totalAwards,
        profileCompletionRate
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/departments/:name/publications
router.get('/:name/publications', async (req, res) => {
  try {
    const deptName = req.params.name.trim();
    const facultyProfiles = await Faculty.find({ 'employmentDetails.department': deptName }).select('personalInfo.fullName publications');
    const pubs = [];
    facultyProfiles.forEach(fp => {
      const owner = fp.personalInfo?.fullName || fp.username || 'Faculty';
      (fp.publications || []).forEach(p => {
        pubs.push({
          title: p.title || '',
          authors: p.authors || owner,
          journal: p.journal || '',
          year: p.year || '',
          indexedIn: p.indexedIn || '',
          owner
        });
      });
    });
    res.json(pubs);
  } catch (err) {
    console.error('[GET dept publications] error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/departments/:name/projects
router.get('/:name/projects', async (req, res) => {
  try {
    const deptName = req.params.name.trim();
    const facultyProfiles = await Faculty.find({ 'employmentDetails.department': deptName }).select('personalInfo.fullName projects');
    const projs = [];
    facultyProfiles.forEach(fp => {
      const owner = fp.personalInfo?.fullName || fp.username || 'Faculty';
      (fp.projects || []).forEach(p => {
        projs.push({
          title: p.title || '',
          principalInvestigator: p.role === 'PI' || p.role === 'Principal Investigator' ? owner : (p.principalInvestigator || owner),
          fundingAgency: p.fundingAgency || '',
          status: p.status || '',
          owner
        });
      });
    });
    res.json(projs);
  } catch (err) {
    console.error('[GET dept projects] error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/departments/:name/qualifications
router.get('/:name/qualifications', async (req, res) => {
  try {
    const deptName = req.params.name.trim();
    const facultyProfiles = await Faculty.find({ 'employmentDetails.department': deptName }).select('personalInfo.fullName qualifications');
    const quals = [];
    facultyProfiles.forEach(fp => {
      const owner = fp.personalInfo?.fullName || fp.username || 'Faculty';
      (fp.qualifications || []).forEach(q => {
        quals.push({
          facultyName: owner,
          degree: q.degreeName || q.degreeLevel || '',
          specialization: q.specialization || '',
          university: q.university || q.boardUniversity || ''
        });
      });
    });
    res.json(quals);
  } catch (err) {
    console.error('[GET dept qualifications] error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/departments/:name/publication-analytics
router.get('/:name/publication-analytics', async (req, res) => {
  try {
    const deptName = req.params.name.trim();
    const facultyProfiles = await Faculty.find({ 'employmentDetails.department': deptName }).select('personalInfo.fullName publications');
    const perFaculty = facultyProfiles.map(fp => ({
      name: fp.personalInfo?.fullName || fp.username || 'Faculty',
      count: (fp.publications || []).length
    }));
    const total = perFaculty.reduce((s, f) => s + f.count, 0);
    const avg = perFaculty.length > 0 ? parseFloat((total / perFaculty.length).toFixed(2)) : 0;
    const sorted = [...perFaculty].sort((a, b) => b.count - a.count);
    res.json({ total, avg, perFaculty: sorted, topContributors: sorted.slice(0, 5) });
  } catch (err) {
    console.error('[GET publication analytics] error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/departments/:name/achievements
router.get('/:name/achievements', async (req, res) => {
  try {
    const deptName = req.params.name.trim();
    const facultyProfiles = await Faculty.find({ 'employmentDetails.department': deptName }).select('personalInfo.fullName awards');
    const awds = [];
    facultyProfiles.forEach(fp => {
      const owner = fp.personalInfo?.fullName || fp.username || 'Faculty';
      (fp.awards || []).forEach(a => {
        awds.push({
          title: a.name || '',
          awardingAgency: a.awardingAgency || '',
          year: a.yearReceived || a.dateOfAward || '',
          faculty: owner
        });
      });
    });
    res.json(awds);
  } catch (err) {
    console.error('[GET dept achievements] error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/departments
router.post('/', adminOrVc, async (req, res) => {
  try {
    const { name, hodEmail } = req.body;
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
    const hashedPassword = await bcrypt.hash('password123', 12);
    const hodUser = await User.create({
      name: username,
      username,
      email,
      password: hashedPassword,
      role: 'hod',
      isFirstLogin: true,
    });

    // Create Faculty Profile for HOD
    await Faculty.create({
      userId: hodUser._id,
      username: hodUser.username,
      personalInfo: { fullName: '', officialEmail: email },
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


