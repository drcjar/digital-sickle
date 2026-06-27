'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { getDb } = require('./connection');

/** Applies schema.sql (idempotent — uses CREATE TABLE IF NOT EXISTS). */
function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  getDb().exec(schema);
}

if (require.main === module) {
  migrate();
  console.log('Migration complete.');
}

module.exports = { migrate };
