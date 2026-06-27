'use strict';

const path = require('node:path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const nunjucks = require('nunjucks');
const SqliteStore = require('better-sqlite3-session-store')(session);

const config = require('./config');
const { getDb } = require('./db/connection');
const { migrate } = require('./db/migrate');
const { loadUser } = require('./middleware/auth');
const { auditMiddleware } = require('./middleware/audit');
const {
  helmetMiddleware,
  doubleCsrfProtection,
  exposeCsrfToken,
} = require('./middleware/security');

const NHSUK_DIST = path.join(
  __dirname,
  '..',
  'node_modules',
  'nhsuk-frontend',
  'dist',
  'nhsuk'
);

/** Builds and returns a configured Express app (exported for tests). */
function createApp() {
  migrate();
  const app = express();
  app.set('trust proxy', 1);

  // Views: our templates + nhsuk-frontend macros.
  const env = nunjucks.configure(
    [
      path.join(__dirname, 'views'),
      path.join(NHSUK_DIST, '..'), // allows "nhsuk/components/.../macro.njk"
      NHSUK_DIST,
    ],
    { autoescape: true, express: app }
  );
  env.addGlobal('serviceName', 'Digital Sickle Cell Care Plan');
  app.set('view engine', 'njk');

  // Static assets.
  app.use('/nhsuk-frontend', express.static(NHSUK_DIST));
  app.use('/public', express.static(path.join(__dirname, '..', 'public')));

  app.use(helmetMiddleware);
  app.use(cookieParser(config.sessionSecret));
  app.use(express.urlencoded({ extended: false }));

  app.use(
    session({
      store: new SqliteStore({
        client: getDb(),
        // The periodic cleanup timer keeps the event loop alive; disable it
        // under test so the test runner can exit cleanly.
        expired: { clear: config.env !== 'test', intervalMs: 15 * 60 * 1000 },
      }),
      name: 'sid',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.env === 'production',
        maxAge: config.idleTimeoutMs,
      },
    })
  );

  // Ensure a session (and its cookie) exists from the first request so the
  // session id is stable — the CSRF double-submit token is bound to it.
  app.use((req, res, next) => {
    if (req.session.started === undefined) req.session.started = Date.now();
    next();
  });

  app.use(loadUser);
  app.use(auditMiddleware);

  // CSRF protection for state-changing requests + token for templates.
  app.use(doubleCsrfProtection);
  app.use(exposeCsrfToken);

  // Expose request path for nav highlighting and prototype banner.
  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    next();
  });

  // Routes.
  app.use('/', require('./routes/auth'));
  app.use('/', require('./routes/pages'));
  app.use('/me', require('./routes/patient'));
  app.use('/shared', require('./routes/delegate'));
  app.use('/patients', require('./routes/clinician'));
  app.use('/', require('./routes/documents'));
  app.use('/audit', require('./routes/audit'));

  // 404.
  app.use((req, res) => {
    res.status(404).render('error', {
      title: 'Page not found',
      message: 'The page you were looking for could not be found.',
    });
  });

  // Error handler (incl. CSRF + upload errors).
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN' || err === require('./middleware/security')) {
      return res.status(403).render('error', {
        title: 'Session expired',
        message: 'Your form session expired. Please go back and try again.',
      });
    }
    const status = err.statusCode || 500;
    if (status >= 500) console.error(err);
    res.status(status).render('error', {
      title: 'Something went wrong',
      message: err.publicMessage || 'An unexpected error occurred.',
    });
  });

  return app;
}

module.exports = { createApp };
