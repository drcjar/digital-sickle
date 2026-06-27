'use strict';

// Seeds SYNTHETIC data only. Names, NHS numbers and clinical details are
// fictional and for demonstration purposes.

const { getDb } = require('./connection');
const { migrate } = require('./migrate');
const password = require('../lib/password');
const usersSvc = require('../services/users');
const patientsSvc = require('../services/patients');
const carePlans = require('../services/carePlans');
const contacts = require('../services/contacts');
const consents = require('../services/consents');
const delegates = require('../services/delegates');
const feedback = require('../services/feedback');

const DEFAULT_PASSWORD = 'Password123';

async function seed() {
  migrate();
  const db = getDb();
  const hash = await password.hash(DEFAULT_PASSWORD);

  // Clinician (must use nhs.net).
  const clinician = usersSvc.create({
    role: 'clinician',
    email: 'dr.adeyemi@nhs.net',
    password_hash: hash,
    full_name: 'Dr Funmi Adeyemi',
    job_title: 'Consultant Haematologist',
    organisation: 'University Hospitals Bristol and Weston NHS Foundation Trust',
  });
  usersSvc.markPrototypeAcknowledged(clinician.id);

  // Patient with an account.
  const patientUser = usersSvc.create({
    role: 'patient',
    email: 'amara@example.com',
    password_hash: hash,
    full_name: 'Amara Okafor',
  });
  usersSvc.markPrototypeAcknowledged(patientUser.id);

  const amara = patientsSvc.create({
    user_id: patientUser.id,
    nhs_number: '9990000001',
    first_name: 'Amara',
    last_name: 'Okafor',
    date_of_birth: '1994-03-12',
    scd_genotype: 'HbSS',
    phone: '07700 900111',
    email: 'amara@example.com',
    address: '14 Fictional Road, Bristol',
    postcode: 'BS1 0AA',
    is_pregnant: 0,
  });

  carePlans.upsert(
    amara.id,
    {
      usual_analgesia: 'Long-term oral morphine (MST) 30mg BD at home.',
      opioid_tolerance: 'High — chronic opioid use; requires higher breakthrough doses.',
      first_line_drug: 'Morphine sulfate',
      first_line_dose: '10 mg',
      first_line_route: 'IV (titrate to effect)',
      breakthrough_drug: 'Oramorph (oral morphine)',
      breakthrough_dose: '20 mg PO',
      max_24h_dose: 'Discuss with haematology if exceeding 120 mg IV morphine equivalent / 24h',
      drugs_to_avoid: 'Pethidine (seizure risk). Avoid delays — analgesia within 30 minutes.',
      allergies: 'Penicillin (rash).',
      adverse_reactions: 'Pruritus with codeine.',
      baseline_bp: '118/74',
      baseline_hr: '88',
      baseline_spo2: '97% on air',
      baseline_temp: '36.7',
      baseline_resp_rate: '16',
      baseline_hb: '78 g/L (chronic baseline)',
      escalation_plan:
        'If pain not controlled within 30 min or SpO2 < 94%, escalate to haematology SpR on-call and consider acute chest syndrome.',
      named_consultant: 'Dr Funmi Adeyemi (Consultant Haematologist)',
      named_consultant_contact: 'Haematology SpR bleep 1234 / switchboard',
      preferred_hospital: 'University Hospitals Bristol and Weston',
      additional_notes:
        'Previous acute chest syndrome (2023). Prefers to be involved in decisions and has found re-narrating history during crises distressing.',
    },
    clinician.id
  );

  contacts.add(amara.id, { name: 'Kwame Okafor', relationship: 'Brother (next of kin)', phone: '07700 900222', priority: 1 });

  consents.record(amara.id, { consent_contact_research: 1, consent_secondary_use: 1 }, patientUser.id);

  feedback.create(
    amara.id,
    {
      episode_date: '2026-05-02',
      fft_rating: 'good',
      free_text:
        'Care plan meant I did not have to explain my history while in severe pain. Analgesia was faster than my last admission.',
    },
    patientUser.id
  );

  // Delegate (next of kin) linked to Amara.
  const delegateUser = usersSvc.create({
    role: 'delegate',
    email: 'kwame@example.com',
    password_hash: hash,
    full_name: 'Kwame Okafor',
  });
  usersSvc.markPrototypeAcknowledged(delegateUser.id);
  delegates.invite(amara.id, delegateUser.id, 'Brother (next of kin)');

  // A second patient with no account yet (clinician-managed), to demonstrate search.
  const tunde = patientsSvc.create({
    nhs_number: '9990000002',
    first_name: 'Tunde',
    last_name: 'Bello',
    date_of_birth: '1988-11-30',
    scd_genotype: 'HbSC',
    is_pregnant: 0,
  });
  carePlans.upsert(
    tunde.id,
    {
      first_line_drug: 'Morphine sulfate',
      first_line_dose: '5 mg',
      first_line_route: 'IV',
      opioid_tolerance: 'Opioid-naive — start low and titrate.',
      allergies: 'None known.',
      baseline_spo2: '98% on air',
      named_consultant: 'Dr Funmi Adeyemi',
      preferred_hospital: 'University Hospitals Bristol and Weston',
    },
    clinician.id
  );

  return { clinician, patientUser, amara, delegateUser, tunde };
}

/** Seeds only if the database has no users yet (safe to call on every start). */
function seedIfEmpty() {
  migrate();
  const row = getDb().prepare('SELECT COUNT(*) AS n FROM users').get();
  if (row.n === 0) {
    return seed();
  }
  return null;
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed complete. Default password for all accounts: ' + DEFAULT_PASSWORD);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seed, seedIfEmpty, DEFAULT_PASSWORD };
