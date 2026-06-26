const express = require('express');
const bcrypt = require('bcryptjs');
const Department = require('../models/Department');
const User = require('../../../auth/models/User.model');
const Faculty = require('../models/Faculty');
const StudentProfile = require('../../student/models/StudentProfile');
const { auth, adminOrVc } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('hod', 'username email name')
      .sort({ name: 1 });
      
    const deptNames = departments.map(d => d.name);
    
    // Count faculty profiles
    const facultyProfiles = await Faculty.find({ 'employmentDetails.department': { $in: deptNames } }).select('employmentDetails.department');
    const facultyCountMap = {};
    facultyProfiles.forEach(p => {
      const dept = p.employmentDetails?.department;
      if (dept) {
        facultyCountMap[dept] = (facultyCountMap[dept] || 0) + 1;
      }
    });

    // Count students
    const studentProfiles = await StudentProfile.find({ 'academic_details.department': { $in: deptNames } }).select('academic_details.department');
    const studentCountMap = {};
    studentProfiles.forEach(s => {
      const dept = s.academic_details?.department;
      if (dept) {
        studentCountMap[dept] = (studentCountMap[dept] || 0) + 1;
      }
    });

    const enriched = departments.map(d => {
      const obj = d.toObject();
      obj.facultyCount = facultyCountMap[d.name] || 0;
      obj.studentCount = studentCountMap[d.name] || 0;
      return obj;
    });

    res.json(enriched);
  } catch (err) {
    console.error(err);
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

// POST /api/departments
router.post('/', adminOrVc, async (req, res) => {
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
    const hashedPassword = await bcrypt.hash('password123', 12);
    const hodUser = await User.create({
      name: hodFullName || username,
      username,
      email,
      password: hashedPassword,
      role: 'hod',
      isFirstLogin: true,
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

// DELETE /api/departments/:id
router.delete('/:id', adminOrVc, async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/departments/:name/overview
router.get('/:name/overview', async (req, res) => {
  try {
    const departmentName = req.params.name;
    const department = await Department.findOne({ name: departmentName }).populate('hod', 'username email name');
    
    if (!department) return res.status(404).json({ message: 'Department not found' });
    
    const profiles = await Faculty.find({ 'employmentDetails.department': departmentName })
      .select('userId personalInfo.fullName personalInfo.designation employmentDetails.designation profileComplete completionPercentage publications projects subjects');
      
    const userIds = profiles.map(p => p.userId);
    const users = await User.find({ _id: { $in: userIds }, role: { $in: ['faculty', 'hod'] } });
    const students = await StudentProfile.countDocuments({ 'academic_details.department': departmentName });

    let totalPublications = 0;
    let totalProjects = 0;
    
    const facultyMembers = profiles.map(p => {
      totalPublications += p.publications ? p.publications.length : 0;
      totalProjects += p.projects ? p.projects.length : 0;
      
      const user = users.find(u => u._id.toString() === p.userId.toString());
      return {
        name: p.personalInfo?.fullName || user?.username || 'Unknown',
        designation: p.employmentDetails?.designation || p.personalInfo?.designation || 'Faculty',
        completionPercentage: p.completionPercentage || 0
      };
    });
    
    res.json({
      name: department.name,
      hodName: department.hod ? (department.hod.name || department.hod.username) : 'No HOD Assigned',
      stats: {
        facultyCount: facultyMembers.length,
        studentCount: students,
        totalPublications,
        totalProjects,
      },
      facultyMembers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


