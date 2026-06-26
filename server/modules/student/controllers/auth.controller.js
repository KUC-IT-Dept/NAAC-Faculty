// controllers/auth.controller.js  (original name: auth.controller.mjs)
const User = require('../../../auth/models/User.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendOTP } = require('../utils/sendEmail');
const StudentProfile = require('../models/StudentProfile');

const register = async (req, res) => {
  try {
    const data = req.body;
    let orConditions = [{ email: data.email }];
    if (data.phone) orConditions.push({ phone: data.phone });
    const existingUser = await User.findOne({ $or: orConditions });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      name: data.name, email: data.email, phone: data.phone,
      password: hashedPassword, role: data.role || 'student', mustChangePassword: true
    });
    await StudentProfile.create({
      userId: user._id,
      academic_details: { department: data.department },
      personal_details: { fullName: data.name },
      contact_details: { personalEmail: data.email, personalMobile: { number: data.phone } },
      mentor_details: { hodName: data.hodName, hodEmail: data.hodEmail, tutorName: data.tutorName, tutorEmail: data.tutorEmail }
    });
    return res.status(201).json({
      message: 'User registration complete',
      user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, mustChangePassword: user.mustChangePassword }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ success: false, message: 'User does not exist' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Wrong password' });
    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.status(200).json({
      success: true, message: 'Login successful', token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, canEdit: user.canEdit }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const ResetPassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(400).json({ message: 'User does not exist' });
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ message: 'Missing fields' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Wrong current password' });
    if (newPassword !== confirmPassword) return res.status(400).json({ message: 'Password mismatch' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: 'success' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { token, currentPassword, newPassword } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current password and new password are required' });
    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
    catch { return res.status(401).json({ message: 'Invalid token' }); }
    const user = await User.findById(decoded._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Wrong password' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const checkAuth = async (req, res) => {
  try {
    return res.status(200).json({ success: true, message: 'Authenticated', user: req.user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { register, login, ResetPassword, changePassword, checkAuth };
