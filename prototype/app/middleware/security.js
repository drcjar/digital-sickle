'use strict';

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { doubleCsrf } = require('csrf-csrf');
const config = require('../config');

const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => config.csrfSecret,
  getSessionIdentifier: (req) => req.sessionID || '',
  getCsrfTokenFromRequest: (req) =>
    (req.body && req.body._csrf) || req.headers['x-csrf-token'],
  cookieName: config.env === 'production' ? '__Host-psifi.x-csrf-token' : 'psifi.x-csrf-token',
  cookieOptions: {
    sameSite: 'lax',
    secure: config.env === 'production',
  },
});

// Content-Security-Policy tuned for server-rendered pages with one inline
// module bootstrap (nhsuk-frontend initAll). No third-party origins.
const contentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
  },
};

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many attempts. Please wait a few minutes and try again.',
});

const helmetMiddleware = helmet({ contentSecurityPolicy });

/** Exposes the CSRF token to templates as res.locals.csrfToken. */
function exposeCsrfToken(req, res, next) {
  res.locals.csrfToken = generateCsrfToken(req, res);
  next();
}

module.exports = {
  helmetMiddleware,
  doubleCsrfProtection,
  exposeCsrfToken,
  loginRateLimiter,
};
