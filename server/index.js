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
const facultyDeptRoutes     = require('./modules/faculty/routes/departments');
const facultyDirectoryRoutes= require('./modules/faculty/routes/directory');
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
app.use('/uploads', express.static('uploads'));

// ── Faculty routes  →  /api/faculty/... ──────────────────────────────────────
app.use('/api/faculty/auth',        facultyAuthRoutes);
app.use('/api/faculty/admin',       facultyAdminRoutes);
app.use('/api/faculty/me',          facultyProfileRoutes);   // faculty profile (GET/PUT /me)
app.use('/api/faculty/public',      facultyPublicRoutes);    // public directory (was /api/profile)
app.use('/api/faculty/upload',      facultyUploadRoutes);    // file uploads
app.use('/api/faculty/departments', facultyDeptRoutes);
app.use('/api/faculty/directory',   facultyDirectoryRoutes);
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
