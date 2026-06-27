'use strict';

const { getDb } = require('../db/connection');
const { nowIso } = require('../lib/time');

/**
 * Records an audit event. `detail` may be an object (stored as JSON).
 */
function record({ userId, userRole, sessionId, action, targetPatientId, detail, ip, breakGlass }) {
  getDb()
    .prepare(
      `INSERT INTO audit_log
        (user_id, user_role, session_id, action, target_patient_id, detail, ip_address, break_glass, created_at)
       VALUES (@user_id, @user_role, @session_id, @action, @target_patient_id, @detail, @ip_address, @break_glass, @created_at)`
    )
    .run({
      user_id: userId || null,
      user_role: userRole || null,
      session_id: sessionId || null,
      action,
      target_patient_id: targetPatientId || null,
      detail: detail ? JSON.stringify(detail) : null,
      ip_address: ip || null,
      break_glass: breakGlass ? 1 : 0,
      created_at: nowIso(),
    });
}

/** Access events visible to a patient: who viewed/edited their plan. */
function forPatient(patientId) {
  return getDb()
    .prepare(
      `SELECT a.*, u.full_name, u.organisation FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.target_patient_id = ?
       ORDER BY a.created_at DESC LIMIT 200`
    )
    .all(patientId);
}

/** Global audit feed for the governance report. */
function recent(limit = 200) {
  return getDb()
    .prepare(
      `SELECT a.*, u.full_name, u.organisation FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC LIMIT ?`
    )
    .all(limit);
}

// --- Session duration tracking ("who logs on, when, and for how long") --------

function startSession({ userId, sessionId, ip }) {
  getDb()
    .prepare(
      `INSERT INTO sessions_audit (user_id, session_id, login_at, login_ip)
       VALUES (?, ?, ?, ?)`
    )
    .run(userId, sessionId, nowIso(), ip || null);
}

function endSession(sessionId) {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM sessions_audit WHERE session_id = ? AND logout_at IS NULL ORDER BY id DESC LIMIT 1')
    .get(sessionId);
  if (!row) return;
  const logoutAt = nowIso();
  const durationSeconds = Math.round(
    (new Date(logoutAt).getTime() - new Date(row.login_at).getTime()) / 1000
  );
  db.prepare('UPDATE sessions_audit SET logout_at = ?, duration_seconds = ? WHERE id = ?').run(
    logoutAt,
    durationSeconds,
    row.id
  );
}

function recentSessions(limit = 100) {
  return getDb()
    .prepare(
      `SELECT s.*, u.full_name, u.role FROM sessions_audit s
       LEFT JOIN users u ON u.id = s.user_id
       ORDER BY s.login_at DESC LIMIT ?`
    )
    .all(limit);
}

module.exports = {
  record,
  forPatient,
  recent,
  startSession,
  endSession,
  recentSessions,
};
