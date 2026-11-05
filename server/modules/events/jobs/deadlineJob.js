// modules/events/jobs/deadlineJob.js
// Enforces the 48-hour report submission deadline from the backend, never
// from a frontend timer (Part 6). Runs on an interval, same pattern as the
// existing modules/student/utils/cleanupTemp job wired in index.js.
const { Booking } = require('../models/Booking');
const Faculty = require('../../faculty/models/Faculty');
const { notify } = require('../services/notificationService');

async function runDeadlineSweep() {
  const now = new Date();

  // Transition completed events into "report_pending" and send the
  // completion notice, exactly once per booking (remindersSent.completion).
  const justCompleted = await Booking.find({
    status: 'confirmed',
    endTime: { $lte: now },
    eventStatus: { $in: ['booked', 'assigned'] },
    'remindersSent.completion': false,
  });
  for (const b of justCompleted) {
    b.eventStatus = 'report_pending';
    b.remindersSent.completion = true;
    await b.save();
    await notify({ recipient: b.leadFaculty, type: 'event_completion', booking: b._id, message: `"${b.programName}" has ended. Submit your event report within 48 hours.` });
  }

  // 24-hour reminder: 24h after event end.
  const need24h = await Booking.find({
    status: 'confirmed',
    eventStatus: { $in: ['report_pending', 'correction_required'] },
    'remindersSent.hour24': false,
    endTime: { $lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
  });
  for (const b of need24h) {
    b.remindersSent.hour24 = true;
    await b.save();
    await notify({ recipient: b.leadFaculty, type: 'reminder_24h', booking: b._id, message: `Reminder: report for "${b.programName}" is due within 24 hours.` });
  }

  // 40-hour reminder: deadline approaching.
  const need40h = await Booking.find({
    status: 'confirmed',
    eventStatus: { $in: ['report_pending', 'correction_required'] },
    'remindersSent.hour40': false,
    endTime: { $lte: new Date(now.getTime() - 40 * 60 * 60 * 1000) },
  });
  for (const b of need40h) {
    b.remindersSent.hour40 = true;
    await b.save();
    await notify({ recipient: b.leadFaculty, type: 'reminder_40h', booking: b._id, message: `Deadline approaching: report for "${b.programName}" is due within 8 hours.` });
  }

  // Overdue: past reportDeadline and still not submitted/under review/approved.
  const overdue = await Booking.find({
    status: 'confirmed',
    eventStatus: { $in: ['report_pending', 'correction_required'] },
    reportDeadline: { $lte: now },
    'remindersSent.overdue': false,
  });
  for (const b of overdue) {
    b.remindersSent.overdue = true;
    b.eventStatus = 'overdue';
    b.overdueAt = now;
    await b.save();

    if (!b.emergencyOverride?.granted) {
      const facultyDoc = await Faculty.findOne({ userId: b.leadFaculty });
      if (facultyDoc) {
        facultyDoc.eventAssignmentEligible = false;
        facultyDoc.eventIneligibleReason = `Overdue report for "${b.programName}"`;
        facultyDoc.eventIneligibleSince = now;
        await facultyDoc.save();
      }
    }

    await notify({ recipient: b.leadFaculty, type: 'deadline_overdue', booking: b._id, message: `Report for "${b.programName}" is overdue. You are ineligible for new assignments until it is submitted.` });

    // Notify HOD(s) of the conducting department.
    const User = require('../../../auth/models/User.model');
    const hods = await User.find({ role: 'hod', department: b.conductingDepartment });
    for (const hod of hods) {
      await notify({ recipient: hod._id, type: 'deadline_overdue', booking: b._id, message: `"${b.programName}" report is overdue (lead: ${b.leadFaculty}).` });
    }
  }
}

function startDeadlineJob(intervalMs = 15 * 60 * 1000) {
  // Run once shortly after boot, then on the interval. Errors are logged,
  // never thrown, so one bad sweep can't crash the process.
  const tick = () => runDeadlineSweep().catch((err) => console.error('[deadlineJob] sweep failed:', err));
  setTimeout(tick, 10 * 1000);
  setInterval(tick, intervalMs);
}

module.exports = { runDeadlineSweep, startDeadlineJob };
