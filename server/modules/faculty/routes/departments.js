const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Department = require('../models/Department');
const User = require('../../../auth/models/User.model');
const Faculty = require('../models/Faculty');
const StudentProfile = require('../../student/models/StudentProfile');
const { auth, adminOrVc, denyInstitutionalRoles } = require('../middleware/auth');

const router = express.Router();
router.use(auth, denyInstitutionalRoles);

// HOD accounts are an independent institutional role (see auth/constants/roles.js):
// they get a User account with role 'hod' and are linked to their department via
// Department.hod. They never get a Faculty profile — faculty listings, counts and
// analytics are driven off the Faculty collection, so an HOD that has no Faculty
// document is automatically excluded from all of those.
const DEFAULT_HOD_PASSWORD = 'password123';

function deriveUsernameBase(email) {
  return email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
}

async function uniqueUsername(email, session) {
  const baseUsername = deriveUsernameBase(email);
  let username = baseUsername;
  let counter = 1;
  while (await User.findOne({ username }).session(session || null)) {
    username = `${baseUsername}${counter++}`;
  }
  return username;
}

function generateTempPassword() {
  // Random, not guessable — distinct from the legacy fixed default so a
  // reassignment/new HOD never silently reuses a previously-known password.
  return `Hod-${crypto.randomBytes(6).toString('hex')}`;
}

// Runs `work(session)` inside a Mongo transaction when the deployment supports
// one (replica set / mongos). Standalone MongoDB deployments (e.g. the existing
// Kannur University deployment) don't support transactions, so we fall back to
// running `work(null)` directly and rely on `compensate()` to undo any partial
// writes if it throws. This keeps department creation/deletion safe either way.
async function withTransactionOrRollback(work, compensate) {
  let session;
  try {
    session = await mongoose.startSession();
  } catch (_) {
    session = null;
  }

  if (session) {
    try {
      let result;
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } catch (err) {
      // If the cluster rejected the transaction itself (standalone server),
      // retry without one and fall back to manual compensation.
      const unsupported = /Transaction numbers are only allowed|IllegalOperation/i.test(err.message || '');
      if (!unsupported) throw err;
    } finally {
      session.endSession();
    }
  }

  try {
    return await work(null);
  } catch (err) {
    if (compensate) await compensate().catch(() => {});
    throw err;
  }
}

// Creates the HOD User account (role 'hod', no Faculty profile) for `department`.
// Returns { hodUser, tempPassword }.
async function createHodAccount({ email, fullName, department, session }) {
  const username = await uniqueUsername(email, session);
  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  const [hodUser] = await User.create(
    [{
      name: fullName || username,
      username,
      email,
      password: hashedPassword,
      role: 'hod',
      department,
      isFirstLogin: true,
    }],
    session ? { session } : undefined
  );

  return { hodUser, tempPassword };
}

// GET /api/departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('hod', 'username email name')
      .sort({ name: 1 });

    const deptNames = departments.map(d => d.name);

    // Count faculty profiles. HOD accounts never get a Faculty profile, so
    // this naturally never counts them even for legacy data.
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
// Only role 'faculty' is returned — HOD is a separate institutional role and
// must never appear in a faculty listing or faculty count.
router.get('/:name/faculty', async (req, res) => {
  try {
    const profiles = await Faculty.find({ 'employmentDetails.department': req.params.name })
      .select('userId username personalInfo.fullName personalInfo.designation personalInfo.photoUrl employmentDetails.designation employmentDetails.department profileComplete completionPercentage');

    const userIds = profiles.map(p => p.userId);
    const users = await User.find({ _id: { $in: userIds }, role: 'faculty' }).select('-password').sort({ createdAt: -1 });

    const profileMap = {};
    profiles.forEach(p => { profileMap[p.userId.toString()] = p; });
    res.json(users.map(u => ({ ...u.toObject(), profile: profileMap[u._id.toString()] || null })));
  } catch (err) {
    console.error('Error fetching faculty by department:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/departments
// Creates a department and its HOD account as one logical operation. The HOD
// is never given a Faculty profile.
router.post('/', adminOrVc, async (req, res) => {
  try {
    const { name, hodEmail, hodFullName } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Department name is required' });
    }
    if (typeof hodEmail !== 'string' || !hodEmail.trim()) {
      return res.status(400).json({ message: 'HOD email is required' });
    }
    const email = hodEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'A valid HOD email is required' });
    }
    if (hodFullName !== undefined && hodFullName !== null && typeof hodFullName !== 'string') {
      return res.status(400).json({ message: 'HOD full name must be text' });
    }

    const deptName = name.trim();
    const fullName = hodFullName ? hodFullName.trim() : '';

    const existingDept = await Department.findOne({ name: deptName });
    if (existingDept) {
      return res.status(409).json({ message: 'Department already exists' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    let created;
    try {
      created = await withTransactionOrRollback(
        async (session) => {
          const { hodUser, tempPassword } = await createHodAccount({
            email, fullName, department: deptName, session,
          });

          const [department] = await Department.create(
            [{ name: deptName, hod: hodUser._id, createdBy: req.user._id }],
            session ? { session } : undefined
          );

          return { hodUser, tempPassword, department };
        },
        // Compensation for the no-session fallback path: undo the HOD account
        // if the department write failed, so we never leave an orphaned HOD.
        async () => {
          await User.deleteOne({ email, role: 'hod' });
        }
      );
    } catch (creationError) {
      console.error(creationError);
      return res.status(500).json({ message: 'Failed to create department' });
    }

    const { hodUser, tempPassword, department } = created;
    const response = {
      message: 'Department and HOD account created successfully',
      department,
      hodUser: { id: hodUser._id, username: hodUser.username, email: hodUser.email },
    };
    // Never expose a usable plaintext password in a production response —
    // the HOD must be handed their credentials through a secure, out-of-band
    // channel (e.g. a password-reset invite) rather than this API response.
    if (process.env.NODE_ENV !== 'production') {
      response.initialPassword = tempPassword;
    } else {
      response.credentialsDelivery = 'An initial password was generated and must be delivered to the HOD through a secure channel.';
    }

    res.status(201).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/departments/:id/hod
// Reassigns a department's HOD, either to a brand-new HOD account (hodEmail +
// optional hodFullName) or to an existing, currently-unassigned HOD account
// (hodUserId). The previous HOD's account is never deleted here — only their
// access to this department is revoked (their department link is cleared), so
// an account that may still be wired up elsewhere is never destroyed by a
// reassignment.
router.put('/:id/hod', adminOrVc, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    const { hodUserId, hodEmail, hodFullName } = req.body;
    if (!hodUserId && !hodEmail) {
      return res.status(400).json({ message: 'Provide either hodUserId (existing HOD account) or hodEmail (new HOD account)' });
    }

    const previousHodId = department.hod;

    let result;
    try {
      result = await withTransactionOrRollback(
        async (session) => {
          let newHodUser;
          let tempPassword = null;

          if (hodUserId) {
            newHodUser = await User.findOne({ _id: hodUserId, role: 'hod' }).session(session || null);
            if (!newHodUser) {
              const err = new Error('HOD account not found');
              err.status = 404;
              throw err;
            }
            const assignedElsewhere = await Department.findOne({
              hod: newHodUser._id, _id: { $ne: department._id },
            }).session(session || null);
            if (assignedElsewhere) {
              const err = new Error('That HOD account is already assigned to another department');
              err.status = 409;
              throw err;
            }
            newHodUser.department = department.name;
            await newHodUser.save(session ? { session } : undefined);
          } else {
            if (typeof hodEmail !== 'string' || !hodEmail.trim()) {
              const err = new Error('HOD email is required');
              err.status = 400;
              throw err;
            }
            const email = hodEmail.trim().toLowerCase();
            if (!/^\S+@\S+\.\S+$/.test(email)) {
              const err = new Error('A valid HOD email is required');
              err.status = 400;
              throw err;
            }
            const existingUser = await User.findOne({ email }).session(session || null);
            if (existingUser) {
              const err = new Error('User with this email already exists');
              err.status = 409;
              throw err;
            }
            const created = await createHodAccount({
              email, fullName: hodFullName ? hodFullName.trim() : '', department: department.name, session,
            });
            newHodUser = created.hodUser;
            tempPassword = created.tempPassword;
          }

          department.hod = newHodUser._id;
          await department.save(session ? { session } : undefined);

          // Revoke the previous HOD's access to this department without
          // deleting their account — they may still be a valid HOD account
          // intended for reassignment elsewhere.
          if (previousHodId && String(previousHodId) !== String(newHodUser._id)) {
            await User.updateOne(
              { _id: previousHodId, role: 'hod' },
              { $set: { department: null } },
              session ? { session } : undefined
            );
          }

          return { department, newHodUser, tempPassword };
        },
        async () => {
          // Only relevant for the brand-new-account branch; if department
          // save failed after creating a fresh HOD user, remove it.
          if (hodEmail && !hodUserId) {
            await User.deleteOne({ email: hodEmail.trim().toLowerCase(), role: 'hod' });
          }
        }
      );
    } catch (err) {
      if (err.status) return res.status(err.status).json({ message: err.message });
      console.error(err);
      return res.status(500).json({ message: 'Failed to reassign HOD' });
    }

    const response = {
      message: 'HOD reassigned successfully',
      department: result.department,
      hodUser: { id: result.newHodUser._id, username: result.newHodUser.username, email: result.newHodUser.email },
    };
    if (result.tempPassword) {
      if (process.env.NODE_ENV !== 'production') {
        response.initialPassword = result.tempPassword;
      } else {
        response.credentialsDelivery = 'An initial password was generated and must be delivered to the HOD through a secure channel.';
      }
    }
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/departments/:id
router.delete('/:id', adminOrVc, async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });

    // Refuse to delete a department that's still in use by faculty — this
    // would orphan their employmentDetails.department(Id) reference. Match
    // both the stable id and the legacy name string, since not every
    // existing profile has been re-saved with a departmentId yet.
    const facultyInUse = await Faculty.countDocuments({
      $or: [
        { 'employmentDetails.departmentId': dept._id },
        { 'employmentDetails.department': dept.name },
      ],
    });
    if (facultyInUse > 0) {
      return res.status(409).json({
        message: `Cannot delete "${dept.name}" — ${facultyInUse} faculty member(s) are still assigned to it. Reassign or archive them to a different department first.`,
        facultyInUse,
      });
    }

    let hodAccountDeleted = false;

    try {
      await withTransactionOrRollback(async (session) => {
        if (dept.hod) {
          // Safe to delete the HOD account only if it isn't referenced by
          // any other department and carries no Faculty profile (a Faculty
          // profile would mean it's not a "pure" HOD-only account, e.g. a
          // legacy account promoted through a different flow).
          const referencedElsewhere = await Department.countDocuments({
            hod: dept.hod, _id: { $ne: dept._id },
          }).session(session || null);
          const legacyFacultyProfile = await Faculty.findOne({ userId: dept.hod }).session(session || null);

          if (referencedElsewhere === 0 && !legacyFacultyProfile) {
            await User.deleteOne({ _id: dept.hod, role: 'hod' }, session ? { session } : undefined);
            hodAccountDeleted = true;
          }
        }
        await Department.deleteOne({ _id: dept._id }, session ? { session } : undefined);
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Failed to delete department' });
    }

    res.json({
      message: hodAccountDeleted
        ? 'Department deleted. The associated HOD account was also deleted.'
        : 'Department deleted. The HOD account was retained (still referenced elsewhere or not safe to remove).',
      hodAccountDeleted,
    });
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
    // Only role 'faculty' — HOD is reported separately below via department.hod.
    const users = await User.find({ _id: { $in: userIds }, role: 'faculty' });
    const students = await StudentProfile.countDocuments({ 'academic_details.department': departmentName });

    let totalPublications = 0;
    let totalProjects = 0;

    const facultyMembers = profiles
      .filter(p => users.some(u => u._id.toString() === p.userId.toString()))
      .map(p => {
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
      hod: department.hod ? {
        id: department.hod._id,
        name: department.hod.name,
        username: department.hod.username,
        email: department.hod.email,
      } : null,
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
