// controllers/users.controller.js
const User = require('../../../auth/models/User.model');

const getCanEdit = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ canEdit: user.canEdit, updatedAt: user.updatedAt });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getCanEdit };
