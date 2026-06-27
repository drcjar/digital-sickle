'use strict';

const { getDb } = require('../db/connection');
const { nowIso } = require('../lib/time');
const config = require('../config');

/** Latest recorded consent for a patient (consent is versioned/append-only). */
function latestForPatient(patientId) {
  return getDb()
    .prepare('SELECT * FROM consents WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 1')
    .get(patientId);
}

function record(patientId, { consent_contact_research, consent_secondary_use }, userId) {
  getDb()
    .prepare(
      `INSERT INTO consents
        (patient_id, consent_contact_research, consent_secondary_use, wording_version, recorded_by, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      patientId,
      consent_contact_research ? 1 : 0,
      consent_secondary_use ? 1 : 0,
      config.consentWordingVersion,
      userId,
      nowIso()
    );
}

module.exports = { latestForPatient, record };
