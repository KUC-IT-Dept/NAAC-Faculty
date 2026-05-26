const User = require('../../../../auth/models/User.model');
const Profile = require('../models/Profile');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');

/**
 * GET /api/directory
 * Returns flat user list scoped by role:
 *   TEACHER  → 403
 *   HOD      → only their department
 *   VC / SUPERADMIN → all users
 */
const getDirectory = async (req, res) => {
  const { role, department } = req.user;

  if (role === 'TEACHER') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  try {
    let filter = {};
    if (role === 'HOD') {
      filter = { department };
    }

    const users = await User.find(filter).select('-password').lean();
    return res.status(200).json(users);
  } catch (err) {
    console.error('[directoryController.getDirectory]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * GET /api/directory/tree
 * Returns pre-aggregated nested JSON for React Flow.
 * Frontend maps this directly → no client-side relational parsing.
 *
 * Shape:
 * {
 *   root: { id, name, role, department },
 *   branches: [{ id, name, role, department, leaves: [{ id, name, role, department }] }]
 * }
 *
 * Scope:
 *   HOD       → root=self, leaves=teachers in dept
 *   VC        → root=self, branches=HODs, leaves=Teachers per HOD dept
 *   SUPERADMIN→ root=self, branches=HODs, leaves=Teachers per HOD dept (all depts)
 */
const getDirectoryTree = async (req, res) => {
  const { role, id: userId, department } = req.user;

  if (role === 'TEACHER') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  try {
    if (role === 'HOD') {
      const self = await User.findById(userId).select('-password').lean();
      const teachers = await User.find({ role: 'TEACHER', department }).select('-password').lean();
      return res.status(200).json({
        root: self,
        branches: [
          {
            ...self,
            leaves: teachers,
          },
        ],
      });
    }

    // VC or SUPERADMIN: full tree across all HODs
    const allHods = await User.find({ role: 'HOD' }).select('-password').lean();
    const allTeachers = await User.find({ role: 'TEACHER' }).select('-password').lean();

    // Group teachers by department
    const teachersByDept = allTeachers.reduce((acc, t) => {
      const dept = t.department || 'Unassigned';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(t);
      return acc;
    }, {});

    const self = await User.findById(userId).select('-password').lean();

    const branches = allHods.map((hod) => ({
      ...hod,
      leaves: teachersByDept[hod.department] || [],
    }));

    return res.status(200).json({ root: self, branches });
  } catch (err) {
    console.error('[directoryController.getDirectoryTree]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * GET /api/directory/export
 * Query params:
 *   ids     = comma-separated user IDs (optional; all if omitted)
 *   columns = comma-separated column keys: name,email,department,role,publications,subjects
 *   format  = 'csv' | 'excel'  (default: csv)
 */
const exportDirectory = async (req, res) => {
  const { role, department } = req.user;

  if (role === 'TEACHER') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  try {
    const { ids, columns = 'name,email,department,role', format = 'csv' } = req.query;
    const columnList = columns.split(',').map((c) => c.trim());

    // Build user query (scoped)
    let userFilter = {};
    if (role === 'HOD') userFilter.department = department;
    if (ids) {
      const idArray = ids.split(',').map((i) => i.trim());
      userFilter._id = { $in: idArray };
    }

    const users = await User.find(userFilter).select('-password').lean();

    // If profile fields are requested, fetch profiles
    const profileCols = ['publications', 'subjects', 'projects', 'qualifications', 'customDetails', 'bio'];
    const needsProfile = columnList.some((c) => profileCols.includes(c));
    let profileMap = {};
    if (needsProfile) {
      const userIds = users.map((u) => u._id);
      const profiles = await Profile.find({ user: { $in: userIds } }).lean();
      profiles.forEach((p) => {
        profileMap[p.user.toString()] = p;
      });
    }

    // Build rows
    const rows = users.map((u) => {
      const profileData = profileMap[u._id.toString()] || {};
      const row = {};
      if (columnList.includes('name')) row['Name'] = u.name;
      if (columnList.includes('email')) row['Email'] = u.email;
      if (columnList.includes('department')) row['Department'] = u.department || '';
      if (columnList.includes('role')) row['Role'] = u.role;
      if (columnList.includes('bio')) row['Bio'] = profileData.bio || '';
      if (columnList.includes('subjects'))
        row['Subjects'] = (profileData.subjects || []).join('; ');
      if (columnList.includes('qualifications'))
        row['Qualifications'] = (profileData.qualifications || [])
          .map((q) => `${q.degree} — ${q.institution}${q.year ? ` (${q.year})` : ''}`).join('; ');
      if (columnList.includes('publications'))
        row['Publications'] = (profileData.publications || [])
          .map((p) => p.title).join('; ');
      if (columnList.includes('projects'))
        row['Research Projects'] = (profileData.projects || [])
          .map((p) => p.title).join('; ');
      if (columnList.includes('customDetails'))
        row['Custom Sections'] = (profileData.customDetails || [])
          .map((c) => `[${c.sectionTitle}] ${c.content}`).join(' | ');
      return row;
    });

    if (format === 'excel') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Faculty');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', 'attachment; filename="faculty_export.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buf);
    }

    // Default: CSV
    if (rows.length === 0) {
      return res.status(200).send('');
    }
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(','),
      ...rows.map((r) =>
        headers.map((h) => `"${(r[h] || '').replace(/"/g, '""')}"`).join(',')
      ),
    ];
    res.setHeader('Content-Disposition', 'attachment; filename="faculty_export.csv"');
    res.setHeader('Content-Type', 'text/csv');
    return res.send(csvRows.join('\n'));
  } catch (err) {
    console.error('[directoryController.exportDirectory]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * POST /api/directory/faculty
 * HOD can add TEACHER to their own department only.
 * VC / SUPERADMIN can add any role to any department.
 * Body: { name, email, password, role, department }
 */
const addFaculty = async (req, res) => {
  const { role: callerRole, department: callerDept } = req.user;

  if (callerRole === 'TEACHER') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { name, email, password, role: newRole, department } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  // HOD restrictions: can only create TEACHER in their own department
  if (callerRole === 'HOD') {
    if (newRole && newRole !== 'TEACHER') {
      return res.status(403).json({ message: 'HOD can only add faculty with the TEACHER role.' });
    }
    if (department && department !== callerDept) {
      return res.status(403).json({ message: 'HOD can only add faculty to their own department.' });
    }
  }

  const finalRole = callerRole === 'HOD' ? 'TEACHER' : (newRole || 'TEACHER');
  const finalDept = callerRole === 'HOD' ? callerDept : (department || null);

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: `A user with email "${email}" already exists.` });
    }

    // Securely hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: finalRole,
      department: finalDept,
    });

    const userOut = newUser.toObject();
    delete userOut.password;

    return res.status(201).json({ message: 'Faculty member added successfully.', user: userOut });
  } catch (err) {
    console.error('[directoryController.addFaculty]', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * PUT /api/directory/swap-hod
 * VC / SUPERADMIN can swap a TEACHER to HOD, demoting the current HOD of that department to TEACHER.
 */
const swapHod = async (req, res) => {
  const { teacherId } = req.body;

  try {
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'TEACHER') {
      return res.status(400).json({ message: 'Target user not found or is not a TEACHER.' });
    }
    if (!teacher.department) {
      return res.status(400).json({ message: 'Target user must have an assigned department to become HOD.' });
    }

    // Find current HOD of that department
    const currentHod = await User.findOne({ role: 'HOD', department: teacher.department });
    
    // Demote current HOD if one exists
    if (currentHod) {
      currentHod.role = 'TEACHER';
      await currentHod.save();
    }

    // Promote the target
    teacher.role = 'HOD';
    await teacher.save();

    return res.status(200).json({ message: 'HOD swapped successfully.' });
  } catch (err) {
    console.error('[directoryController.swapHod]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getDirectory, getDirectoryTree, exportDirectory, addFaculty, swapHod };
