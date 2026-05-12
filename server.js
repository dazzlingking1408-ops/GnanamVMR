// server.js — VMR Backend (JSON file database — zero setup!)
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const path      = require('path');

// Initialize DB + auto-create admin on startup
require('./config/db');
require('./config/init');

const authRoutes   = require('./routes/auth');
const recordRoutes = require('./routes/records');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── CORS ──────────────────────────────────── */
app.use(cors({
  origin:         process.env.CORS_ORIGIN || '*',
  methods:        ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:    true
}));

/* ── Body parser ────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Serve frontend static files ────────────── */
app.use(express.static(path.join(__dirname, 'Public')));

/* ── Rate limiter ───────────────────────────── */
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
}));
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' }
}));

/* ── Routes ─────────────────────────────────── */
app.use('/api/auth',    authRoutes);
app.use('/api/records', recordRoutes);

/* ── Health check ───────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    success:   true,
    message:   'VMR API is running',
    database:  'JSON file (zero setup)',
    version:   '2.0.0',
    timestamp: new Date().toISOString()
  });
});

/* ── SPA fallback (non-API routes serve index) ─ */
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'Public', 'homepage.html'));
});

/* ── 404 ─────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

/* ── Error handler ───────────────────────────── */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

/* ── Start ───────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀  VMR API running on http://localhost:${PORT}`);
  console.log(`🗄️   Database: JSON file (data/vmr.json)`);
  console.log(`📋  Endpoints:`);
  console.log(`    POST   /api/auth/login`);
  console.log(`    GET    /api/auth/me`);
  console.log(`    POST   /api/auth/change-password`);
  console.log(`    GET    /api/records/all`);
  console.log(`    GET    /api/records/:vehicle`);
  console.log(`    POST   /api/records/:vehicle`);
  console.log(`    DELETE /api/records/:vehicle/:id\n`);
});
