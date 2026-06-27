'use strict';

const { getDb } = require('../db/connection');

function listForPatient(patientId) {
  return getDb()
    .prepare('SELECT * FROM emergency_contacts WHERE patient_id = ? ORDER BY priority, id')
    .all(patientId);
}

function add(patientId, { name, relationship, phone, priority }) {
  getDb()
    .prepare(
      `INSERT INTO emergency_contacts (patient_id, name, relationship, phone, priority)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(patientId, name, relationship || null, phone || null, Number(priority) || 1);
}

function remove(id, patientId) {
  getDb().prepare('DELETE FROM emergency_contacts WHERE id = ? AND patient_id = ?').run(id, patientId);
}

module.exports = { listForPatient, add, remove };
