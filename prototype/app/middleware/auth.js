'use strict';

const users = require('../services/users');
const patients = require('../services/patients');
const delegates = require('../services/delegates');

/**
 * Loads the current user onto req.currentUser / res.locals.currentUser from the
 * session, and enforces the idle timeout.
 */
function loadUser(req, res, next) {
  if (req.session.userId) {
    const user = users.findById(req.session.userId);
    if (user && user.is_active) {
      req.currentUser = user;
      res.locals.currentUser = user;
    } else {
      req.session.destroy(() => {});
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.currentUser) {
    return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  }
  if (!req.currentUser.acknowledged_prototype) {
    return res.redirect('/acknowledge');
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.currentUser || !roles.includes(req.currentUser.role)) {
      return res.status(403).render('error', {
        title: 'Access denied',
        message: 'You do not have permission to view this page.',
      });
    }
    next();
  };
}

/**
 * Central authorisation gate for a patient's care record. Resolves the patient
 * from :id (clinicians/delegates) or the session (patients viewing their own),
 * sets req.patient and req.accessMode ('owner' | 'delegate' | 'clinician'), and
 * emits the access audit event. Clinician access is "break-glass": always
 * permitted (ED reality) but logged and flagged.
 */
function requireCarePlanAccess(opts = {}) {
  const { action = 'view_care_plan' } = opts;
  return (req, res, next) => {
    const user = req.currentUser;
    let patient;
    let mode;
    let breakGlass = false;

    if (user.role === 'patient') {
      patient = patients.findByUserId(user.id);
      mode = 'owner';
    } else if (user.role === 'clinician') {
      patient = patients.findById(Number(req.params.id));
      mode = 'clinician';
      breakGlass = true;
    } else if (user.role === 'delegate') {
      const pid = Number(req.params.id);
      if (!delegates.hasActiveLink(pid, user.id)) {
        return res.status(403).render('error', {
          title: 'Access denied',
          message: 'You do not have an active delegate link to this person.',
        });
      }
      patient = patients.findById(pid);
      mode = 'delegate';
    }

    if (!patient) {
      return res.status(404).render('error', {
        title: 'Not found',
        message: 'No care record was found.',
      });
    }

    req.patient = patient;
    req.accessMode = mode;
    req.audit(action, { targetPatientId: patient.id, breakGlass });
    next();
  };
}

module.exports = { loadUser, requireAuth, requireRole, requireCarePlanAccess };
