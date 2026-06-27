'use strict';

const { getDb } = require('../db/connection');
const { nowIso } = require('../lib/time');

function listForPatient(patientId) {
  return getDb()
    .prepare('SELECT * FROM feedback WHERE patient_id = ? ORDER BY submitted_at DESC')
    .all(patientId);
}

function create(patientId, { episode_date, fft_rating, free_text }, userId) {
  getDb()
    .prepare(
      `INSERT INTO feedback (patient_id, episode_date, fft_rating, free_text, submitted_by, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      patientId,
      episode_date || null,
      fft_rating || null,
      free_text || null,
      userId,
      nowIso()
    );
}

module.exports = { listForPatient, create };
