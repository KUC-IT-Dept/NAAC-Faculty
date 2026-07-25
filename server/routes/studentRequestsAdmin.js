const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Middlewares
const { auth, adminOnly } = require('../modules/faculty/middleware/auth');

// Models
const UnlockRequest = require('../modules/student/models/UnlockRequest');
const ProfileUpdateRequest = require('../modules/student/models/ProfileUpdateRequest');
const StudentDropdownRequest = require('../modules/student/models/StudentDropdownRequest');
const ForgotPasswordRequest = require('../modules/student/models/ForgotPasswordRequest');
const User = require('../auth/models/User.model');
const StudentProfile = require('../modules/student/models/StudentProfile');

// Controllers/Helpers
const { sanitizeProfileSection, stripUndefinedDeep } = require('../modules/student/utils/profileDataSanitizer');

// Apply admin auth check to all admin student request routes
router.use(auth, adminOnly);

// Self-healing mock requests seeder
const seedMockRequestsIfEmpty = async () => {
  try {
    const unlockCount = await UnlockRequest.countDocuments();
    const updateCount = await ProfileUpdateRequest.countDocuments();
    const dropdownCount = await StudentDropdownRequest.countDocuments();
    const forgotCount = await ForgotPasswordRequest.countDocuments();

    if (unlockCount === 0 && updateCount === 0 && dropdownCount === 0 && forgotCount === 0) {
      console.log('[SEED] Seeding mock student requests...');
      const students = await User.find({ role: 'student' }).limit(5);
      if (students.length === 0) {
        console.log('[SEED] No student users found to seed requests for.');
        return;
      }

      // Ensure student profiles exist for these students
      for (const s of students) {
        let profile = await StudentProfile.findOne({ userId: s._id });
        if (!profile) {
          await StudentProfile.create({
            userId: s._id,
            personal_details: { fullName: s.name, gender: 'Male', nationality: 'Indian' },
            academic_details: { programLevel: 'UG', degreeName: 'B.Tech', currentYear: '1', currentSemester: 1 }
          });
        }
      }

      // 1. Seed Unlock Requests
      await UnlockRequest.create([
        {
          studentId: students[0]._id,
          requestNo: 'UNLOCK-001',
          requestType: 'full_unlock',
          reason: 'Need to update several sections including academic and contact details for internship registration.',
          status: 'pending',
          formData: {
            personal: { fullName: students[0].name, gender: 'Male' },
            academic: { degreeName: 'B.Tech', programLevel: 'UG' }
          }
        },
        {
          studentId: students[1 % students.length]._id,
          requestNo: 'UNLOCK-002',
          requestType: 'field_correction',
          reason: 'Correcting spelling of father name in family details.',
          status: 'pending',
          correctionFields: [
            {
              section: 'family',
              field: 'fatherName',
              currentValue: 'Jhon Doe',
              requestedValue: 'John Doe'
            }
          ]
        }
      ]);

      // 2. Seed Profile Update Requests
      await ProfileUpdateRequest.create([
        {
          studentId: students[2 % students.length]._id,
          requestNo: 'UPDATE-001',
          status: 'pending',
          changes: {
            personal_details: {
              fullName: students[2 % students.length].name + ' (Updated)',
              gender: 'Female',
              nationality: 'Indian'
            },
            contact_details: {
              mobile: '9876543210',
              alternateMobile: '9999999999'
            }
          }
        }
      ]);

      // 3. Seed Dropdown Requests
      await StudentDropdownRequest.create([
        {
          studentId: students[3 % students.length]._id,
          requestNo: 'DROP-001',
          dropdownKey: 'admissionCategory',
          requestedValue: 'Sports Quota',
          status: 'pending'
        },
        {
          studentId: students[4 % students.length]._id,
          requestNo: 'DROP-002',
          dropdownKey: 'socialCategory',
          requestedValue: 'NT-B',
          status: 'pending'
        }
      ]);

      // 4. Seed Forgot Password Requests
      await ForgotPasswordRequest.create([
        {
          studentId: students[0]._id,
          requestNo: 'PWD-001',
          status: 'pending'
        },
        {
          studentId: students[1 % students.length]._id,
          requestNo: 'PWD-002',
          status: 'pending'
        }
      ]);
      console.log('✅ Mock student requests seeded successfully.');
    }
  } catch (err) {
    console.error('[SEED] Error seeding mock requests:', err);
  }
};

// Helper function to deep merge (like in profile controller)
const deepMerge = (target, source) => {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      if (!target[key]) Object.assign(target, { [key]: {} });
      deepMerge(target[key], source[key]);
    } else {
      Object.assign(target, { [key]: source[key] });
    }
  }
  return target;
};

// Sanitization payload mapping
const sanitizeProfilePayload = (payload) => {
  const result = {};
  for (const [sectionKey, data] of Object.entries(payload)) {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      result[sectionKey] = sanitizeProfileSection(sectionKey, data);
    }
  }
  return result;
};

// ==========================================
// 1. UNLOCK REQUESTS
// ==========================================

// GET /api/unlock-request/pending
router.get('/unlock-request/pending', async (req, res) => {
  try {
    await seedMockRequestsIfEmpty();
    const requests = await UnlockRequest.find({ status: 'pending' })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/unlock-request/:id
router.get('/unlock-request/:id', async (req, res) => {
  try {
    const request = await UnlockRequest.findById(req.params.id)
      .populate('studentId', 'name email');
    if (!request) return res.status(404).json({ message: 'Unlock request not found' });
    return res.json(request);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/unlock-request/:id/approve
router.post('/unlock-request/:id/approve', async (req, res) => {
  try {
    const request = await UnlockRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    const sectionMap = {
      personal: 'personal_details', academic: 'academic_details', contact: 'contact_details',
      family: 'family_details', education: 'education_details', financial: 'financial_details',
      health: 'health_details', professional: 'professional_details', residential: 'residential_details'
    };

    const profile = await StudentProfile.findOne({ userId: request.studentId });
    if (!profile) return res.status(404).json({ message: 'Student profile not found' });

    if (request.requestType === 'full_unlock') {
      Object.entries(request.formData || {}).forEach(([section, data]) => {
        const dbSection = sectionMap[section];
        if (!dbSection || !data) return;
        const cleanedData = sanitizeProfileSection(dbSection, data);
        if (Object.keys(cleanedData).length === 0) return;
        const existingSection = profile[dbSection]?.toObject?.() || profile[dbSection] || {};
        profile.set(dbSection, sanitizeProfileSection(dbSection, { ...stripUndefinedDeep(existingSection), ...cleanedData }));
      });
      await profile.save();
    } else if (request.requestType === 'field_correction') {
      const updateData = {};
      request.correctionFields.forEach((field) => {
        const section = sectionMap[field.section];
        const key = field.field;
        const value = field.requestedValue;
        if (!section || value === undefined) return;
        if (profile[section]) {
          profile[section][key] = stripUndefinedDeep(value);
          if (!updateData[section]) updateData[section] = {};
          updateData[section][key] = stripUndefinedDeep(value);
        }
      });
      Object.keys(updateData).forEach((section) => {
        profile.set(section, sanitizeProfileSection(section, profile[section]?.toObject?.() || profile[section] || {}));
      });
      await profile.save();
    }

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // Enable editing back for the student
    await User.findByIdAndUpdate(request.studentId, { canEdit: true });

    return res.json({ success: true, message: 'Unlock Request Approved Successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/unlock-request/:id/reject
router.post('/unlock-request/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await UnlockRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'rejected';
    request.remarks = reason || 'Incomplete supporting documents.';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // Enable editing back for student even on reject so they can try again
    await User.findByIdAndUpdate(request.studentId, { canEdit: true });

    return res.json({ success: true, message: 'Unlock Request Rejected Successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 2. PROFILE UPDATE REQUESTS
// ==========================================

// GET /api/profile-update-request/pending
router.get('/profile-update-request/pending', async (req, res) => {
  try {
    await seedMockRequestsIfEmpty();
    const requests = await ProfileUpdateRequest.find({ status: 'pending' })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/profile-update-request/:id
router.get('/profile-update-request/:id', async (req, res) => {
  try {
    const request = await ProfileUpdateRequest.findById(req.params.id)
      .populate('studentId', 'name email');
    if (!request) return res.status(404).json({ message: 'Profile update request not found' });
    
    // We also want to fetch the current profile for comparison
    const currentProfile = await StudentProfile.findOne({ userId: request.studentId });

    return res.json({
      request,
      currentProfile: currentProfile || null
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/profile-update-request/:id/approve
router.post('/profile-update-request/:id/approve', async (req, res) => {
  try {
    const request = await ProfileUpdateRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    const profile = await StudentProfile.findOne({ userId: request.studentId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const sanitizedChanges = sanitizeProfilePayload(request.changes || {});
    const mergedData = sanitizeProfilePayload(deepMerge(profile.toObject(), sanitizedChanges));
    delete mergedData._id;
    delete mergedData.__v;

    await StudentProfile.findOneAndUpdate({ userId: request.studentId }, mergedData, { new: true });
    
    request.status = 'approved';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    await request.save();

    return res.json({ success: true, message: 'Profile Update Approved Successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/profile-update-request/:id/reject
router.post('/profile-update-request/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await ProfileUpdateRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'rejected';
    request.remarks = reason || 'Rejection reason';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    return res.json({ success: true, message: 'Profile Update Rejected Successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 3. DROPDOWN REQUESTS
// ==========================================

// GET /api/dropdown-request/pending
router.get('/dropdown-request/pending', async (req, res) => {
  try {
    await seedMockRequestsIfEmpty();
    const requests = await StudentDropdownRequest.find({ status: 'pending' })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// PUT /api/dropdown-request/:id/approve
router.put('/dropdown-request/:id/approve', async (req, res) => {
  try {
    const { approvedValue } = req.body;
    if (!approvedValue) return res.status(400).json({ message: 'Approved value is required' });

    const request = await StudentDropdownRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'approved';
    request.approvedValue = approvedValue;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // Dynamically update the student's profile with the approved value
    const profile = await StudentProfile.findOne({ userId: request.studentId });
    if (profile) {
      const sectionMap = {
        admissionCategory: 'academic_details',
        socialCategory: 'personal_details',
        gender: 'personal_details',
        nationality: 'personal_details',
        disabilityType: 'health_details'
      };

      const section = sectionMap[request.dropdownKey];
      if (section && profile[section]) {
        if (request.dropdownKey === 'disabilityType') {
          if (!profile.health_details.disabilityDetails) profile.health_details.disabilityDetails = {};
          profile.health_details.disabilityDetails.disabilityType = approvedValue;
        } else {
          profile[section][request.dropdownKey] = approvedValue;
        }
        await profile.save();
      }
    }

    return res.json({ success: true, message: 'Dropdown Request Approved Successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// PUT /api/dropdown-request/:id/reject
router.put('/dropdown-request/:id/reject', async (req, res) => {
  try {
    const request = await StudentDropdownRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    return res.json({ success: true, message: 'Dropdown Request Rejected Successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 4. FORGOT PASSWORD REQUESTS
// ==========================================

// POST /api/forgot-password-request/pending
router.post('/forgot-password-request/pending', async (req, res) => {
  try {
    await seedMockRequestsIfEmpty();
    const requests = await ForgotPasswordRequest.find({ status: 'pending' })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// PUT /api/forgot-password-request/:id/reset
router.put('/forgot-password-request/:id/reset', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const request = await ForgotPasswordRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    const studentUser = await User.findById(request.studentId);
    if (!studentUser) return res.status(404).json({ message: 'Student user not found' });

    // Hash the password manually since User.model.js pre-save hook is not defined
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    studentUser.password = hashedPassword;
    await studentUser.save();

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    return res.json({ success: true, message: 'Password Reset Successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// PUT /api/forgot-password-request/:id/reject
router.put('/forgot-password-request/:id/reject', async (req, res) => {
  try {
    const request = await ForgotPasswordRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    return res.json({ success: true, message: 'Forgot Password Request Rejected Successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
