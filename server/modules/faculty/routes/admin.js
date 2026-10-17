const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../../../auth/models/User.model');
const Faculty = require('../models/Faculty');
const DropdownConfig = require('../models/DropdownConfig');
const OptionRequest = require('../models/OptionRequest');
const Department = require('../models/Department');
const crypto = require('crypto');
const { auth, adminOrVc, adminOnly } = require('../middleware/auth');
const { ROLES, INSTITUTIONAL_ROLE_MODULES } = require('../../../auth/constants/roles');

const router = express.Router();
router.use(auth, adminOrVc);

// GET /api/admin/faculty
router.get('/faculty', async (req, res) => {
  try {
    const users = await User.find({ role: 'faculty' }).select('-password').sort({ createdAt: -1 });
    const profiles = await Faculty.find({ userId: { $in: users.map(u => u._id) } })
      .select('userId personalInfo.fullName personalInfo.designation personalInfo.department personalInfo.photoUrl employmentDetails.designation employmentDetails.department profileComplete completionPercentage');
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.userId.toString()] = p; });
    res.json(users.map(u => ({ ...u.toObject(), profile: profileMap[u._id.toString()] || null })));
  } catch (err) { console.error('[GET /admin/faculty]', err); res.status(500).json({ message: 'Server error' }); }
});

// POST /api/admin/faculty â€” create faculty (email + department + optional fullName, password defaults to password123)
router.post('/faculty', async (req, res) => {
  try {
    const { email, fullName, department } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Department is required and must be a non-empty string. Validated before any
    // DB write so a bad request never leaves a faculty account without a department.
    if (!department || typeof department !== 'string' || !department.trim()) {
      return res.status(400).json({ message: 'Department is required' });
    }
    const trimmedDept = department.trim();

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    // Derive username from email prefix
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
    let username = baseUsername;
    let counter = 1;
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter++}`;
    }

    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = await User.create({
      name: fullName || username,
      username,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'faculty',
      department: trimmedDept,
      isFirstLogin: true,
    });

    // Persist department exactly where updateFacultyDepartment effectively does:
    // User.department and Faculty.employmentDetails.department (the field analytics
    // uses). Note: personalInfo.department is NOT in the Faculty schema, so Mongoose
    // strict mode drops it on both create and edit; it is deliberately not written here.
    const adminFullName = fullName ? `temp--${fullName}` : '';
    await Faculty.create({
      userId: user._id,
      username: user.username,
      personalInfo: { fullName: adminFullName, officialEmail: email.trim().toLowerCase() },
      employmentDetails: { department: trimmedDept },
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

// PUT & PATCH /api/faculty/admin/faculty/:id/department
const updateFacultyDepartment = async (req, res) => {
  try {
    const { department } = req.body;
    if (!department || typeof department !== 'string' || !department.trim()) {
      return res.status(400).json({ message: 'Department is required' });
    }

    const trimmedDept = department.trim();
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Faculty user not found' });
    }

    // Update User department
    user.department = trimmedDept;
    await user.save();

    // Update Faculty profile department
    const faculty = await Faculty.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          'employmentDetails.department': trimmedDept,
          'personalInfo.department': trimmedDept
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      message: 'Faculty department updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department
      },
      faculty
    });
  } catch (err) {
    console.error('[PUT /admin/faculty/:id/department]', err);
    res.status(500).json({ message: 'Server error while updating faculty department' });
  }
};

router.put('/faculty/:id/department', updateFacultyDepartment);
router.patch('/faculty/:id/department', updateFacultyDepartment);


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
  'committee_type', 'responsibility_role', 'course_level', 'semester_type', 'academic_session_type', 'teaching_category', 'responsibility_status', 'course_name', 'programme',
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

// ── Special Faculty Responsibilities (Library / MMTTC) ─────────────────────
// Reuses the existing auth/models/User.model.js `modulePermissions` field -
// the SAME field/mechanism already enforced by authorizeModule() on the
// Library/MMTTC routes (see modules/library/routes/library.routes.js and
// modules/mmttc/routes/mmttc.routes.js) for 'staff' accounts. No second
// permission system is introduced; this just gives Admin a UI/API to set
// that field for 'faculty' accounts too. This whole router is already
// gated by `router.use(auth, adminOrVc)` above, so only admin/superadmin/vc
// can reach these two routes - a faculty member can never call them,
// satisfying "faculty cannot assign responsibilities to themselves/others".
const SPECIAL_RESPONSIBILITY_KEYS = ['library', 'mmttc'];

// GET /api/faculty/admin/special-responsibilities
router.get('/special-responsibilities', async (req, res) => {
  try {
    const users = await User.find({ role: 'faculty' }).select('-password').sort({ name: 1, username: 1 });
    const profiles = await Faculty.find({ userId: { $in: users.map(u => u._id) } })
      .select('userId employmentDetails.designation employmentDetails.department personalInfo.fullName');
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.userId.toString()] = p; });

    const list = users.map(u => {
      const profile = profileMap[u._id.toString()];
      return {
        id: u._id,
        name: (profile?.personalInfo?.fullName || u.name || u.username || '').replace(/^temp--/, ''),
        email: u.email,
        department: profile?.employmentDetails?.department || u.department || '',
        designation: profile?.employmentDetails?.designation || '',
        modulePermissions: (u.modulePermissions || []).filter(p => SPECIAL_RESPONSIBILITY_KEYS.includes(p)),
      };
    });
    res.json(list);
  } catch (err) {
    console.error('[GET /admin/special-responsibilities]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/faculty/admin/special-responsibilities/:userId
// Body: { library?: boolean, mmttc?: boolean }. Only the keys present in
// the body are changed; any other modulePermissions entries the account
// might already have (from a different mechanism) are left untouched.
//
// IMPORTANT: this uses an atomic findByIdAndUpdate($set) on ONLY the
// modulePermissions field, not load->mutate->save(). Document#save()
// revalidates every required path on the WHOLE document (name, password,
// email, ...) even when they weren't touched, so a pre-existing account
// that's missing a required field for any unrelated historical reason
// (bad legacy data, a doc inserted before a schema constraint was added,
// etc.) would make this endpoint fail with e.g. "name is required" even
// though we never read or write `name`. findByIdAndUpdate + $set only
// validates the path(s) actually being set (with runValidators: true),
// so it can never be blocked by - or accidentally clobber - any other
// field on the document.
router.put('/special-responsibilities/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { library, mmttc } = req.body;

    // Read-only lookup first, to check existence + role. Selecting just
    // these two fields also means we never need the password hash here.
    const existing = await User.findById(userId).select('role modulePermissions');
    if (!existing) return res.status(404).json({ message: 'Faculty member not found' });
    if (existing.role !== 'faculty') {
      return res.status(400).json({ message: 'Special responsibilities can only be assigned to faculty accounts.' });
    }

    const current = new Set(existing.modulePermissions || []);
    if (typeof library === 'boolean') { library ? current.add('library') : current.delete('library'); }
    if (typeof mmttc === 'boolean') { mmttc ? current.add('mmttc') : current.delete('mmttc'); }
    const modulePermissions = Array.from(current);

    // Atomic, scoped update - touches ONLY modulePermissions. Every other
    // field on the document (name, email, password, department, ...) is
    // left exactly as it was.
    const target = await User.findByIdAndUpdate(
      userId,
      { $set: { modulePermissions } },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');

    res.json({ message: 'Special responsibilities updated', modulePermissions: target.modulePermissions });
  } catch (err) {
    console.error('[PUT /admin/special-responsibilities/:userId]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Institutional Accounts (Librarian / MMTTC Director) ────────────────────
// One designated account per institutional role. The role is derived ONLY from
// the :type URL segment (never from the request body), every route is
// admin/superadmin only (adminOnly - stricter than the router-level adminOrVc,
// so a VC cannot manage these), and responses never contain password/OTP data.
//
//   GET    /institutional-accounts                      both accounts (or null)
//   POST   /institutional-accounts/:type                create (409 if one exists)
//   PATCH  /institutional-accounts/:type                edit name / email / phone
//   PATCH  /institutional-accounts/:type/deactivate     isActive = false
//   PATCH  /institutional-accounts/:type/reactivate     isActive = true
//   POST   /institutional-accounts/:type/reset-password new temporary password
const INSTITUTIONAL_TYPES = { librarian: ROLES.LIBRARIAN, mmttc_director: ROLES.MMTTC_DIRECTOR };
const EMAIL_RE = /^\S+@\S+\.\S+$/;

const resolveInstitutionalRole = (req, res, next) => {
  const role = Object.prototype.hasOwnProperty.call(INSTITUTIONAL_TYPES, req.params.type) ? INSTITUTIONAL_TYPES[req.params.type] : null;
  if (!role) return res.status(404).json({ message: 'Unknown institutional account type' });
  req.institutionalRole = role;
  next();
};

const publicInstitutionalAccount = (u) => (u ? {
  id: u._id,
  name: u.name,
  username: u.username,
  email: u.email,
  phone: u.phone || null,
  role: u.role,
  module: INSTITUTIONAL_ROLE_MODULES[u.role],
  isActive: u.isActive,
  isFirstLogin: u.isFirstLogin,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
} : null);

// 12 chars, URL-safe, from a CSPRNG. Shown to the admin exactly once.
const generateTempPassword = () => crypto.randomBytes(9).toString('base64').replace(/\+/g, 'A').replace(/\//g, 'b');

// Validates the editable fields. Returns { error } or { value } (only fields present).
const validateInstitutionalFields = (body, { requireAll }) => {
  const out = {};
  const b = body && typeof body === 'object' ? body : {};
  if (requireAll || b.name !== undefined) {
    if (typeof b.name !== 'string' || b.name.trim().length < 2 || b.name.trim().length > 120) return { error: 'Name is required (2-120 characters)' };
    out.name = b.name.trim();
  }
  if (requireAll || b.email !== undefined) {
    if (typeof b.email !== 'string' || !EMAIL_RE.test(b.email.trim()) || b.email.trim().length > 254) return { error: 'A valid email is required' };
    out.email = b.email.trim().toLowerCase();
  }
  if (b.phone !== undefined && b.phone !== null && b.phone !== '') {
    if (typeof b.phone !== 'string' || !/^[0-9]{10}$/.test(b.phone.trim())) return { error: 'Phone must be exactly 10 digits' };
    out.phone = b.phone.trim();
  } else if (b.phone === '' || b.phone === null) {
    out.phone = null;
  }
  return { value: out };
};

router.get('/institutional-accounts', adminOnly, async (req, res) => {
  try {
    const result = {};
    for (const [type, role] of Object.entries(INSTITUTIONAL_TYPES)) {
      const u = await User.findOne({ role }).select('-password -otp -otpExpiry');
      result[type] = publicInstitutionalAccount(u);
    }
    res.json(result);
  } catch (err) { console.error('[GET /admin/institutional-accounts]', err); res.status(500).json({ message: 'Server error' }); }
});

router.post('/institutional-accounts/:type', adminOnly, resolveInstitutionalRole, async (req, res) => {
  try {
    const { error, value } = validateInstitutionalFields(req.body, { requireAll: true });
    if (error) return res.status(400).json({ message: error });

    if (await User.findOne({ role: req.institutionalRole })) {
      return res.status(409).json({ message: 'An account for this role already exists. Edit or reactivate it instead.' });
    }
    if (await User.findOne({ email: value.email })) return res.status(409).json({ message: 'Email already exists' });

    const baseUsername = value.email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase() || req.params.type;
    let username = baseUsername;
    let counter = 1;
    while (await User.findOne({ username })) username = `${baseUsername}${counter++}`;

    const tempPassword = generateTempPassword();
    let user;
    try {
      user = await User.create({
        name: value.name,
        username,
        email: value.email,
        phone: value.phone || null,
        password: await bcrypt.hash(tempPassword, 12),
        role: req.institutionalRole,       // from URL, never from the body
        modulePermissions: [],             // no cross-module grants
        isFirstLogin: true,
        isActive: true,
      });
    } catch (e) {
      if (e && e.code === 11000) return res.status(409).json({ message: 'An account with these details already exists' });
      throw e;
    }
    res.status(201).json({ message: 'Account created', account: publicInstitutionalAccount(user), temporaryPassword: tempPassword });
  } catch (err) { console.error('[POST /admin/institutional-accounts]', err); res.status(500).json({ message: 'Server error' }); }
});

router.patch('/institutional-accounts/:type', adminOnly, resolveInstitutionalRole, async (req, res) => {
  try {
    const { error, value } = validateInstitutionalFields(req.body, { requireAll: false });
    if (error) return res.status(400).json({ message: error });
    if (Object.keys(value).length === 0) return res.status(400).json({ message: 'No editable fields supplied' });

    const existing = await User.findOne({ role: req.institutionalRole }).select('_id');
    if (!existing) return res.status(404).json({ message: 'Account not found' });
    if (value.email) {
      const clash = await User.findOne({ email: value.email });
      if (clash && String(clash._id) !== String(existing._id)) return res.status(409).json({ message: 'Email already exists' });
    }
    // Only whitelisted fields are $set; role/isActive/password/modulePermissions can never change here.
    let updated;
    try {
      updated = await User.findByIdAndUpdate(existing._id, { $set: value }, { new: true, runValidators: true }).select('-password -otp -otpExpiry');
    } catch (e) {
      if (e && e.code === 11000) return res.status(409).json({ message: 'Email already exists' });
      throw e;
    }
    res.json({ message: 'Account updated', account: publicInstitutionalAccount(updated) });
  } catch (err) { console.error('[PATCH /admin/institutional-accounts]', err); res.status(500).json({ message: 'Server error' }); }
});

const setInstitutionalActive = (isActive) => async (req, res) => {
  try {
    const existing = await User.findOne({ role: req.institutionalRole }).select('_id');
    if (!existing) return res.status(404).json({ message: 'Account not found' });
    const updated = await User.findByIdAndUpdate(existing._id, { $set: { isActive } }, { new: true }).select('-password -otp -otpExpiry');
    res.json({ message: `Account ${isActive ? 'reactivated' : 'deactivated'}`, account: publicInstitutionalAccount(updated) });
  } catch (err) { console.error('[PATCH /admin/institutional-accounts status]', err); res.status(500).json({ message: 'Server error' }); }
};
router.patch('/institutional-accounts/:type/deactivate', adminOnly, resolveInstitutionalRole, setInstitutionalActive(false));
router.patch('/institutional-accounts/:type/reactivate', adminOnly, resolveInstitutionalRole, setInstitutionalActive(true));

router.post('/institutional-accounts/:type/reset-password', adminOnly, resolveInstitutionalRole, async (req, res) => {
  try {
    const existing = await User.findOne({ role: req.institutionalRole }).select('_id');
    if (!existing) return res.status(404).json({ message: 'Account not found' });
    const tempPassword = generateTempPassword();
    await User.findByIdAndUpdate(existing._id, { $set: { password: await bcrypt.hash(tempPassword, 12), isFirstLogin: true } });
    res.json({ message: 'Temporary password generated. Share it securely; it is not shown again.', temporaryPassword: tempPassword });
  } catch (err) { console.error('[POST /admin/institutional-accounts reset]', err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
