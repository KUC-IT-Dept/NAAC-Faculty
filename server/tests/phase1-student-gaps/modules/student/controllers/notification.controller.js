// modules/student/controllers/notification.controller.js
// Ported from kuc-backend-main/controllers/notification.controller.mjs (ESM -> CommonJS).
// Both functions scope strictly to req.user._id (the authenticated student's
// own notifications) - same ownership behavior as the original.

const Notification = require('../models/Notification');

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      studentId: req.user._id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const deleteMyNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({
      studentId: req.user._id
    });

    res.json({
      success: true,
      message: 'All notifications deleted.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = { getMyNotifications, deleteMyNotifications };
