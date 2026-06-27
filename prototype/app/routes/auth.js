'use strict';

const express = require('express');
const router = express.Router();

const users = require('../services/users');
const patients = require('../services/patients');
const auditLog = require('../services/auditLog');
const password = require('../lib/password');
const { isNhsNet } = require('../lib/nhsEmail');
const v = require('../lib/validators');
const { requireAuth } = require('../middleware/auth');

function destinationFor(role) {
  if (role === 'clinician') return '/patients';
  if (role === 'delegate') return '/shared';
  return '/me';
}

// --- Login -------------------------------------------------------------------
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Sign in', values: {}, errors: {}, next: req.query.next || '' });
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = v.login.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).render('auth/login', {
        title: 'Sign in',
        values: req.body,
        errors: v.fieldErrors(parsed.error),
        next: req.body.next || '',
      });
    }
    const user = users.findByEmail(parsed.data.email);
    const ok = user && (await password.verify(user.password_hash, parsed.data.password));
    if (!ok) {
      return res.status(401).render('auth/login', {
        title: 'Sign in',
        values: { email: req.body.email },
        errors: { _summary: 'Email or password is incorrect.' },
        next: req.body.next || '',
      });
    }
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user.id;
      req.session.role = user.role;
      users.recordLogin(user.id);
      auditLog.startSession({ userId: user.id, sessionId: req.sessionID, ip: req.ip });
      auditLog.record({
        userId: user.id,
        userRole: user.role,
        sessionId: req.sessionID,
        action: 'login',
        ip: req.ip,
      });
      const dest = req.body.next && req.body.next.startsWith('/') ? req.body.next : destinationFor(user.role);
      res.redirect(user.acknowledged_prototype ? dest : '/acknowledge');
    });
  } catch (err) {
    next(err);
  }
});

// --- Logout ------------------------------------------------------------------
router.get('/logout', (req, res) => {
  if (req.session.userId) {
    auditLog.record({
      userId: req.session.userId,
      userRole: req.session.role,
      sessionId: req.sessionID,
      action: 'logout',
      ip: req.ip,
    });
    auditLog.endSession(req.sessionID);
  }
  req.session.destroy(() => res.redirect('/'));
});

// --- Prototype acknowledgement (first login) ---------------------------------
router.get('/acknowledge', requireAuthLoose, (req, res) => {
  res.render('auth/acknowledge', { title: 'Before you start' });
});

router.post('/acknowledge', requireAuthLoose, (req, res) => {
  users.markPrototypeAcknowledged(req.currentUser.id);
  res.redirect(destinationFor(req.currentUser.role));
});

// requireAuth but without the acknowledgement redirect (used by /acknowledge itself).
function requireAuthLoose(req, res, next) {
  if (!req.currentUser) return res.redirect('/login');
  next();
}

// --- Registration ------------------------------------------------------------
router.get('/register', (req, res) => {
  res.render('auth/register-choose', { title: 'Create an account' });
});

router.get('/register/patient', (req, res) => {
  res.render('auth/register', { title: 'Create a patient account', role: 'patient', values: {}, errors: {} });
});

router.get('/register/delegate', (req, res) => {
  res.render('auth/register', { title: 'Create a delegate account', role: 'delegate', values: {}, errors: {} });
});

router.get('/register/clinician', (req, res) => {
  res.render('auth/register', { title: 'Create a clinician account', role: 'clinician', values: {}, errors: {} });
});

router.post('/register/:role', async (req, res, next) => {
  const role = req.params.role;
  if (!['patient', 'delegate', 'clinician'].includes(role)) return next();
  try {
    const schema =
      role === 'clinician' ? v.registerClinician : role === 'delegate' ? v.registerDelegate : v.registerPatient;
    const parsed = schema.safeParse(req.body);
    const errors = parsed.success ? {} : v.fieldErrors(parsed.error);

    if (role === 'clinician' && req.body.email && !isNhsNet(req.body.email)) {
      errors.email = 'Clinicians must register with an nhs.net email address.';
    }
    if (req.body.email && users.findByEmail(req.body.email)) {
      errors.email = 'An account with this email already exists.';
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).render('auth/register', { title: 'Create an account', role, values: req.body, errors });
    }

    const hash = await password.hash(parsed.data.password);
    const user = users.create({
      role,
      email: parsed.data.email,
      password_hash: hash,
      full_name: parsed.data.full_name,
      job_title: parsed.data.job_title,
      organisation: parsed.data.organisation,
    });

    // A self-registering patient gets a patient record created and linked.
    if (role === 'patient') {
      const [first, ...rest] = (parsed.data.full_name || '').split(' ');
      patients.create({
        user_id: user.id,
        first_name: first || parsed.data.full_name,
        last_name: rest.join(' ') || '',
        email: parsed.data.email,
      });
    }

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user.id;
      req.session.role = user.role;
      auditLog.startSession({ userId: user.id, sessionId: req.sessionID, ip: req.ip });
      auditLog.record({ userId: user.id, userRole: role, sessionId: req.sessionID, action: 'register', ip: req.ip });
      res.redirect('/acknowledge');
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
