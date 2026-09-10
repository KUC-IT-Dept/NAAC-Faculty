// modules/student/controllers/profileUpdateRequest.controller.js
//
// Phase 1 gap-close: the merged backend already had admin-side
// approve/reject/pending logic for ProfileUpdateRequest (in
// routes/studentRequestsAdmin.js, untouched by this file), but nothing that
// let a student actually create a request or see their own. This adds only
// that missing student-facing half.
//
// Scope note: the old standalone backend's createProfileUpdateRequest was
// tightly coupled to a full unlock/lock workflow (profile.fullUnlockActive,
// user.canEdit, fieldCorrectionCount limits) and to an automatic
// DropdownRequest-generation side effect, none of which exist in this
// backend's schemas today. This implementation intentionally does not
// reintroduce that workflow - it produces exactly what the existing
// (unmodified) admin approval logic already expects and consumes: a
// { studentId, changes, remarks, status: 'pending' } document. The
// `updateType` field is stored for parity with what the frontend sends
// (submitProfileUpdateRequest / submitFieldCorrectionRequest), but no
// business rule currently branches on it.

const ProfileUpdateRequest = require('../models/ProfileUpdateRequest');

const createProfileUpdateRequest = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { updateType, changes, remarks = '' } = req.body;

    if (!['full_profile', 'field_correction'].includes(updateType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update type.'
      });
    }

    if (!changes || (typeof changes === 'object' && Object.keys(changes).length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'No changes provided.'
      });
    }

    const requestNo = updateType === 'full_profile' ? `PROFILE-${Date.now()}` : `CORRECTION-${Date.now()}`;

    const request = await ProfileUpdateRequest.create({
      studentId,
      requestNo,
      updateType,
      changes,
      remarks,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Profile update request submitted successfully.',
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

const getMyProfileUpdateRequests = async (req, res) => {
  try {
    const requests = await ProfileUpdateRequest.find({
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

module.exports = { createProfileUpdateRequest, getMyProfileUpdateRequests };
