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
  const { userId } = req.params;
  const rawFilePath = Array.isArray(req.params.filePath)
    ? req.params.filePath.join('/')
    : req.params.filePath || req.params[0] || '';

  // Check authorization: user can only access their own files, unless admin/hod/vc
  if (
    req.user._id.toString() !== userId && 
    !['admin', 'superadmin', 'hod', 'vc'].includes(req.user.role)
  ) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Path traversal protection
  const safePath = path.normalize(rawFilePath).replace(/^(\.\.(\/|\\|$))+/, '');
  if (!safePath || safePath.includes('..')) {
    return res.status(400).json({ message: 'Invalid path' });
  }

  const baseDir = path.resolve(process.cwd(), 'uploads', userId, 'documents');
  const filePath = path.resolve(baseDir, safePath);

  if (!filePath.startsWith(baseDir + path.sep) && filePath !== baseDir) {
    return res.status(400).json({ message: 'Invalid path' });
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.zip': 'application/zip'
    };

    res.setHeader('Content-Disposition', 'inline');
    res.type(contentTypeMap[ext] || 'application/octet-stream');
    return res.sendFile(filePath);
  }

  // Fallback to legacy flat uploads directory if not found
  const legacyFilename = path.basename(safePath);
  const legacyPath = path.join(process.cwd(), 'uploads', legacyFilename);
  
  if (fs.existsSync(legacyPath) && fs.statSync(legacyPath).isFile()) {
    const ext = path.extname(legacyPath).toLowerCase();
    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.zip': 'application/zip'
    };

    res.setHeader('Content-Disposition', 'inline');
    res.type(contentTypeMap[ext] || 'application/octet-stream');
    return res.sendFile(legacyPath);
  }

  return res.status(404).json({ message: 'File not found' });
});

module.exports = router;
