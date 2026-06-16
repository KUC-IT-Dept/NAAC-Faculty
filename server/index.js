require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ── Faculty module routes ─────────────────────────────────────────────────────
const facultyAuthRoutes     = require('./modules/faculty/routes/auth');
const facultyAdminRoutes    = require('./modules/faculty/routes/admin');
const facultyProfileRoutes  = require('./modules/faculty/routes/faculty');
const facultyPublicRoutes   = require('./modules/faculty/routes/public');
const facultyUploadRoutes   = require('./modules/faculty/routes/upload');
const facultyDeptRoutes     = require('./modules/faculty/routes/departments');
const facultyVcRoutes       = require('./modules/faculty/routes/vc');
const facultyHodRoutes      = require('./modules/faculty/routes/hod');
const facultyAnalyticsRoutes = require('./modules/faculty/routes/analytics');

// ── Student module routes ─────────────────────────────────────────────────────
const studentAuthRoutes       = require('./modules/student/routes/auth.routes');
const studentProfileRoutes    = require('./modules/student/routes/studentProfile.routes');
const studentPrivilegeRoutes  = require('./modules/student/routes/RequestAccess.routes');
const studentUnlockRoutes     = require('./modules/student/routes/unlockRequest.routes');
const studentFileRoutes       = require('./modules/student/routes/file.routes');
const studentSearchRoutes     = require('./modules/student/routes/search.route');
const studentUserRoutes       = require('./modules/student/routes/user.router');

// ── Temp file cleanup (every hour) ───────────────────────────────────────────
const { cleanupTemp } = require('./modules/student/utils/cleanupTemp');
setInterval(cleanupTemp, 60 * 60 * 1000);

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ── Faculty routes  →  /api/faculty/... ──────────────────────────────────────
app.use('/api/faculty/auth',        facultyAuthRoutes);
app.use('/api/faculty/admin',       facultyAdminRoutes);
app.use('/api/faculty/me',          facultyProfileRoutes);   // faculty profile (GET/PUT /me)
app.use('/api/faculty/public',      facultyPublicRoutes);    // public directory (was /api/profile)
app.use('/api/faculty/upload',      facultyUploadRoutes);    // file uploads
app.use('/api/faculty/departments', facultyDeptRoutes);
app.use('/api/faculty/vc',          facultyVcRoutes);
app.use('/api/faculty/hod',         facultyHodRoutes);
app.use('/api/faculty/analytics',   facultyAnalyticsRoutes);

// ── Student routes  →  /api/student/... ──────────────────────────────────────
app.use('/api/student/auth',           studentAuthRoutes);
app.use('/api/student',                studentProfileRoutes);   // /profile, /by-department, /requests etc.
app.use('/api/student/privilege',      studentPrivilegeRoutes); // /request-access, /approve-request
app.use('/api/student/unlock-request', studentUnlockRoutes);
app.use('/api/student/file',           studentFileRoutes);      // /compress
app.use('/api/student/search',         studentSearchRoutes);    // /users, /users/:id
app.use('/api/student/user',           studentUserRoutes);      // /can-edit

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// ── Connect to MongoDB and start server ───────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`\n🚀 Unified server on http://localhost:${PORT}`);
      console.log(`\n   FACULTY  →  /api/faculty/auth | /api/faculty/admin | /api/faculty/me`);
      console.log(`              /api/faculty/hod  | /api/faculty/vc   | /api/faculty/departments`);
      console.log(`\n   STUDENT  →  /api/student/auth    | /api/student/profile`);
      console.log(`              /api/student/privilege | /api/student/unlock-request`);
      console.log(`              /api/student/file      | /api/student/user | /api/student/search\n`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });
