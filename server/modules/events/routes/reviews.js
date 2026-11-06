// modules/events/routes/reviews.js
const express = require('express');
const { auth } = require('../../faculty/middleware/auth');
const { Booking } = require('../models/Booking');
const Department = require('../../faculty/models/Department');
const User = require('../../../auth/models/User.model');
const EventReport = require('../models/EventReport');
const EventAuditLog = require('../models/EventAuditLog');
const { notify } = require('../services/notificationService');

const router = express.Router();
router.use(auth);

// Report review is an HOD responsibility, and Admin/superadmin can also
// review institution-wide (Part 4 permission rules: "Admin ... Can review
// submitted event reports"). Faculty never reach these routes.
const isAdmin = (req) => ['admin', 'superadmin'].includes(req.user?.role);
const requireHodOrAdmin = (req, res, next) => {
  if (isAdmin(req) || req.user?.role === 'hod') return next();
  return res.status(403).json({ message: 'HOD or admin access required' });
};
router.use(requireHodOrAdmin);

const getHodDepartment = async (userId) => {
  const assignedDepartment = await Department.findOne({ hod: userId }).select('name').lean();
  if (assignedDepartment?.name) return assignedDepartment.name;
  const user = await User.findById(userId).select('department').lean();
  return user?.department?.trim() || null;
};

// GET /api/events/reviews — ALL current-version reports regardless of status
// (Admin: institution-wide, for the Reports & Evidence screen's "view
// submitted reports / identify incomplete submissions" requirement. HOD:
// scoped to their own department, same visibility rule as bookings.)
router.get('/', async (req, res) => {
  try {
    const filter = { isCurrent: true };
    if (!isAdmin(req)) {
      const dept = await getHodDepartment(req.user._id);
      filter.conductingDepartment = dept || '__none__';
    }
    const reports = await EventReport.find(filter)
      .populate({ path: 'booking', populate: { path: 'venue leadFaculty supportingFaculty' } })
      .sort({ updatedAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/events/reviews/pending — reports awaiting review (HOD: own
// department only; Admin: institution-wide)
router.get('/pending', async (req, res) => {
  try {
    const filter = { isCurrent: true, reviewStatus: { $in: ['submitted', 'under_review'] } };
    if (!isAdmin(req)) {
      const dept = await getHodDepartment(req.user._id);
      filter.conductingDepartment = dept || '__none__';
    }
    const reports = await EventReport.find(filter)
      .populate({ path: 'booking', populate: { path: 'venue leadFaculty supportingFaculty' } })
      .sort({ submittedAt: 1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/events/reviews/:reportId — full detail for HOD inspection (Part 7)
router.get('/:reportId', async (req, res) => {
  try {
    const report = await EventReport.findById(req.params.reportId)
      .populate({ path: 'booking', populate: { path: 'venue leadFaculty supportingFaculty' } });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    const history = await EventReport.find({ booking: report.booking._id }).sort({ version: 1 });
    res.json({ report, versions: history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/reviews/:reportId/approve
router.post('/:reportId/approve', async (req, res) => {
  try {
    const report = await EventReport.findById(req.params.reportId).populate('booking');
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // A faculty member must never approve their own report — hodOnly already
    // enforces role===hod, but an HOD who is also the submitting lead
    // faculty on their own booking must still be blocked here.
    if (report.submittedBy && report.submittedBy.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot approve your own submitted report' });
    }
    if (report.reviewStatus !== 'submitted' && report.reviewStatus !== 'under_review') {
      return res.status(409).json({ message: 'Report is not awaiting review' });
    }

    report.reviewStatus = 'approved';
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    const booking = report.booking;
    booking.eventStatus = 'published';
    await booking.save();

    await EventAuditLog.create({ booking: booking._id, action: 'report_approved', performedBy: req.user._id, meta: { reportId: report._id, version: report.version } });
    await notify({ recipient: report.submittedBy, type: 'report_approved', booking: booking._id, message: `Your report for "${booking.programName}" was approved and published.` });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/reviews/:reportId/request-corrections
router.post('/:reportId/request-corrections', async (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes) return res.status(400).json({ message: 'Correction notes are required' });

    const report = await EventReport.findById(req.params.reportId).populate('booking');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (!['submitted', 'under_review'].includes(report.reviewStatus)) {
      return res.status(409).json({ message: 'Report is not awaiting review' });
    }

    // Preserve this submitted version untouched; open a new draft version
    // for the correction so prior submissions are never lost (Part 7).
    report.isCurrent = false;
    report.reviewStatus = 'correction_requested';
    report.correctionNotes = notes;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    const prev = report.toObject();
    const next = await EventReport.create({
      booking: report.booking._id, // report.booking is populated; use its id, not the sub-document
      version: prev.version + 1,
      isCurrent: true,
      isDraft: true,
      nameOfProgram: prev.nameOfProgram,
      conductingDepartment: prev.conductingDepartment,
      personInCharge: prev.personInCharge,
      programVenue: prev.programVenue,
      targetGroupBeneficiaries: prev.targetGroupBeneficiaries,
      dateFrom: prev.dateFrom,
      dateTo: prev.dateTo,
      expectedStrength: prev.expectedStrength,
      objectives: prev.objectives,
      resourcePerson: prev.resourcePerson,
      numberOfParticipants: prev.numberOfParticipants,
      briefEventReport: prev.briefEventReport,
      feedbackText: prev.feedbackText,
      evidence: prev.evidence,
      changedFromBooking: prev.changedFromBooking,
      submittedBy: null,
      submittedAt: null,
      reviewStatus: 'draft',
      correctionNotes: notes,
    });

    const booking = report.booking;
    booking.eventStatus = 'correction_required';
    await booking.save();

    await EventAuditLog.create({ booking: booking._id, action: 'correction_requested', performedBy: req.user._id, reason: notes });
    await notify({ recipient: booking.leadFaculty, type: 'correction_requested', booking: booking._id, message: `Corrections requested for "${booking.programName}": ${notes}` });
    res.json(next);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/reviews/:reportId/reject
router.post('/:reportId/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'A rejection reason is required' });

    const report = await EventReport.findById(req.params.reportId).populate('booking');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (!['submitted', 'under_review'].includes(report.reviewStatus)) {
      return res.status(409).json({ message: 'Report is not awaiting review' });
    }

    report.reviewStatus = 'rejected';
    report.rejectionReason = reason;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    const booking = report.booking;
    booking.eventStatus = 'correction_required';
    await booking.save();

    await EventAuditLog.create({ booking: booking._id, action: 'report_rejected', performedBy: req.user._id, reason });
    await notify({ recipient: booking.leadFaculty, type: 'report_rejected', booking: booking._id, message: `Your report for "${booking.programName}" was rejected: ${reason}` });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
