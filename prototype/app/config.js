'use strict';

const path = require('node:path');
require('dotenv').config();

const root = path.join(__dirname, '..');

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  // Bind to loopback by default; in production nginx is the only public listener.
  host: process.env.HOST || '127.0.0.1',
  sessionSecret: process.env.SESSION_SECRET || 'prototype-only-not-secret-change-me',
  csrfSecret: process.env.CSRF_SECRET || 'prototype-only-csrf-secret-change-me',
  dbPath: process.env.DB_PATH || path.join(root, 'data', 'app.db'),
  uploadsDir: process.env.UPLOADS_DIR || path.join(root, 'data', 'uploads'),
  idleTimeoutMs: 30 * 60 * 1000, // 30 minutes
  consentWordingVersion: '2026-06-v1',
  maxUploadBytes: 5 * 1024 * 1024, // 5 MB
};
