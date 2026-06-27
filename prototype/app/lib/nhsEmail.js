'use strict';

// Clinicians must authenticate with an nhs.net email in the prototype.
// Production would integrate NHS Care Identity (CIS2) SSO instead (see docs/adr/0003).
const NHS_NET = /^[^@\s]+@nhs\.net$/i;

function isNhsNet(email) {
  return typeof email === 'string' && NHS_NET.test(email.trim());
}

// Format-only validation of a (synthetic) NHS number: 10 digits.
// We deliberately do NOT validate the Modulus-11 check digit, to discourage
// entry of real NHS numbers in this synthetic-data prototype.
function isSyntheticNhsNumberFormat(value) {
  return typeof value === 'string' && /^\d{10}$/.test(value.replace(/\s/g, ''));
}

module.exports = { isNhsNet, isSyntheticNhsNumberFormat };
