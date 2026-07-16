const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const User = require('../../../auth/models/User.model');

const router = express.Router();

// Middleware to authenticate via query token or header
const authFileAccess = async (req, res, next) => {
  try {
    let token = req.query.token;
    
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ── GET /api/faculty/files/photo/:userId/:filename ───────────────────────
// Publicly accessible profile photos
router.get('/photo/:userId/:filename', (req, res) => {
  const { userId, filename } = req.params;
  
  // Basic sanitization
  if (userId.includes('..') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ message: 'Invalid path' });
  }

  const filePath = path.join(process.cwd(), 'uploads', userId, 'photos', filename);
  
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  
  // Fallback to legacy photo directory if not found in user directory
  const legacyPath = path.join(process.cwd(), 'uploads', 'photos', filename);
  if (fs.existsSync(legacyPath)) {
    return res.sendFile(legacyPath);
  }

  return res.status(404).json({ message: 'Photo not found' });
});

// ── GET /api/faculty/files/:userId/* ──────────────────────────────────────
// Authenticated access to general documents
router.get('/:userId/*filePath', authFileAccess, (req, res) => {
  const { userId, filePath: filePathParam } = req.params;

  // Check authorization: user can only access their own files, unless admin/hod/vc
  if (
    req.user._id.toString() !== userId && 
    !['admin', 'superadmin', 'hod', 'vc'].includes(req.user.role)
  ) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Path traversal protection
  const safePath = path.normalize(filePathParam).replace(/^(\.\.(\/|\\|$))+/, '');
  
  if (safePath.includes('..')) {
    return res.status(400).json({ message: 'Invalid path' });
  }

  const filePath = path.join(process.cwd(), 'uploads', userId, 'documents', safePath);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  // Fallback to legacy flat uploads directory if not found
  const legacyFilename = path.basename(safePath);
  const legacyPath = path.join(process.cwd(), 'uploads', legacyFilename);
  
  if (fs.existsSync(legacyPath)) {
    return res.sendFile(legacyPath);
  }

  return res.status(404).json({ message: 'File not found' });
});

module.exports = router;
