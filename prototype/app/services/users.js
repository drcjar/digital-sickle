'use strict';

const { getDb } = require('../db/connection');
const { nowIso } = require('../lib/time');

function findByEmail(email) {
  return getDb()
    .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
    .get(email.trim());
}

function findById(id) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function create({ role, email, password_hash, full_name, job_title, organisation }) {
  const info = getDb()
    .prepare(
      `INSERT INTO users (role, email, password_hash, full_name, job_title, organisation, email_verified, created_at)
       VALUES (@role, @email, @password_hash, @full_name, @job_title, @organisation, 1, @created_at)`
    )
    .run({
      role,
      email: email.trim(),
      password_hash,
      full_name: full_name || null,
      job_title: job_title || null,
      organisation: organisation || null,
      created_at: nowIso(),
    });
  return findById(info.lastInsertRowid);
}

function recordLogin(id) {
  getDb().prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(nowIso(), id);
}

function markPrototypeAcknowledged(id) {
  getDb().prepare('UPDATE users SET acknowledged_prototype = 1 WHERE id = ?').run(id);
}

module.exports = {
  findByEmail,
  findById,
  create,
  recordLogin,
  markPrototypeAcknowledged,
};
