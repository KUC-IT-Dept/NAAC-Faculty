// modules/events/routes/facultyEvents.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { auth } = require('../../faculty/middleware/auth');
const { Booking } = require('../models/Booking');
const EventReport = require('../models/EventReport');
const EventAuditLog = require('../models/EventAuditLog');
const { notify } = require('../services/notificationService');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../../student/configs/cloudinary');

const router = express.Router();
router.use(auth);

// Only faculty/hod accounts are assigned events (an HOD can also be lead/support faculty).
const facultyOrHod = (req, res, next) => {
  if (!['faculty', 'hod'].includes(req.user.role)) return res.status(403).json({ message: 'Faculty access required' });
  next();
};
router.use(facultyOrHod);

function isLead(booking, userId) {
  return booking.leadFaculty.toString() === userId.toString();
}
function isAssigned(booking, userId) {
  return isLead(booking, userId) || booking.supportingFaculty.some((s) => s.toString() === userId.toString());
}

// ── Evidence upload (reuses the existing Cloudinary pattern from faculty upload.js) ──
const evidenceStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'event_evidence',
    resource_type: 'auto',
    type: 'authenticated',
    public_id: (req, file) => {
      const bookingId = req.params.bookingId || 'unassigned';
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const base = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '');
      return `${bookingId}/${req.user._id}/${base}-${unique}`;
    },
  },
});
const evidenceUpload = multer({ storage: evidenceStorage, limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/events/faculty/home — dashboard summary (Part 5.2)
router.get('/home', async (req, res) => {
  try {
    const uid = req.user._id;
    const assigned = await Booking.find({
      $or: [{ leadFaculty: uid }, { supportingFaculty: uid }],
      status: { $ne: 'cancelled' },
    }).populate('venue', 'name').sort({ date: 1 });

    const now = new Date();
    const bucket = {
      upcoming: [], inProgress: [], reportPending: [], overdue: [],
      submitted: [], underReview: [], correctionRequested: [],
    };
    for (const b of assigned) {
      if (b.startTime > now) bucket.upcoming.push(b);
      else if (b.endTime > now) bucket.inProgress.push(b);
      else if (['overdue'].includes(b.eventStatus)) bucket.overdue.push(b);
      else if (['event_completed', 'report_pending'].includes(b.eventStatus)) bucket.reportPending.push(b);
      else if (b.eventStatus === 'submitted') bucket.submitted.push(b);
      else if (b.eventStatus === 'under_review') bucket.underReview.push(b);
      else if (b.eventStatus === 'correction_required') bucket.correctionRequested.push(b);
    }
    res.json(bucket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/events/faculty/:bookingId — one assigned event, with current report (prefilled)
router.get('/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate('venue');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!isAssigned(booking, req.user._id)) return res.status(403).json({ message: 'Not assigned to this event' });

    let report = await EventReport.findOne({ booking: booking._id, isCurrent: true });
    if (!report) {
      // Prefill from booking (Part 5.4) — created lazily on first open.
      const venueLabel = booking.venue?.isCustom
        ? `Others: ${booking.customVenueName} Rm ${booking.customRoomNumber}`
        : booking.venue?.name;
      report = await EventReport.create({
        booking: booking._id,
        version: 1,
        nameOfProgram: booking.programName,
        conductingDepartment: booking.conductingDepartment,
        personInCharge: '',
        programVenue: venueLabel,
        targetGroupBeneficiaries: booking.targetGroups,
        dateFrom: booking.startTime,
        dateTo: booking.endTime,
        expectedStrength: booking.expectedStrength,
        objectives: booking.objectives,
        resourcePerson: booking.resourcePerson,
      });
    }
    res.json({ booking, report, isLead: isLead(booking, req.user._id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/events/faculty/:bookingId/report — save draft (lead or supporting, if permitted)
router.put('/:bookingId/report', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!isAssigned(booking, req.user._id)) return res.status(403).json({ message: 'Not assigned to this event' });

    const report = await EventReport.findOne({ booking: booking._id, isCurrent: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (!report.isDraft) return res.status(409).json({ message: 'Report already submitted; request a correction to edit it' });

    const editable = [
      'personInCharge', 'targetGroupBeneficiaries', 'dateFrom', 'dateTo', 'expectedStrength',
      'objectives', 'resourcePerson', 'numberOfParticipants', 'briefEventReport', 'feedbackText',
      'nameOfProgram', 'conductingDepartment', 'programVenue',
    ];
    const prefillFields = new Set(['nameOfProgram', 'conductingDepartment', 'programVenue', 'dateFrom', 'dateTo', 'expectedStrength', 'objectives', 'resourcePerson']);
    for (const key of editable) {
      if (key in req.body && req.body[key] !== report[key]) {
        report[key] = req.body[key];
        if (prefillFields.has(key) && !report.changedFromBooking.includes(key)) {
          report.changedFromBooking.push(key); // track corrections to prefilled data (Part 5.4)
        }
      }
    }
    await report.save();
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/faculty/:bookingId/evidence — upload photo/attendance/brochure/document/feedback file
router.post('/:bookingId/evidence', evidenceUpload.single('file'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!isAssigned(booking, req.user._id)) return res.status(403).json({ message: 'Not assigned to this event' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const report = await EventReport.findOne({ booking: booking._id, isCurrent: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (!report.isDraft) return res.status(409).json({ message: 'Report already submitted' });

    const { category, latitude, longitude, capturedAt, gpsAccuracyMeters } = req.body;
    if (!category) return res.status(400).json({ message: 'category is required' });

    const hasGps = latitude !== undefined && longitude !== undefined && latitude !== '' && longitude !== '';
    // GPS denial never blocks the upload — it is flagged for HOD review instead (Part 5.5).
    report.evidence.push({
      url: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
      category,
      uploadedBy: req.user._id,
      capturedAt: capturedAt || null,
      latitude: hasGps ? Number(latitude) : null,
      longitude: hasGps ? Number(longitude) : null,
      gpsAccuracyMeters: gpsAccuracyMeters ? Number(gpsAccuracyMeters) : null,
      gpsMissing: category === 'photo' && !hasGps,
    });
    await report.save();
    // Server confirms only once Cloudinary has actually returned a stored
    // URL above — never report success before the upload completes.
    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

router.delete('/:bookingId/evidence/:evidenceId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!isAssigned(booking, req.user._id)) return res.status(403).json({ message: 'Not assigned to this event' });

    const report = await EventReport.findOne({ booking: booking._id, isCurrent: true });
    if (!report || !report.isDraft) return res.status(409).json({ message: 'Cannot modify a submitted report' });

    report.evidence = report.evidence.filter((e) => e._id.toString() !== req.params.evidenceId);
    await report.save();
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/faculty/:bookingId/submit — ONLY the lead faculty may submit (Part 5.4 / Part 1 rule 6)
router.post('/:bookingId/submit', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!isLead(booking, req.user._id)) {
      return res.status(403).json({ message: 'Only the lead faculty member can submit the final event report' });
    }

    const report = await EventReport.findOne({ booking: booking._id, isCurrent: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (!report.isDraft) return res.status(409).json({ message: 'Report already submitted' });

    const required = ['nameOfProgram', 'conductingDepartment', 'personInCharge', 'programVenue', 'briefEventReport'];
    const missing = required.filter((f) => !report[f] || (typeof report[f] === 'string' && !report[f].trim()));
    if (missing.length) return res.status(400).json({ message: 'Missing required fields', fields: missing });
    if (!report.evidence.some((e) => e.category === 'attendance_register')) {
      return res.status(400).json({ message: 'Attendance register must be uploaded before submission' });
    }

    report.isDraft = false;
    report.submittedBy = req.user._id;
    report.submittedAt = new Date();
    report.reviewStatus = 'submitted';
    await report.save();

    booking.eventStatus = 'submitted';
    await booking.save();

    // Submission restores eligibility immediately — review delays never
    // unfairly block the faculty member again (Part 6).
    const Faculty = require('../../faculty/models/Faculty');
    const facultyDoc = await Faculty.findOne({ userId: req.user._id });
    if (facultyDoc && facultyDoc.eventAssignmentEligible === false) {
      facultyDoc.eventAssignmentEligible = true;
      facultyDoc.eventIneligibleReason = '';
      facultyDoc.eventIneligibleSince = null;
      await facultyDoc.save();
    }

    await EventAuditLog.create({ booking: booking._id, action: 'report_submitted', performedBy: req.user._id });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
