'use strict';

const express = require('express');
const router = express.Router();

const { requireAuth, requireRole, requireCarePlanAccess } = require('../middleware/auth');
const delegates = require('../services/delegates');
const carePlans = require('../services/carePlans');
const contacts = require('../services/contacts');
const documents = require('../services/documents');

router.use(requireAuth, requireRole('delegate'));

// Patients who have granted this delegate access.
router.get('/', (req, res) => {
  res.render('delegate/list', {
    title: 'Shared with me',
    patients: delegates.activePatientsForDelegate(req.currentUser.id),
  });
});

// Read-only care plan.
router.get('/:id', requireCarePlanAccess({ action: 'view_patient' }), (req, res) => {
  res.render('delegate/patient', {
    title: req.patient.first_name + ' ' + req.patient.last_name,
    patient: req.patient,
    plan: carePlans.getByPatientId(req.patient.id),
    contacts: contacts.listForPatient(req.patient.id),
    documents: documents.listForPatient(req.patient.id),
  });
});

// Read-only crisis view.
router.get('/:id/crisis', requireCarePlanAccess({ action: 'view_care_plan' }), (req, res) => {
  res.render('crisis', {
    title: 'Acute crisis care plan',
    patient: req.patient,
    plan: carePlans.getByPatientId(req.patient.id),
    contacts: contacts.listForPatient(req.patient.id),
    documents: documents.listForPatient(req.patient.id),
    backHref: '/shared/' + req.patient.id,
  });
});

module.exports = router;
