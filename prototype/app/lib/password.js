'use strict';

const argon2 = require('argon2');

// OWASP-recommended argon2id parameters (see docs/adr/0003).
const options = {
  type: argon2.argon2id,
  memoryCost: 19456, // KiB
  timeCost: 2,
  parallelism: 1,
};

async function hash(plain) {
  return argon2.hash(plain, options);
}

async function verify(stored, plain) {
  try {
    return await argon2.verify(stored, plain);
  } catch {
    return false;
  }
}

module.exports = { hash, verify };
