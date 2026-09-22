require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const DEBUG_LOGS = String(process.env.DEBUG_LOGS || 'true').toLowerCase() !== 'false';

function debugLog(message, meta) {
  if (!DEBUG_LOGS) return;
  if (typeof meta === 'undefined') {
    console.log(message);
    return;
  }
  console.log(message, meta);
}

process.on('uncaughtException', (err) => {
  console.error('[Process] uncaughtException', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Process] unhandledRejection', reason);
});

// ── Faculty module routes ─────────────────────────────────────────────────────
const facultyAuthRoutes     = require('./modules/faculty/routes/auth');
const facultyAdminRoutes    = require('./modules/faculty/routes/admin');
const facultyProfileRoutes  = require('./modules/faculty/routes/faculty');
const facultyPublicRoutes   = require('./modules/faculty/routes/public');
const facultyUploadRoutes   = require('./modules/faculty/routes/upload');
const legacyUploadsRoutes   = require('./modules/faculty/routes/legacyUploads');
const facultyDeptRoutes     = require('./modules/faculty/routes/departments');
const facultyDirectoryRoutes= require('./modules/faculty/routes/directory');
const facultyFileRoutes     = require('./modules/faculty/routes/files');
const facultyVcRoutes       = require('./modules/faculty/routes/vc');
const facultyHodRoutes      = require('./modules/faculty/routes/hod');
const facultyAnalyticsRoutes = require('./modules/faculty/routes/analytics');
const analyticsAccessRoutes  = require('./modules/analytics/routes/analyticsAccess');
const analyticsV2Routes      = require('./modules/analytics/routes/analyticsV2');
const analyticsV3Routes      = require('./modules/analytics/routes/analyticsV3');

// ── Student module routes ─────────────────────────────────────────────────────
const studentAuthRoutes       = require('./modules/student/routes/auth.routes');
const studentProfileRoutes    = require('./modules/student/routes/studentProfile.routes');
const studentPrivilegeRoutes  = require('./modules/student/routes/RequestAccess.routes');
const studentUnlockRoutes     = require('./modules/student/routes/unlockRequest.routes');
const studentFileRoutes       = require('./modules/student/routes/file.routes');
const studentSearchRoutes     = require('./modules/student/routes/search.route');
const studentUserRoutes       = require('./modules/student/routes/user.router');
const studentRequestsAdmin    = require('./routes/studentRequestsAdmin');

// ── Phase 1 gap-close: new student-facing routes (flat-mounted below) ───────
const studentDropdownRoutes            = require('./modules/student/routes/dropdown.routes');
const studentNotificationRoutes        = require('./modules/student/routes/notification.routes');
const studentProfileUpdateRequestRoutes = require('./modules/student/routes/profileUpdateRequest.routes');
const studentForgotPasswordRequestRoutes = require('./modules/student/routes/forgotPasswordRequest.routes');

// ── Phase 3: Library institutional module ────────────────────────────────────
const libraryRoutes = require('./modules/library/routes/library.routes');

// ── Phase 4: MMTTC institutional module ──────────────────────────────────────
const mmttcRoutes = require('./modules/mmttc/routes/mmttc.routes');

// ── Temp file cleanup (every hour) ───────────────────────────────────────────
const { cleanupTemp } = require('./modules/student/utils/cleanupTemp');
setInterval(cleanupTemp, 60 * 60 * 1000);

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
const allowAllOrigins = String(process.env.CORS_ALLOW_ALL || 'true').toLowerCase() !== 'false';

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://profcv-kuc.netlify.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [])
]);

const netlifyPreviewPattern = /^https:\/\/[a-z0-9-]+--profcv-kuc\.netlify\.app$/i;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowAllOrigins) return true;
  if (allowedOrigins.has(origin)) return true;
  if (netlifyPreviewPattern.test(origin)) return true;
  return false;
}

const corsOptions = {
  origin: function (origin, callback) {
    const originLabel = origin || 'no-origin';
    if (isAllowedOrigin(origin)) {
      debugLog(`[CORS] Allow origin=${originLabel}`);
      callback(null, true);
      return;
    }
    console.warn(`[CORS] Block origin=${originLabel}`);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 204
};

if (allowAllOrigins) {
  console.warn('⚠ CORS_ALLOW_ALL is enabled. Allowing all origins.');
}

app.use((req, res, next) => {
  const startedAt = Date.now();
  const requestMeta = {
    method: req.method,
    path: req.originalUrl,
    origin: req.headers.origin || 'no-origin',
    ip: req.ip,
  };

  debugLog('[HTTP] Incoming request', requestMeta);

  res.on('finish', () => {
    debugLog('[HTTP] Completed request', {
      ...requestMeta,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
});

app.use(cors(corsOptions));
// removed app.options due to express 5 compatibility
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Legacy uploads compatibility
app.use('/uploads', legacyUploadsRoutes);

// ── Faculty routes  →  /api/faculty/... ──────────────────────────────────────
app.use('/api/faculty/auth',        facultyAuthRoutes);
app.use('/api/faculty/admin',       facultyAdminRoutes);
app.use('/api/faculty/me',          facultyProfileRoutes);   // faculty profile (GET/PUT /me)
app.use('/api/faculty/public',      facultyPublicRoutes);    // public directory (was /api/profile)
app.use('/api/faculty/upload',      facultyUploadRoutes);    // file uploads
app.use('/api/faculty/files',       facultyFileRoutes);      // secure file access
app.use('/api/faculty/departments', facultyDeptRoutes);
app.use('/api/faculty/directory',   facultyDirectoryRoutes);
app.use('/api/faculty/vc',          facultyVcRoutes);
app.use('/api/faculty/hod',         facultyHodRoutes);
app.use('/api/faculty/analytics',   facultyAnalyticsRoutes);
app.use('/api/faculty/analytics',   analyticsAccessRoutes);
app.use('/api/faculty/analytics',   analyticsV2Routes);
app.use('/api/faculty/analytics',   analyticsV3Routes);

// ── Student routes  →  /api/student/... ──────────────────────────────────────
app.use('/api/student/auth',           studentAuthRoutes);
app.use('/api/student',                studentProfileRoutes);   // /profile, /by-department, /requests etc.
app.use('/api/student/privilege',      studentPrivilegeRoutes); // /request-access, /approve-request
app.use('/api/student/unlock-request', studentUnlockRoutes);
app.use('/api/student/file',           studentFileRoutes);      // /compress
app.use('/api/student/search',         studentSearchRoutes);    // /users, /users/:id
app.use('/api/student/user',           studentUserRoutes);      // /can-edit

// ── Health check ──────────────────────────────────────────────────────────────
// IMPORTANT: this must be registered BEFORE `app.use('/api', studentRequestsAdmin)`
// below. That router is mounted at the bare '/api' prefix and does
// `router.use(auth, adminOnly)` unconditionally for every request that
// reaches it - including /api/health - before Express ever tries to match
// a specific sub-route inside it. With no auth token on a plain health
// check, that middleware was rejecting the request (401/403) and the real
// handler below was never reached. Defining /api/health earlier in the
// middleware stack means it's answered directly and never reaches that
// router at all.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Phase 3: Library institutional module ────────────────────────────────────
// ── Phase 4: MMTTC institutional module ──────────────────────────────────────
// IMPORTANT: these must be registered BEFORE `app.use('/api', studentRequestsAdmin)`
// below, for the same reason /api/health is above it: that router's
// `router.use(auth, adminOnly)` runs for every request reaching it - not
// just its own /unlock-request, /profile-update-request, /dropdown-request,
// and /forgot-password-request sub-routes - so with library/mmttc mounted
// AFTER it, a faculty member with a Library/MMTTC responsibility (but not
// the 'admin' role) would get rejected by that blanket admin-only check
// before ever reaching authorizeModule()'s own, correct permission check
// inside these routers. Moving them here is safe: their paths never
// overlap with studentRequestsAdmin's own routes, so nothing about that
// router's behavior changes.
app.use('/api/library', libraryRoutes);
app.use('/api/mmttc', mmttcRoutes);

// ── Phase 1: compatibility aliases & flat student routes ───────────────────────
// Mounted flat (not under /api/student) to match the exact paths the
// Student frontend expects. Must be registered BEFORE `app.use('/api', studentRequestsAdmin)`
// below so unauthenticated endpoints like /api/auth/login are not blocked by
// studentRequestsAdmin's blanket `auth + adminOnly` middleware.
app.use('/api/auth',                    studentAuthRoutes);
app.use('/api/unlock-request',          studentUnlockRoutes);
app.use('/api/user',                    studentUserRoutes);
app.use('/api/dropdowns',               studentDropdownRoutes);
app.use('/api/notifications',           studentNotificationRoutes);
app.use('/api/profile-update-request',  studentProfileUpdateRequestRoutes);
app.use('/api/forgot-password-request', studentForgotPasswordRequestRoutes);

// Admin Student Requests Route (Unlock, Profile Updates, Dropdown Requests, Forgot Password)
app.use('/api', studentRequestsAdmin);

app.use((req, res) => {
  console.log('[DEBUG 404] Unhandled route:', req.method, req.originalUrl, req.url);
  res.status(404).json({ message: 'Route not found' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[GlobalError]', {
    message: err?.message,
    stack: err?.stack,
    method: req.method,
    path: req.originalUrl,
    origin: req.headers.origin || 'no-origin',
  });
  if (typeof err.message === 'string' && err.message.startsWith('Not allowed by CORS')) {
    return res.status(403).json({ message: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 5 MB.' });
  }
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// ── Connect to MongoDB and start server ───────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/iqac")
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
