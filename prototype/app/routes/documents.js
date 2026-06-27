'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const router = express.Router();

const config = require('../config');
const { requireAuth } = require('../middleware/auth');
const patients = require('../services/patients');
const documents = require('../services/documents');
const delegates = require('../services/delegates');

fs.mkdirSync(config.uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadsDir),
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + '.pdf'),
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    const err = new Error('Only PDF files can be uploaded.');
    err.statusCode = 400;
    err.publicMessage = 'Only PDF files can be uploaded.';
    cb(err);
  },
});

/** Resolves which patient the current user may upload to / download from. */
function canAccessPatient(user, patientId) {
  if (user.role === 'clinician') return true;
  if (user.role === 'patient') {
    const own = patients.findByUserId(user.id);
    return own && own.id === patientId;
  }
  if (user.role === 'delegate') return delegates.hasActiveLink(patientId, user.id);
  return false;
}

// Patient uploads to their own record.
router.post('/me/documents', requireAuth, upload.single('document'), (req, res) => {
  const patient = patients.findByUserId(req.currentUser.id);
  if (!patient || !req.file) return res.redirect('/me');
  storeDoc(req, patient.id);
  res.redirect('/me');
});

// Clinician uploads to a patient record.
router.post('/patients/:id/documents', requireAuth, upload.single('document'), (req, res) => {
  const patientId = Number(req.params.id);
  if (req.currentUser.role !== 'clinician' || !req.file) return res.status(403).end();
  storeDoc(req, patientId);
  res.redirect('/patients/' + patientId);
});

function storeDoc(req, patientId) {
  documents.create({
    patient_id: patientId,
    original_filename: req.file.originalname,
    stored_path: req.file.filename,
    mime_type: req.file.mimetype,
    size_bytes: req.file.size,
    uploaded_by: req.currentUser.id,
  });
  req.audit('upload_document', { targetPatientId: patientId, breakGlass: req.currentUser.role === 'clinician' });
}

// Download a document (access-checked).
router.get('/documents/:docId', requireAuth, (req, res) => {
  const doc = documents.findById(Number(req.params.docId));
  if (!doc) return res.status(404).render('error', { title: 'Not found', message: 'Document not found.' });
  if (!canAccessPatient(req.currentUser, doc.patient_id)) {
    return res.status(403).render('error', { title: 'Access denied', message: 'You cannot view this document.' });
  }
  req.audit('view_document', {
    targetPatientId: doc.patient_id,
    breakGlass: req.currentUser.role === 'clinician',
    detail: { document: doc.original_filename },
  });
  res.sendFile(path.join(config.uploadsDir, doc.stored_path), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="' + doc.original_filename.replace(/"/g, '') + '"' },
  });
});

module.exports = router;
