// modules/events/routes/bookings.js
const express = require('express');
const { auth } = require('../../faculty/middleware/auth');
const { Booking } = require('../models/Booking');
const Faculty = require('../../faculty/models/Faculty');
const Department = require('../../faculty/models/Department');
const User = require('../../../auth/models/User.model');
const EventAuditLog = require('../models/EventAuditLog');
const { notify } = require('../services/notificationService');
const {
  resolveSlotTimes, computeReportDeadline, findConflictingBookings,
  checkVenueMaintenanceConflict, confirmBookingSafely, startOfDayUTC,
} = require('../services/bookingService');

const router = express.Router();
router.use(auth);
const isAdmin = (req) => ['admin', 'superadmin'].includes(req.user?.role);
const requireHodOrAdmin = (req, res, next) => {
  if (isAdmin(req) || req.user?.role === 'hod') return next();
  return res.status(403).json({ message: 'HOD or admin access required' });
};
router.use(requireHodOrAdmin);

// Only authorized HODs can create/confirm venue bookings (Part 1, rule 1).
// `hodOnly` already restricts to role==='hod'; department scoping below
// additionally keeps an HOD inside their own department's bookings, since
// this app's HOD role is department-scoped (see getHodDepartment pattern
// used throughout modules/faculty/routes/hod.js).
const getHodDepartment = async (userId) => {
  // HOD accounts are independent administrative users; no Faculty document
  // is expected. Department.hod is the authoritative assignment.
  const assignedDepartment = await Department.findOne({ hod: userId }).select('name').lean();
  if (assignedDepartment?.name) return assignedDepartment.name;
  const user = await User.findById(userId).select('department').lean();
  return user?.department?.trim() || null;
};

async function assertHodOwnsBooking(req, booking) {
  if (isAdmin(req)) return true;
  if (String(booking.createdBy) !== String(req.user._id)) return false;
  const dept = await getHodDepartment(req.user._id);
  return !!dept && booking.conductingDepartment === dept;
}

async function assertHodDepartmentBooking(req, booking) {
  if (isAdmin(req)) return true;
  const dept = await getHodDepartment(req.user._id);
  return !!dept && booking.conductingDepartment === dept;
}

async function assertFacultyInDepartment(userId, dept) {
  const f = await Faculty.findOne({ userId, 'employmentDetails.department': dept });
  return !!f;
}

function buildAssignmentHistoryEntry(action, faculty, performedBy, reason = '') {
  return { action, faculty, performedBy, reason, at: new Date() };
}

// GET /api/events/bookings — calendar view, filterable by venue/department/day-week-month
router.get('/', async (req, res) => {
  try {
    const { venue, department, from, to } = req.query;
    const filter = {};
    if (venue) filter.venue = venue;
    // Calendar visibility is institution-wide for HODs: they must see every
    // department's reservations to check shared venue availability. Department
    // scoping remains enforced on all write operations below.
    if (department) filter.conductingDepartment = department;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = startOfDayUTC(from);
      if (to) filter.date.$lte = startOfDayUTC(to);
    }
    const bookings = await Booking.find(filter)
      .populate('venue', 'name venueType roomNumber')
      .populate('leadFaculty', 'name email')
      .populate('supportingFaculty', 'name email')
      .sort({ date: 1, startTime: 1 });
    const ownDepartment = isAdmin(req) ? null : await getHodDepartment(req.user._id);
    const visibleBookings = bookings.map((booking) => {
      const item = booking.toObject();
      const creatorId = item.createdBy?._id || item.createdBy;
      item.createdBy = creatorId ? String(creatorId) : '';
      item.canCancel = item.status !== 'cancelled' && (isAdmin(req) || String(creatorId) === String(req.user._id));
      item.canManage = isAdmin(req) || (!!ownDepartment && item.conductingDepartment === ownDepartment);
      return item;
    });
    res.json(visibleBookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('venue')
      .populate('leadFaculty', 'name email')
      .populate('supportingFaculty', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const item = booking.toObject();
    const creatorId = item.createdBy?._id || item.createdBy;
    const ownDepartment = isAdmin(req) ? null : await getHodDepartment(req.user._id);
    item.createdBy = creatorId ? String(creatorId) : '';
    item.canCancel = item.status !== 'cancelled' && (isAdmin(req) || String(creatorId) === String(req.user._id));
    item.canManage = isAdmin(req) || (!!ownDepartment && item.conductingDepartment === ownDepartment);
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/bookings — create (as draft or directly confirmed)
router.post('/', async (req, res) => {
  try {
    if (isAdmin(req)) return res.status(403).json({ message: 'Admin accounts manage bookings; HOD accounts create them' });
    const dept = await getHodDepartment(req.user._id);
    if (!dept) return res.status(400).json({ message: 'HOD department not configured' });

    const {
      programName, venue, customVenueName, customRoomNumber,
      date, slotType, standardSlotNumber, startTime, endTime,
      targetGroups, expectedStrength, objectives, resourcePerson, bookingNotes,
      leadFaculty, supportingFaculty, confirm,
    } = req.body;

    if (!programName || !venue || !date || !slotType || !leadFaculty) {
      return res.status(400).json({ message: 'programName, venue, date, slotType and leadFaculty are required' });
    }

    const leadFacultyInDept = await assertFacultyInDepartment(leadFaculty, dept);
    if (!leadFacultyInDept) {
      return res.status(403).json({ message: 'Lead faculty must belong to your department' });
    }

    // Faculty with a missed 48-hour deadline are ineligible for new
    // assignments by default (Part 6), unless an emergency override was
    // already granted and restored them, or the HOD submits with override.
    const leadFacultyDoc = await Faculty.findOne({ userId: leadFaculty });
    if (leadFacultyDoc && leadFacultyDoc.eventAssignmentEligible === false && !req.body.overrideIneligibility) {
      return res.status(409).json({
        message: 'Lead faculty is currently ineligible for new event assignments (overdue report). Use overrideIneligibility with a reason to proceed.',
        reason: leadFacultyDoc.eventIneligibleReason,
      });
    }

    const resolvedTimes = await resolveSlotTimes({ date, slotType, standardSlotNumber, startTime, endTime });
    await checkVenueMaintenanceConflict(venue, resolvedTimes.startTime, resolvedTimes.endTime);

    const conflicts = await findConflictingBookings({
      venue, date, startTime: resolvedTimes.startTime, endTime: resolvedTimes.endTime,
    });
    if (conflicts.length > 0) {
      return res.status(409).json({ message: 'Venue is already booked for an overlapping time' });
    }

    const booking = await Booking.create({
      programName, conductingDepartment: dept, venue,
      customVenueName, customRoomNumber,
      date: startOfDayUTC(date), slotType, standardSlotNumber: slotType === 'standard' ? standardSlotNumber : null,
      startTime: resolvedTimes.startTime, endTime: resolvedTimes.endTime,
      targetGroups: targetGroups || [], expectedStrength, objectives, resourcePerson, bookingNotes,
      leadFaculty, supportingFaculty: supportingFaculty || [],
      status: confirm ? 'draft' : 'draft', // always created as draft; confirm step below enforces conflict-safe transition
      eventStatus: 'booked',
      reportDeadline: computeReportDeadline(resolvedTimes.endTime),
      assignmentHistory: [buildAssignmentHistoryEntry('assigned_lead', leadFaculty, req.user._id)],
      createdBy: req.user._id,
    });

    if (confirm) {
      await confirmBookingSafely(booking._id);
    }

    const final = await Booking.findById(booking._id);
    await EventAuditLog.create({ booking: booking._id, action: 'booking_created', performedBy: req.user._id, meta: { confirmed: !!confirm } });
    res.status(201).json(final);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/bookings/:id/confirm — explicit draft -> confirmed, conflict-safe
router.post('/:id/confirm', async (req, res) => {
  try {
    const existing = await Booking.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Booking not found' });
    if (!(await assertHodDepartmentBooking(req, existing))) return res.status(403).json({ message: 'You can only manage your department bookings' });
    const booking = await confirmBookingSafely(req.params.id);
    await EventAuditLog.create({ booking: booking._id, action: 'booking_confirmed', performedBy: req.user._id });
    res.json(booking);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/bookings/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'A cancellation reason is required' });
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!(await assertHodOwnsBooking(req, booking))) return res.status(403).json({ message: 'HODs can cancel only events created by their own HOD account. Admins can cancel any booking.' });
    if (booking.status === 'cancelled') return res.status(409).json({ message: 'Booking is already cancelled' });

    booking.status = 'cancelled';
    booking.eventStatus = 'cancelled';
    booking.cancelReason = reason;
    await booking.save();
    await EventAuditLog.create({ booking: booking._id, action: 'booking_cancelled', performedBy: req.user._id, reason });
    await notify({ recipient: booking.leadFaculty, type: 'booking_cancelled', booking: booking._id, message: `Event "${booking.programName}" was cancelled: ${reason}` });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/bookings/:id/reschedule — creates a fresh conflict-checked booking, cancels the old one
router.post('/:id/reschedule', async (req, res) => {
  try {
    const { date, slotType, standardSlotNumber, startTime, endTime, reason } = req.body;
    const old = await Booking.findById(req.params.id);
    if (!old) return res.status(404).json({ message: 'Booking not found' });
    if (!(await assertHodOwnsBooking(req, old))) return res.status(403).json({ message: 'HODs can reschedule only events created by their own HOD account' });

    const resolvedTimes = await resolveSlotTimes({ date, slotType, standardSlotNumber, startTime, endTime });
    await checkVenueMaintenanceConflict(old.venue, resolvedTimes.startTime, resolvedTimes.endTime);
    const conflicts = await findConflictingBookings({
      venue: old.venue, date, startTime: resolvedTimes.startTime, endTime: resolvedTimes.endTime, excludeBookingId: old._id,
    });
    if (conflicts.length > 0) return res.status(409).json({ message: 'New time conflicts with an existing booking' });

    const replacement = await Booking.create({
      ...old.toObject(),
      _id: undefined,
      date: startOfDayUTC(date), slotType, standardSlotNumber: slotType === 'standard' ? standardSlotNumber : null,
      startTime: resolvedTimes.startTime, endTime: resolvedTimes.endTime,
      status: 'draft',
      reportDeadline: computeReportDeadline(resolvedTimes.endTime),
      rescheduledFrom: old._id,
      remindersSent: { completion: false, hour24: false, hour40: false, overdue: false },
      createdAt: undefined, updatedAt: undefined,
    });
    await confirmBookingSafely(replacement._id);

    old.status = 'rescheduled';
    old.eventStatus = 'cancelled';
    old.cancelReason = reason || 'Rescheduled';
    await old.save();

    await EventAuditLog.create({ booking: replacement._id, action: 'booking_rescheduled', performedBy: req.user._id, reason, meta: { from: old._id } });
    res.status(201).json(replacement);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Faculty assignment ──────────────────────────────────────────────────────
// PATCH /api/events/bookings/:id/assignments — change lead and/or supporting faculty
router.patch('/:id/assignments', async (req, res) => {
  try {
    const dept = await getHodDepartment(req.user._id);
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!(await assertHodDepartmentBooking(req, booking))) return res.status(403).json({ message: 'You can only manage your department bookings' });

    const { leadFaculty, addSupporting, removeSupporting, reason } = req.body;

    if (leadFaculty && leadFaculty !== booking.leadFaculty.toString()) {
      const inDept = await assertFacultyInDepartment(leadFaculty, dept);
      if (!inDept) return res.status(403).json({ message: 'Lead faculty must belong to your department' });
      booking.assignmentHistory.push(buildAssignmentHistoryEntry('reassigned_lead', leadFaculty, req.user._id, reason));
      booking.leadFaculty = leadFaculty;
    }
    if (Array.isArray(addSupporting)) {
      for (const fid of addSupporting) {
        if (!booking.supportingFaculty.some((s) => s.toString() === fid)) {
          booking.supportingFaculty.push(fid);
          booking.assignmentHistory.push(buildAssignmentHistoryEntry('added_support', fid, req.user._id, reason));
        }
      }
    }
    if (Array.isArray(removeSupporting)) {
      booking.supportingFaculty = booking.supportingFaculty.filter((s) => !removeSupporting.includes(s.toString()));
      for (const fid of removeSupporting) {
        booking.assignmentHistory.push(buildAssignmentHistoryEntry('removed_support', fid, req.user._id, reason));
      }
    }

    await booking.save();
    await EventAuditLog.create({ booking: booking._id, action: 'assignments_updated', performedBy: req.user._id, reason, meta: req.body });
    if (leadFaculty) {
      await notify({ recipient: leadFaculty, type: 'faculty_reassigned', booking: booking._id, message: `You are now the lead faculty for "${booking.programName}"` });
    }
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/bookings/:id/emergency-override — HOD restores eligibility / reassigns with audited reason
router.post('/:id/emergency-override', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'A reason is required for an emergency override' });
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!(await assertHodDepartmentBooking(req, booking))) return res.status(403).json({ message: 'You can only manage your department bookings' });

    booking.emergencyOverride = { granted: true, reason, grantedBy: req.user._id, grantedAt: new Date() };
    await booking.save();

    const facultyDoc = await Faculty.findOne({ userId: booking.leadFaculty });
    if (facultyDoc) {
      facultyDoc.eventAssignmentEligible = true;
      facultyDoc.eventIneligibleReason = '';
      facultyDoc.eventIneligibleSince = null;
      await facultyDoc.save();
    }

    await EventAuditLog.create({ booking: booking._id, action: 'emergency_override', performedBy: req.user._id, reason });
    await notify({ recipient: booking.leadFaculty, type: 'emergency_override', booking: booking._id, message: `Your assignment eligibility was restored by your HOD: ${reason}` });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
