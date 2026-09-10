// controllers/RequestAccess.controller.js  (original name: RequestAccess.controller.mjs)
const RequestAccess = require('../models/RequestAccess');
const User = require('../../../auth/models/User.model');
const StudentProfile = require('../models/StudentProfile');

const requestAccess = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) return res.status(400).json({ Message: 'Session out please login' });
    await RequestAccess.create({ userId, status: 'pending', message: req.body.message });
    return res.status(200).json({ message: 'The request has been sent to the HOD' });
  } catch (error) {
    return res.status(400).json({ message: 'Something fishy.' });
  }
};

const getAllRequest = async (req, res) => {
  try {
    const role = req.user.role;
    if (role !== 'professor' && role !== 'office') return res.status(403).json({ message: 'Unauthorized' });
    const requests = await RequestAccess.find().populate('userId', 'name email role').sort({ createdAt: -1 });
    return res.status(200).json({ message: 'Requests fetched successfully', count: requests.length, requests });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const approveEdit = async (req, res) => {
  try {
    const role = req.user.role;
    if (role !== 'professor' && role !== 'office') return res.status(400).json({ message: 'Only teacher can approve.' });
    const user = req.body.userId;
    if (!user) return res.status(400).json({ message: 'User does not exist.' });
    const profile = await StudentProfile.findOne({ userId: user });
    if (!profile || !profile.request) return res.status(404).json({ message: 'No pending request found for this user.' });
    const requestData = profile.request;
    const approvedProfile = await StudentProfile.findOneAndUpdate(
      { userId: user },
      { $set: requestData, $unset: { request: '' } },
      { new: true, runValidators: true }
    );
    if (req.body.requestId) {
      await RequestAccess.findByIdAndUpdate(req.body.requestId, { status: 'approved' });
    }
    await User.findByIdAndUpdate(user, { canEdit: false });
    return res.status(200).json({ message: 'Request approved and profile updated successfully', profile: approvedProfile });
  } catch (error) {
    return res.status(400).json({ message: 'Something fishy.', error: error.message });
  }
};

module.exports = { requestAccess, getAllRequest, approveEdit };
