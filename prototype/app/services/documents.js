'use strict';

const { getDb } = require('../db/connection');
const { nowIso } = require('../lib/time');

function listForPatient(patientId) {
  return getDb()
    .prepare('SELECT * FROM care_plan_documents WHERE patient_id = ? ORDER BY uploaded_at DESC')
    .all(patientId);
}

function findById(id) {
  return getDb().prepare('SELECT * FROM care_plan_documents WHERE id = ?').get(id);
}

function create({ patient_id, original_filename, stored_path, mime_type, size_bytes, uploaded_by }) {
  const info = getDb()
    .prepare(
      `INSERT INTO care_plan_documents
        (patient_id, original_filename, stored_path, mime_type, size_bytes, uploaded_by, uploaded_at)
       VALUES (@patient_id, @original_filename, @stored_path, @mime_type, @size_bytes, @uploaded_by, @uploaded_at)`
    )
    .run({
      patient_id,
      original_filename,
      stored_path,
      mime_type,
      size_bytes,
      uploaded_by,
      uploaded_at: nowIso(),
    });
  return findById(info.lastInsertRowid);
}

module.exports = { listForPatient, findById, create };
