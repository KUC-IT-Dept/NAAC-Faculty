// controllers/unlockRequest.controller.js
const UnlockRequest = require('../models/UnlockRequest');
const StudentProfile = require('../models/StudentProfile');
const User = require('../../../auth/models/User.model');
const { isEmptyFileValue, sanitizeProfileSection, stripUndefinedDeep } = require('../utils/profileDataSanitizer');

const createUnlockRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { requestType, correctionFields, reason, formData } = req.body;
    if (!['field_correction', 'full_unlock'].includes(requestType)) return res.status(400).json({ message: 'Invalid request type' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (requestType === 'field_correction') {
      if (!correctionFields || correctionFields.length === 0) return res.status(400).json({ message: 'At least one field is required' });
      if (correctionFields.length > 5) return res.status(400).json({ message: 'Maximum 5 fields allowed in one request' });
    }
    if (requestType === 'full_unlock') {
      const pendingUnlock = await UnlockRequest.findOne({ studentId: userId, requestType: 'full_unlock', status: 'pending' });
      if (pendingUnlock) return res.status(400).json({ message: 'You already have a pending full unlock request' });
    }
    if (requestType === 'field_correction') {
      const pendingCount = await UnlockRequest.countDocuments({ studentId: userId, requestType: 'field_correction', status: 'pending' });
      if (pendingCount >= 5) return res.status(400).json({ message: 'Maximum 5 pending correction requests allowed' });
    }
    const request = await UnlockRequest.create({
      studentId: userId, requestNo: `UNLOCK-${Date.now()}`, requestType,
      correctionFields: correctionFields || [], formData: formData || {},
      reason: reason || '', status: 'pending'
    });
    await User.findByIdAndUpdate(userId, { canEdit: false });
    return res.status(201).json({ success: true, message: 'Request submitted successfully', request });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getMyUnlockRequests = async (req, res) => {
  try {
    const requests = await UnlockRequest.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    return res.json(requests);
  } catch (err) { return res.status(500).json({ message: err.message }); }
};

const getPendingUnlockRequests = async (req, res) => {
  try {
    const requests = await UnlockRequest.find({ status: 'pending' }).populate('studentId', 'name email').sort({ createdAt: -1 });
    return res.json(requests);
  } catch (err) { return res.status(500).json({ message: err.message }); }
};

const getUnlockRequestById = async (req, res) => {
  try {
    const request = await UnlockRequest.findById(req.params.id).populate('studentId', 'name email');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    return res.json(request);
  } catch (err) { return res.status(500).json({ message: err.message }); }
};

const approveUnlockRequest = async (req, res) => {
  try {
    const request = await UnlockRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });
    const sectionMap = {
      personal: 'personal_details', academic: 'academic_details', contact: 'contact_details',
      family: 'family_details', education: 'education_details', financial: 'financial_details',
      health: 'health_details', professional: 'professional_details', residential: 'residential_details'
    };
    if (request.requestType === 'full_unlock') {
      const profile = await StudentProfile.findOne({ userId: request.studentId });
      if (!profile) return res.status(404).json({ message: 'Profile not found' });
      Object.entries(request.formData || {}).forEach(([section, data]) => {
        const dbSection = sectionMap[section];
        if (!dbSection || !data) return;
        const cleanedData = sanitizeProfileSection(dbSection, data);
        if (Object.keys(cleanedData).length === 0) return;
        const existingSection = profile[dbSection]?.toObject?.() || profile[dbSection] || {};
        profile.set(dbSection, sanitizeProfileSection(dbSection, { ...stripUndefinedDeep(existingSection), ...cleanedData }));
      });
      await profile.save();
    }
    if (request.requestType === 'field_correction') {
      const profile = await StudentProfile.findOne({ userId: request.studentId });
      if (!profile) return res.status(404).json({ message: 'Profile not found' });
      const fieldSectionMap = {
        personal: 'personal_details', academic: 'academic_details', contact: 'contact_details',
        health: 'health_details', family: 'family_details', education: 'education_details',
        financial: 'financial_details', professional: 'professional_details', residential: 'residential_details'
      };
      const updateData = {};
      request.correctionFields.forEach((field) => {
        const section = fieldSectionMap[field.section];
        const key = field.field;
        const value = field.requestedValue;
        if (!section || value === undefined || (section === 'academic_details' && key === 'fellowshipLetter' && isEmptyFileValue(value))) return;
        if (profile[section]) {
          profile[section][key] = stripUndefinedDeep(value);
          if (!updateData[section]) updateData[section] = {};
          updateData[section][key] = stripUndefinedDeep(value);
        }
      });
      Object.keys(updateData).forEach((section) => {
        profile.set(section, sanitizeProfileSection(section, profile[section]?.toObject?.() || profile[section] || {}));
      });
      await profile.save();
    }
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();
    return res.json({ success: true, message: 'Request approved' });
  } catch (err) { return res.status(500).json({ message: err.message }); }
};

const rejectUnlockRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await UnlockRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.remarks = reason;
    await request.save();
    return res.json({ success: true, message: 'Request rejected' });
  } catch (err) { return res.status(500).json({ message: err.message }); }
};

const getEligibility = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const requests = await UnlockRequest.find({ studentId: userId, requestType: 'field_correction' });
    const totalFieldsUsed = requests.reduce((total, r) => total + (r.correctionFields?.length || 0), 0);
    const pendingFullUnlock = await UnlockRequest.findOne({ studentId: userId, requestType: 'full_unlock', status: 'pending' });
    return res.json({ canEdit: user.canEdit, totalFieldsUsed, hasPendingFullUnlock: !!pendingFullUnlock, maxFieldsAllowed: 25 });
  } catch (err) { return res.status(500).json({ message: err.message }); }
};

module.exports = { createUnlockRequest, getMyUnlockRequests, getPendingUnlockRequests, getUnlockRequestById, approveUnlockRequest, rejectUnlockRequest, getEligibility };
