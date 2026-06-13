const express = require('express');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const OptionRequest = require('../models/OptionRequest');
const Department = require('../models/Department');
const { auth, hodOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth, hodOnly);

// Helper function to get HOD's department
const getHodDepartment = async (userId) => {
  const hodFaculty = await Faculty.findOne({ userId });
  if (!hodFaculty) return null;
  return hodFaculty.employmentDetails?.department || null;
};

// GET /api/hod/faculty
// Get faculty within the HOD's department
router.get('/faculty', async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return res.status(400).json({ message: 'HOD department not configured' });

    // Find all faculty in this department
    const profiles = await Faculty.find({ 'employmentDetails.department': dept })
      .select('userId username personalInfo.fullName personalInfo.designation personalInfo.photoUrl employmentDetails.designation employmentDetails.department profileComplete completionPercentage');
    
    const userIds = profiles.map(p => p.userId);
    const users = await User.find({ _id: { $in: userIds }, role: { $in: ['faculty', 'hod'] } }).select('-password').sort({ createdAt: -1 });

    const profileMap = {};
    profiles.forEach(p => { profileMap[p.userId.toString()] = p; });
    res.json(users.map(u => ({ ...u.toObject(), profile: profileMap[u._id.toString()] || null })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/hod/faculty
// Create a new faculty account within the HOD's department
router.post('/faculty', async (req, res) => {
  try {
    const { email, fullName } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const dept = await getHodDepartment(req.user._id);
    if (!dept) return res.status(400).json({ message: 'HOD department not configured' });

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
      employmentDetails: { department: dept }
    });

    res.status(201).json({
      message: `Faculty account created in ${dept}`,
      user: { id: user._id, username: user.username, email: user.email },
      defaultPassword: 'password123',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/hod/option-requests
// View pending requests from faculty in their department
router.get('/option-requests', async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return res.status(400).json({ message: 'HOD department not configured' });

    // Get all faculty in this department
    const profiles = await Faculty.find({ 'employmentDetails.department': dept }).select('userId');
    const userIds = profiles.map(p => p.userId);

    const requests = await OptionRequest.find({ user: { $in: userIds } })
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Note: Approve/Reject of OptionRequests can either reuse Admin routes or we can port them here.
// For now, let HOD approve their department's requests.
router.patch('/option-requests/:id/approve', async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return res.status(400).json({ message: 'HOD department not configured' });

    const request = await OptionRequest.findById(req.params.id).populate('user');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    // Verify the user is in HOD's department
    const faculty = await Faculty.findOne({ userId: request.user._id });
    if (!faculty || faculty.employmentDetails?.department !== dept) {
      return res.status(403).json({ message: 'Request does not belong to your department' });
    }

    if (request.status !== 'PENDING') return res.status(400).json({ message: 'Request is not pending' });

    request.status = 'APPROVED';
    if (req.body.adminMessage) request.adminMessage = req.body.adminMessage;
    await request.save();
    
    // NOTE: This doesn't add to DropdownConfig like Admin does, because HODs probably shouldn't mutate 
    // the global university dropdown list. Alternatively, we could allow it. 
    // To keep it simple, we just mark it APPROVED and the faculty keeps using it.
    
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/option-requests/:id/reject', async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return res.status(400).json({ message: 'HOD department not configured' });

    const request = await OptionRequest.findById(req.params.id).populate('user');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const faculty = await Faculty.findOne({ userId: request.user._id });
    if (!faculty || faculty.employmentDetails?.department !== dept) {
      return res.status(403).json({ message: 'Request does not belong to your department' });
    }

    if (request.status !== 'PENDING') return res.status(400).json({ message: 'Request is not pending' });

    request.status = 'REJECTED';
    if (req.body.adminMessage) request.adminMessage = req.body.adminMessage;
    await request.save();

    // Revert logic (similar to admin)
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


module.exports = router;
