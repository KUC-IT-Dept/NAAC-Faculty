// modules/events/services/notificationService.js
const { EventNotification } = require('../models/EventNotification');
const { sendEventEmail } = require('./emailService');

const EMAIL_WORTHY_TYPES = new Set([
  'deadline_overdue', 'reminder_40h', 'correction_requested', 'report_approved', 'report_rejected', 'emergency_override',
]);

// dedupKey makes this safe to call repeatedly (e.g. an overlapping cron
// tick): the unique index on dedupKey rejects the duplicate insert. The
// in-app notification is the system of record; email is best-effort on top
// of it and only fires for the notification already recorded here, so it
// can never be sent twice for the same event either.
async function notify({ recipient, type, booking, message }) {
  const dedupKey = `${type}:${booking ? booking.toString() : 'none'}:${recipient.toString()}`;
  let created;
  try {
    created = await EventNotification.create({ recipient, type, booking, message, dedupKey });
  } catch (e) {
    if (e && e.code === 11000) return null; // already sent, not an error
    throw e;
  }

  if (EMAIL_WORTHY_TYPES.has(type)) {
    // Fire-and-forget: email delivery never blocks or fails the notification.
    const User = require('../../../auth/models/User.model');
    User.findById(recipient).select('email').then((u) => {
      if (u?.email) sendEventEmail(u.email, emailSubjectFor(type), message).catch(() => {});
    }).catch(() => {});
  }

  return created;
}

function emailSubjectFor(type) {
  const subjects = {
    deadline_overdue: 'Event report overdue',
    reminder_40h: 'Event report deadline approaching',
    correction_requested: 'Corrections requested on your event report',
    report_approved: 'Your event report was approved',
    report_rejected: 'Your event report was rejected',
    emergency_override: 'Event assignment eligibility restored',
  };
  return subjects[type] || 'Campus Events notification';
}

module.exports = { notify };
