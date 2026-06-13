const express = require('express');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const DropdownConfig = require('../models/DropdownConfig');
const OptionRequest = require('../models/OptionRequest');
const Department = require('../models/Department');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth, adminOnly);

// GET /api/admin/faculty
router.get('/faculty', async (req, res) => {
  try {
    const users = await User.find({ role: 'faculty' }).select('-password').sort({ createdAt: -1 });
    const profiles = await Faculty.find({ userId: { $in: users.map(u => u._id) } })
      .select('userId personalInfo.fullName personalInfo.designation personalInfo.department personalInfo.photoUrl employmentDetails.designation employmentDetails.department profileComplete completionPercentage');
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

    const adminFullName = fullName ? `temp--${fullName}` : '';
    await Faculty.create({
      userId: user._id,
      username: user.username,
      personalInfo: { fullName: adminFullName, officialEmail: email.trim().toLowerCase() },
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

// PATCH /api/admin/faculty/:id/make-hod
router.patch('/faculty/:id/make-hod', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'faculty' });
    if (!user) return res.status(404).json({ message: 'Faculty not found' });

    const faculty = await Faculty.findOne({ userId: user._id });
    if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });

    const dept = faculty.employmentDetails?.department;
    if (!dept) {
      return res.status(400).json({ message: 'Department is not configured in Employment Details. Please edit the profile first.' });
    }

    // Demote any existing HOD in the same department
    await Faculty.updateMany(
      {
        'employmentDetails.department': dept,
        'employmentDetails.designation': 'HOD',
        userId: { $ne: user._id }
      },
      {
        $set: { 'employmentDetails.designation': 'Professor' }
      }
    );

    // Also demote their role back to faculty if they were HOD
    const previousHodFaculty = await Faculty.findOne({ 'employmentDetails.department': dept, 'employmentDetails.designation': 'Professor', userId: { $ne: user._id } });
    if(previousHodFaculty) {
       await User.updateOne({ _id: previousHodFaculty.userId }, { role: 'faculty' });
    }

    // Promote target to HOD
    faculty.employmentDetails.designation = 'HOD';
    await faculty.save();
    
    // Update User Role
    user.role = 'hod';
    await user.save();

    // Upsert Department model
    await Department.findOneAndUpdate(
      { name: dept },
      { hod: user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: `Successfully promoted ${faculty.personalInfo?.fullName || user.username} to HOD of ${dept}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
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

const ALLOWED_DROPDOWN_KEYS = [
  'gender', 'blood_group', 'nationality', 'religion', 'category', 'sub_category', 'marital_status', 'disability_status', 'disability_type', 'state', 'country',
  'degree_level', 'degree_name', 'specialization', 'division', 'study_mode', 'grade_type',
  'exam_name', 'subject_paper', 'state_for_set', 'validity_status', 'fellowship_agency',
  'designation', 'department', 'institution_type', 'affiliated_university', 'nature_of_appointment', 'approval_status', 'pay_scale',
  'designation_post', 'nature_of_work', 'employment_type', 'institution_type_work', 'experience_category', 'reason_for_leaving',
  'publication_type', 'publication_level', 'author_role', 'indexed_in', 'peer_reviewed_status', 'journal_category',
  'award_category', 'award_level', 'awarding_agency_type', 'honour_type', 'recognition_status',
  'funding_agency', 'project_status', 'role_in_project', 'project_category', 'funding_type',
  'research_degree', 'scholar_gender', 'research_status', 'guidance_type', 'patent_status', 'patent_type', 'supervision_category',
  'committee_type', 'responsibility_role', 'course_level', 'semester_type', 'academic_session_type', 'teaching_category', 'responsibility_status',
  'admin_charge', 'academic_admin', 'quality_assurance', 'research_innovation', 'examination_evaluation', 'admin_support', 'departmental_charges', 'special_assignments', 'extra_institutional',
  'country_visit', 'purpose_of_visit', 'funding_source', 'visit_category', 'collaboration_type', 'visit_status',
  'document_type', 'institutions'
];

// GET /api/admin/dropdowns
router.get('/dropdowns', async (req, res) => {
  try {
    const dropdowns = await DropdownConfig.find({ key: { $in: ALLOWED_DROPDOWN_KEYS } });
    const response = {};
    dropdowns.forEach(dl => { response[dl.key] = dl.options; });
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/dropdowns/:key
router.patch('/dropdowns/:key', async (req, res) => {
  try {
    const key = req.params.key;
    if (!ALLOWED_DROPDOWN_KEYS.includes(key)) return res.status(400).json({ message: 'Invalid dropdown key' });
    const { options } = req.body;
    if (!Array.isArray(options)) return res.status(400).json({ message: 'Options must be an array' });

    const updated = await DropdownConfig.findOneAndUpdate(
      { key },
      { options },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/option-requests
router.get('/option-requests', async (req, res) => {
  try {
    const requests = await OptionRequest.find({})
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/option-requests/:id/approve
router.patch('/option-requests/:id/approve', async (req, res) => {
  try {
    const { adminMessage } = req.body;
    const request = await OptionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ message: 'Request is not pending' });

    request.status = 'APPROVED';
    if (adminMessage) request.adminMessage = adminMessage;
    await request.save();

    // Push to DropdownConfig
    const serverKey = request.dropdownKey.replace(/Options$/, '').replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    if (ALLOWED_DROPDOWN_KEYS.includes(serverKey)) {
      const config = await DropdownConfig.findOne({ key: serverKey });
      if (config) {
        if (!config.options.includes(request.requestedValue)) {
          config.options.push(request.requestedValue);
          await config.save();
        }
      } else {
        // Find default from somewhere? Or just create with this one.
        await DropdownConfig.create({ key: serverKey, options: [request.requestedValue] });
      }
    }
    
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/option-requests/:id/reject
router.patch('/option-requests/:id/reject', async (req, res) => {
  try {
    const { adminMessage } = req.body;
    const request = await OptionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ message: 'Request is not pending' });

    request.status = 'REJECTED';
    if (adminMessage) request.adminMessage = adminMessage;
    await request.save();

    // Revert the value in the user's profile to blank
    const faculty = await Faculty.findOne({ userId: request.user });
    if (faculty) {
      let modified = false;
      let raw = faculty.toObject();
      const replaceDeep = (obj) => {
        for (let key in obj) {
          if (typeof obj[key] === 'string' && obj[key] === request.requestedValue) {
            obj[key] = '';
            modified = true;
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            replaceDeep(obj[key]);
          }
        }
      };
      replaceDeep(raw);
      if (modified) {
        await Faculty.updateOne({ _id: faculty._id }, { $set: raw });
      }
    }
    
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/option-requests/:id/undo
router.patch('/option-requests/:id/undo', async (req, res) => {
  try {
    const request = await OptionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status === 'PENDING') return res.status(400).json({ message: 'Request is already pending' });

    const prevStatus = request.status;
    request.status = 'PENDING';
    request.adminMessage = '';
    await request.save();

    if (prevStatus === 'APPROVED') {
      // Revert from DropdownConfig
      const serverKey = request.dropdownKey.replace(/Options$/, '').replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
      if (ALLOWED_DROPDOWN_KEYS.includes(serverKey)) {
        const config = await DropdownConfig.findOne({ key: serverKey });
        if (config && config.options.includes(request.requestedValue)) {
          config.options = config.options.filter(o => o !== request.requestedValue);
          await config.save();
        }
      }
    } else if (prevStatus === 'REJECTED') {
      // Revert the value in the user's profile back to the requested value
      // Note: This is an approximation. If the user changed it in the meantime, this might overwrite it.
      // A more robust implementation would check if it's still previousValue.
      const faculty = await Faculty.findOne({ userId: request.user });
      if (faculty && request.previousValue !== undefined) {
        let modified = false;
        let raw = faculty.toObject();
        const replaceDeep = (obj) => {
          for (let key in obj) {
            if (typeof obj[key] === 'string' && obj[key] === request.previousValue) {
              obj[key] = request.requestedValue;
              modified = true;
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              replaceDeep(obj[key]);
            }
          }
        };
        // Only revert if previousValue was not empty, to avoid changing all empty fields
        if (request.previousValue !== '') {
          replaceDeep(raw);
          if (modified) {
            await Faculty.updateOne({ _id: faculty._id }, { $set: raw });
          }
        }
      }
    }

    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
