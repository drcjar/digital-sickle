'use strict';

const { getDb } = require('../db/connection');
const { nowIso } = require('../lib/time');

function findById(id) {
  return getDb().prepare('SELECT * FROM patients WHERE id = ?').get(id);
}

function findByUserId(userId) {
  return getDb().prepare('SELECT * FROM patients WHERE user_id = ?').get(userId);
}

function search(term) {
  const like = `%${term.trim()}%`;
  return getDb()
    .prepare(
      `SELECT * FROM patients
       WHERE first_name LIKE ? OR last_name LIKE ? OR nhs_number LIKE ?
       ORDER BY last_name, first_name
       LIMIT 50`
    )
    .all(like, like, like);
}

function all() {
  return getDb().prepare('SELECT * FROM patients ORDER BY last_name, first_name').all();
}

function create(p) {
  const now = nowIso();
  const info = getDb()
    .prepare(
      `INSERT INTO patients
         (user_id, nhs_number, first_name, last_name, date_of_birth, scd_genotype,
          phone, email, address, postcode, is_pregnant, pregnancy_notes, created_at, updated_at)
       VALUES
         (@user_id, @nhs_number, @first_name, @last_name, @date_of_birth, @scd_genotype,
          @phone, @email, @address, @postcode, @is_pregnant, @pregnancy_notes, @created_at, @updated_at)`
    )
    .run({
      user_id: p.user_id || null,
      nhs_number: p.nhs_number || null,
      first_name: p.first_name,
      last_name: p.last_name,
      date_of_birth: p.date_of_birth || null,
      scd_genotype: p.scd_genotype || null,
      phone: p.phone || null,
      email: p.email || null,
      address: p.address || null,
      postcode: p.postcode || null,
      is_pregnant: p.is_pregnant ? 1 : 0,
      pregnancy_notes: p.pregnancy_notes || null,
      created_at: now,
      updated_at: now,
    });
  return findById(info.lastInsertRowid);
}

function updateContact(id, { phone, email, address, postcode }) {
  getDb()
    .prepare(
      `UPDATE patients SET phone = @phone, email = @email, address = @address,
        postcode = @postcode, updated_at = @updated_at WHERE id = @id`
    )
    .run({ id, phone, email, address, postcode, updated_at: nowIso() });
  return findById(id);
}

module.exports = { findById, findByUserId, search, all, create, updateContact };
