'use strict';

const express = require('express');
const router = express.Router();

const { requireAuth, requireRole, requireCarePlanAccess } = require('../middleware/auth');
const patients = require('../services/patients');
const carePlans = require('../services/carePlans');
const contacts = require('../services/contacts');
const documents = require('../services/documents');
const auditLog = require('../services/auditLog');
const v = require('../lib/validators');

router.use(requireAuth, requireRole('clinician'));

// Find / list patients.
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  const results = q ? patients.search(q) : patients.all();
  res.render('clinician/find', { title: 'Find a patient', q, results });
});

// Full patient summary.
router.get('/:id', requireCarePlanAccess({ action: 'view_patient' }), (req, res) => {
  res.render('clinician/patient', {
    title: req.patient.first_name + ' ' + req.patient.last_name,
    patient: req.patient,
    plan: carePlans.getByPatientId(req.patient.id),
    documents: documents.listForPatient(req.patient.id),
    contacts: contacts.listForPatient(req.patient.id),
  });
});

// THE ACUTE CRISIS VIEW.
router.get('/:id/crisis', requireCarePlanAccess({ action: 'view_care_plan' }), (req, res) => {
  res.render('crisis', {
    title: 'Acute crisis care plan',
    patient: req.patient,
    plan: carePlans.getByPatientId(req.patient.id),
    contacts: contacts.listForPatient(req.patient.id),
    documents: documents.listForPatient(req.patient.id),
    backHref: '/patients/' + req.patient.id,
  });
});

// Edit care plan.
router.get('/:id/care-plan', requireCarePlanAccess({ action: 'view_care_plan' }), (req, res) => {
  res.render('care-plan-form', {
    title: 'Edit care plan',
    patient: req.patient,
    plan: carePlans.getByPatientId(req.patient.id) || {},
    errors: {},
    action: '/patients/' + req.patient.id + '/care-plan',
    backHref: '/patients/' + req.patient.id,
  });
});

router.post('/:id/care-plan', requireCarePlanAccess({ action: 'edit_care_plan' }), (req, res) => {
  const parsed = v.carePlan.safeParse(req.body);
  const data = parsed.success ? parsed.data : req.body;
  carePlans.upsert(req.patient.id, data, req.currentUser.id);
  res.redirect('/patients/' + req.patient.id);
});

// Access log for this patient.
router.get('/:id/access-log', requireCarePlanAccess({ action: 'view_access_log' }), (req, res) => {
  res.render('access-log', {
    title: 'Access log',
    entries: auditLog.forPatient(req.patient.id),
    patient: req.patient,
    backHref: '/patients/' + req.patient.id,
  });
});

module.exports = router;
