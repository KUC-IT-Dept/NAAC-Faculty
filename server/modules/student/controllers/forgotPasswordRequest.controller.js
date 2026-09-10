// modules/student/controllers/forgotPasswordRequest.controller.js
//
// Phase 1 gap-close: admin-side pending/reset/reject logic for
// ForgotPasswordRequest already exists in routes/studentRequestsAdmin.js
// (untouched by this file). Nothing let a locked-out student actually
// submit a request - this adds only that missing half.
//
// createForgotPasswordRequest is intentionally public (no auth middleware):
// a student who forgot their password cannot present a valid JWT, so this
// must be reachable pre-login, exactly like the old backend's route. It
// only requires knowing the account's email - it does not accept or trust
// any role/identity claim from the client.

const User = require('../../../auth/models/User.model');
const ForgotPasswordRequest = require('../models/ForgotPasswordRequest');
const { createNotification } = require('../utils/createNotification');

const createForgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.'
      });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email.'
      });
    }

    const existing = await ForgotPasswordRequest.findOne({
      studentId: user._id,
      status: 'pending'
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A password reset request is already pending.'
      });
    }

    const request = await ForgotPasswordRequest.create({
      studentId: user._id,
      requestNo: `FP-${Date.now()}`,
      status: 'pending'
    });

    await createNotification({
      studentId: user._id,
      title: 'Password Reset Request Submitted',
      message: 'Your password reset request has been submitted successfully. Please wait for administrator approval.',
      type: 'info',
      metadata: { forgotPasswordRequestId: request._id }
    });

    return res.status(201).json({
      success: true,
      message: 'Password reset request submitted successfully.',
      request
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const getMyForgotPasswordRequests = async (req, res) => {
  try {
    const requests = await ForgotPasswordRequest.find({
      studentId: req.user._id
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = { createForgotPasswordRequest, getMyForgotPasswordRequests };
