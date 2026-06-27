'use strict';

const { getDb } = require('../db/connection');
const { nowIso } = require('../lib/time');

/** Patients a delegate user currently has ACTIVE access to. */
function activePatientsForDelegate(delegateUserId) {
  return getDb()
    .prepare(
      `SELECT p.*, dl.relationship FROM patients p
       JOIN delegate_links dl ON dl.patient_id = p.id
       WHERE dl.delegate_user_id = ? AND dl.status = 'active'
       ORDER BY p.last_name, p.first_name`
    )
    .all(delegateUserId);
}

function linksForPatient(patientId) {
  return getDb()
    .prepare(
      `SELECT dl.*, u.full_name AS delegate_name, u.email AS delegate_email
       FROM delegate_links dl JOIN users u ON u.id = dl.delegate_user_id
       WHERE dl.patient_id = ? ORDER BY dl.created_at DESC`
    )
    .all(patientId);
}

function hasActiveLink(patientId, delegateUserId) {
  const row = getDb()
    .prepare(
      `SELECT 1 FROM delegate_links
       WHERE patient_id = ? AND delegate_user_id = ? AND status = 'active'`
    )
    .get(patientId, delegateUserId);
  return Boolean(row);
}

function invite(patientId, delegateUserId, relationship) {
  getDb()
    .prepare(
      `INSERT INTO delegate_links (patient_id, delegate_user_id, relationship, status, created_at)
       VALUES (?, ?, ?, 'active', ?)
       ON CONFLICT(patient_id, delegate_user_id)
       DO UPDATE SET status = 'active', relationship = excluded.relationship, revoked_at = NULL`
    )
    .run(patientId, delegateUserId, relationship || null, nowIso());
}

function revoke(linkId, patientId) {
  getDb()
    .prepare(
      `UPDATE delegate_links SET status = 'revoked', revoked_at = ?
       WHERE id = ? AND patient_id = ?`
    )
    .run(nowIso(), linkId, patientId);
}

module.exports = {
  activePatientsForDelegate,
  linksForPatient,
  hasActiveLink,
  invite,
  revoke,
};
