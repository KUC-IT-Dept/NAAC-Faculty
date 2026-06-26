const express = require('express');
const User = require('../../../auth/models/User.model');
const Faculty = require('../models/Faculty');
const XLSX = require('xlsx');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// GET /api/faculty/directory
router.get('/', async (req, res) => {
  const { role, department } = req.user;
  if (role === 'faculty') return res.status(403).json({ message: 'Access denied.' });
  try {
    let filter = { role: { $ne: 'student' } };
    if (role === 'hod') {
      filter.department = department;
    }
    const users = await User.find(filter).select('-password').lean();
    return res.status(200).json(users);
  } catch (err) {
    console.error('[GET /directory]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/faculty/directory/tree
router.get('/tree', async (req, res) => {
  const { role, _id: userId, department } = req.user;
  if (role === 'faculty') return res.status(403).json({ message: 'Access denied.' });
  try {
    if (role === 'hod') {
      const self = await User.findById(userId).select('-password').lean();
      const teachers = await User.find({ role: 'faculty', department }).select('-password').lean();
      return res.status(200).json({ root: self, branches: [{ ...self, leaves: teachers }] });
    }
    const allHods = await User.find({ role: 'hod' }).select('-password').lean();
    const allTeachers = await User.find({ role: 'faculty' }).select('-password').lean();
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
    console.error('[GET /directory/tree]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/faculty/directory/export
router.get('/export', async (req, res) => {
  const { role, department } = req.user;
  if (role === 'faculty') return res.status(403).json({ message: 'Access denied.' });
  try {
    const { ids, columns = 'name,email,department,role', format = 'csv' } = req.query;
    const columnList = columns.split(',').map((c) => c.trim());
    let userFilter = { role: { $ne: 'student' } };
    if (role === 'hod') userFilter.department = department;
    if (ids) {
      const idArray = ids.split(',').map((i) => i.trim());
      userFilter._id = { $in: idArray };
    }
    const users = await User.find(userFilter).select('-password').lean();
    const profileCols = ['publications', 'subjects', 'projects', 'qualifications', 'customDetails', 'bio'];
    const needsProfile = columnList.some((c) => profileCols.includes(c));
    let profileMap = {};
    if (needsProfile) {
      const userIds = users.map((u) => u._id);
      const profiles = await Faculty.find({ userId: { $in: userIds } }).lean();
      profiles.forEach((p) => {
        profileMap[p.userId.toString()] = p;
      });
    }
    const rows = users.map((u) => {
      const profileData = profileMap[u._id.toString()] || {};
      const row = {};
      if (columnList.includes('name')) row['Name'] = u.name;
      if (columnList.includes('email')) row['Email'] = u.email;
      if (columnList.includes('department')) row['Department'] = u.department || '';
      if (columnList.includes('role')) row['Role'] = u.role;
      if (columnList.includes('bio')) row['Bio'] = profileData.personalInfo?.biography || '';
      if (columnList.includes('subjects')) row['Subjects'] = profileData.personalInfo?.subjects || '';
      if (columnList.includes('qualifications'))
        row['Qualifications'] = (profileData.qualifications || []).map((q) => `${q.degreeName} — ${q.institution}${q.yearOfPassing ? ` (${q.yearOfPassing})` : ''}`).join('; ');
      if (columnList.includes('publications'))
        row['Publications'] = (profileData.publications || []).map((p) => p.title).join('; ');
      if (columnList.includes('projects'))
        row['Research Projects'] = (profileData.projects || []).map((p) => p.title).join('; ');
      if (columnList.includes('customDetails'))
        row['Custom Sections'] = (profileData.extraInstitutionalActivities || []).map((c) => `[${c.title}] ${c.description}`).join(' | ');
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
    if (rows.length === 0) return res.status(200).send('');
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => `"${(r[h] || '').replace(/"/g, '""')}"`).join(',')),
    ];
    res.setHeader('Content-Disposition', 'attachment; filename="faculty_export.csv"');
    res.setHeader('Content-Type', 'text/csv');
    return res.send(csvRows.join('\n'));
  } catch (err) {
    console.error('[GET /directory/export]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
