const jwt = require('jsonwebtoken');
const User = require('../../../../auth/models/User.model');
const bcrypt = require('bcryptjs');

/**
 * POST /api/auth/login
 * Queries MongoDB for the user seeded by seed.js.
 * Compares passwords using bcrypt.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  console.info('[authController.login] Request received', {
    email: email || null,
    hasPassword: Boolean(password),
    origin: req.headers.origin || 'no-origin',
    ip: req.ip,
  });

  if (!email || !password) {
    console.warn('[authController.login] Missing credentials');
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    console.info('[authController.login] User lookup result', {
      email: email.toLowerCase(),
      found: Boolean(user),
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Secure comparison using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn('[authController.login] Password mismatch', { email: user.email });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      photo: user.photo || '',
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    console.info('[authController.login] Login success', {
      userId: String(user._id),
      role: user.role,
      department: user.department,
    });

    return res.status(200).json({ token, user: payload });
  } catch (err) {
    console.error('[authController.login]', err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

/**
 * GET /api/auth/me
 * Returns the current user derived from the verified JWT.
 */
const getMe = async (req, res) => {
  try {
    console.info('[authController.getMe] Request received', { userId: req.user?.id || null });
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error('[authController.getMe]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * PUT /api/auth/password
 * Updates the user's password.
 */
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  console.info('[authController.updatePassword] Request received', {
    userId: req.user?.id || null,
    hasCurrentPassword: Boolean(currentPassword),
    hasNewPassword: Boolean(newPassword),
  });

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required.' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[authController.updatePassword]', err);
    return res.status(500).json({ message: 'Server error updating password.' });
  }
};

module.exports = { login, getMe, updatePassword };
