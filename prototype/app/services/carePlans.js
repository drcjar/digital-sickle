'use strict';

const { getDb } = require('../db/connection');
const { nowIso } = require('../lib/time');

const FIELDS = [
  'usual_analgesia', 'opioid_tolerance',
  'first_line_drug', 'first_line_dose', 'first_line_route',
  'breakthrough_drug', 'breakthrough_dose', 'max_24h_dose', 'drugs_to_avoid',
  'allergies', 'adverse_reactions',
  'baseline_bp', 'baseline_hr', 'baseline_spo2', 'baseline_temp',
  'baseline_resp_rate', 'baseline_hb',
  'escalation_plan', 'named_consultant', 'named_consultant_contact',
  'preferred_hospital', 'additional_notes',
];

function getByPatientId(patientId) {
  return getDb().prepare('SELECT * FROM care_plans WHERE patient_id = ?').get(patientId);
}

/** Inserts the plan if absent, otherwise updates it and bumps the version. */
function upsert(patientId, data, userId) {
  const db = getDb();
  const existing = getByPatientId(patientId);
  const now = nowIso();
  const values = {};
  for (const f of FIELDS) values[f] = data[f] != null ? String(data[f]).trim() : null;

  if (!existing) {
    const cols = FIELDS.join(', ');
    const placeholders = FIELDS.map((f) => `@${f}`).join(', ');
    db.prepare(
      `INSERT INTO care_plans (patient_id, ${cols}, created_by, last_updated_by, version, created_at, updated_at)
       VALUES (@patient_id, ${placeholders}, @user, @user, 1, @now, @now)`
    ).run({ ...values, patient_id: patientId, user: userId, now });
  } else {
    const setClause = FIELDS.map((f) => `${f} = @${f}`).join(', ');
    db.prepare(
      `UPDATE care_plans SET ${setClause}, last_updated_by = @user,
        version = version + 1, updated_at = @now WHERE patient_id = @patient_id`
    ).run({ ...values, patient_id: patientId, user: userId, now });
  }
  return getByPatientId(patientId);
}

module.exports = { getByPatientId, upsert, FIELDS };
