// modules/student/utils/createNotification.js
// Adapted from kuc-backend-main/utils/createNotification.mjs (ESM -> CommonJS).
// Thin wrapper so callers don't need to import the Notification model
// directly. Failures here must never break the calling request (a
// notification is a side-effect, not the primary operation), so errors are
// logged and swallowed rather than thrown.

const Notification = require('../models/Notification');

const createNotification = async ({ studentId, title, message, type = 'info', metadata = {} }) => {
  try {
    return await Notification.create({ studentId, title, message, type, metadata });
  } catch (err) {
    console.error('[createNotification] failed:', err.message);
    return null;
  }
};

module.exports = { createNotification };
