'use strict';

const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middleware/auth');
const patients = require('../services/patients');
const carePlans = require('../services/carePlans');
const contacts = require('../services/contacts');
const consents = require('../services/consents');
const feedbackSvc = require('../services/feedback');
const documents = require('../services/documents');
const delegates = require('../services/delegates');
const usersSvc = require('../services/users');
const auditLog = require('../services/auditLog');
const v = require('../lib/validators');

router.use(requireAuth, requireRole('patient'));

// Resolve the logged-in patient's own record for every route here.
router.use((req, res, next) => {
  req.patient = patients.findByUserId(req.currentUser.id);
  if (!req.patient) {
    return res.status(404).render('error', {
      title: 'No patient record',
      message: 'No patient record is linked to your account.',
    });
  }
  next();
});

// Dashboard.
router.get('/', (req, res) => {
  req.audit('view_care_plan', { targetPatientId: req.patient.id });
  res.render('patient/dashboard', {
    title: 'My care plan',
    patient: req.patient,
    plan: carePlans.getByPatientId(req.patient.id),
    documents: documents.listForPatient(req.patient.id),
    consent: consents.latestForPatient(req.patient.id),
    contacts: contacts.listForPatient(req.patient.id),
  });
});

// Edit care plan.
router.get('/care-plan', (req, res) => {
  res.render('care-plan-form', {
    title: 'Edit my care plan',
    patient: req.patient,
    plan: carePlans.getByPatientId(req.patient.id) || {},
    errors: {},
    action: '/me/care-plan',
    backHref: '/me',
  });
});

router.post('/care-plan', (req, res) => {
  const parsed = v.carePlan.safeParse(req.body);
  const data = parsed.success ? parsed.data : req.body;
  carePlans.upsert(req.patient.id, data, req.currentUser.id);
  req.audit('edit_care_plan', { targetPatientId: req.patient.id });
  res.redirect('/me');
});

// Contact details.
router.post('/contact', (req, res) => {
  patients.updateContact(req.patient.id, req.body);
  req.audit('edit_contact_details', { targetPatientId: req.patient.id });
  res.redirect('/me');
});

// Research consent.
router.get('/consent', (req, res) => {
  res.render('patient/consent', {
    title: 'Research consent',
    consent: consents.latestForPatient(req.patient.id),
  });
});

router.post('/consent', (req, res) => {
  consents.record(
    req.patient.id,
    {
      consent_contact_research: req.body.consent_contact_research === 'yes',
      consent_secondary_use: req.body.consent_secondary_use === 'yes',
    },
    req.currentUser.id
  );
  req.audit('update_consent', { targetPatientId: req.patient.id });
  res.redirect('/me');
});

// Friends & Family Test + free-text feedback.
router.get('/feedback', (req, res) => {
  res.render('patient/feedback', {
    title: 'Give feedback on an episode',
    history: feedbackSvc.listForPatient(req.patient.id),
    values: {},
    errors: {},
  });
});

router.post('/feedback', (req, res) => {
  const parsed = v.feedback.safeParse(req.body);
  const data = parsed.success ? parsed.data : req.body;
  feedbackSvc.create(req.patient.id, data, req.currentUser.id);
  req.audit('submit_feedback', { targetPatientId: req.patient.id });
  res.redirect('/me/feedback');
});

// Delegates (invite / revoke).
router.get('/delegates', (req, res) => {
  res.render('patient/delegates', {
    title: 'People who can see my plan',
    links: delegates.linksForPatient(req.patient.id),
    error: null,
  });
});

router.post('/delegates', (req, res) => {
  const delegateUser = usersSvc.findByEmail(req.body.email || '');
  if (!delegateUser || delegateUser.role !== 'delegate') {
    return res.status(400).render('patient/delegates', {
      title: 'People who can see my plan',
      links: delegates.linksForPatient(req.patient.id),
      error: 'No delegate account was found with that email. The person must first create a delegate account.',
    });
  }
  delegates.invite(req.patient.id, delegateUser.id, req.body.relationship);
  req.audit('grant_delegate', { targetPatientId: req.patient.id, detail: { delegate: delegateUser.email } });
  res.redirect('/me/delegates');
});

router.post('/delegates/:linkId/revoke', (req, res) => {
  delegates.revoke(Number(req.params.linkId), req.patient.id);
  req.audit('revoke_delegate', { targetPatientId: req.patient.id });
  res.redirect('/me/delegates');
});

// Patient-facing access log — who has viewed/edited my plan.
router.get('/access-log', (req, res) => {
  res.render('access-log', {
    title: 'Who has accessed my care plan',
    entries: auditLog.forPatient(req.patient.id),
    patient: req.patient,
    backHref: '/me',
  });
});

module.exports = router;
