const express = require('express');
const Faculty = require('../models/Faculty');
const OptionRequest = require('../models/OptionRequest');
const { auth, facultyOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

function calcCompletion(f) {
  let score = 0;
  const max = 10;
  const pi = f.personalInfo || {};
  if (pi.firstName || pi.fullName) score++;
  if (pi.dateOfBirth && pi.gender) score++;
  if (f.qualifications?.length > 0) score++;
  if (f.employmentDetails?.designation) score++;
  if (f.workExperience?.length > 0) score++;
  if (f.publications?.length > 0) score++;
  if (f.projects?.length > 0) score++;
  if (f.awards?.length > 0) score++;
  if (f.memberships?.length > 0) score++;
  if (f.researchGuidance?.phdCompleted || f.researchGuidance?.phdInProgress) score++;
  return Math.round((score / max) * 100);
}

// GET /api/faculty/me
router.get('/', facultyOnly, async (req, res) => {
  try {
    let faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) faculty = await Faculty.create({ userId: req.user._id, username: req.user.username });
    res.json(faculty);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/faculty/me
router.put('/', facultyOnly, async (req, res) => {
  try {
    const allowed = [
      'personalInfo', 'qualifications', 'eligibilityTests', 'employmentDetails',
      'workExperience', 'publications', 'awards', 'projects', 'patents',
      'researchGuidance', 'adminResponsibilities', 'fdpWorkshops', 'memberships',
      'onlineCourses', 'internationalExperience', 'adminNonAcademicResponsibilities',
      'academicAdministration', 'qualityAssurance', 'researchAndInnovation',
      'examinationAndEvaluation', 'administrativeSupport', 'departmentalCharges',
      'specialAssignments', 'extraInstitutionalActivities', 'documents',
    ];
    const updateData = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

    if (updateData.personalInfo?.fullName && typeof updateData.personalInfo.fullName === 'string') {
      updateData.personalInfo.fullName = updateData.personalInfo.fullName.replace(/^temp--/i, '').trim();
    }

    let faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) faculty = new Faculty({ userId: req.user._id, username: req.user.username });

    Object.assign(faculty, updateData);
    faculty.completionPercentage = calcCompletion(faculty);
    faculty.profileComplete = faculty.completionPercentage >= 20;
    await faculty.save();
    res.json(faculty);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// PATCH /api/faculty/me/visibility
router.patch('/visibility', facultyOnly, async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) return res.status(404).json({ message: 'Profile not found' });
    const allowed = Object.keys(faculty.visibility.toObject());
    allowed.forEach(key => { if (req.body[key] !== undefined) faculty.visibility[key] = req.body[key]; });
    await faculty.save();
    res.json({ message: 'Visibility updated', visibility: faculty.visibility });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});


// POST /api/faculty/requests
router.post('/requests', facultyOnly, async (req, res) => {
  try {
    const { dropdownKey, requestedValue, previousValue } = req.body;
    if (!dropdownKey || !requestedValue) return res.status(400).json({ message: 'Missing required fields' });
    
    // Create new request
    const newRequest = await OptionRequest.create({
      user: req.user._id,
      dropdownKey,
      requestedValue,
      previousValue: previousValue || ''
    });
    
    res.status(201).json(newRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/faculty/requests
router.get('/requests', facultyOnly, async (req, res) => {
  try {
    const requests = await OptionRequest.find({ user: req.user._id, dismissed: false }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/faculty/requests/:id/dismiss
router.patch('/requests/:id/dismiss', facultyOnly, async (req, res) => {
  try {
    const request = await OptionRequest.findOne({ _id: req.params.id, user: req.user._id });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    request.dismissed = true;
    await request.save();
    res.json({ message: 'Dismissed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


