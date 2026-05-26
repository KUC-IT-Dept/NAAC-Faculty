require('dotenv').config({
  path: require('path').resolve(__dirname, "../../../.env')
});
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

// Fail database operations quickly if Mongo is unavailable instead of hanging requests.
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 5000);

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const directoryRoutes = require('./routes/directory');

const app = express();
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

debugLog('[Config] Startup options', {
  allowAllOrigins,
  allowedOrigins: Array.from(allowedOrigins),
  frontendUrl: process.env.FRONTEND_URL || null,
  corsOriginsEnv: process.env.CORS_ORIGINS || null,
  hasJwtSecret: Boolean(process.env.JWT_SECRET),
  hasMongoUri: Boolean(process.env.MONGO_URI || process.env.MONGODB_URI),
});

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
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static file serving for uploads ──────────────────────────────────────────
// Constraint #3: path.join(__dirname, ...) for absolute path correctness
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/directory', directoryRoutes);

// Lightweight root route helps platform probes and confirms container is reachable.
app.get('/', (_req, res) => {
  return res.status(200).send('ProfCV API is running');
});

// ── Health check ──────────────────────────────────────────────────────────────
const mongoStateLabel = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

app.get('/api/health', (_req, res) => {
  const dbState = mongoStateLabel[mongoose.connection.readyState] || 'unknown';
  return res.json({ status: 'ok', dbState, timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  console.warn('[HTTP] Route not found', {
    method: req.method,
    path: req.originalUrl,
    origin: req.headers.origin || 'no-origin',
  });
  return res.status(404).json({ message: 'Route not found.' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
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
  // Handle multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 5 MB.' });
  }
  return res.status(500).json({ message: err.message || 'Internal server error.' });
});

// ── Database & Server Start ───────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

debugLog('[Startup] Booting API server', {
  host: HOST,
  port: PORT,
  node: process.version,
  pid: process.pid,
});

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Prof CV API server running on ${HOST}:${PORT}`);
});

server.on('error', (err) => {
  console.error('[Server] listen error', err);
});

if (!MONGO_URI) {
  console.error('❌ Missing MongoDB URI. Set MONGO_URI or MONGODB_URI in environment variables.');
} else {
  debugLog('[Mongo] Attempting connection');
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log('✅ MongoDB connected');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection failed:', err.message);
    });
}

mongoose.connection.on('error', (err) => {
  console.error('[Mongo] connection error event', err.message);
});

mongoose.connection.on('connected', () => {
  debugLog('[Mongo] connected event fired');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠ MongoDB disconnected');
});
