'use strict';

/** ISO-8601 UTC timestamp for "now". Centralised so tests can reason about it. */
function nowIso() {
  return new Date().toISOString();
}

module.exports = { nowIso };
