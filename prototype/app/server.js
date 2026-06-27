'use strict';

const config = require('./config');
const { createApp } = require('./app');
const { seedIfEmpty } = require('./db/seed');

seedIfEmpty();
const app = createApp();

app.listen(config.port, () => {
  console.log(`\nDigital Sickle Cell Care Plan — PROTOTYPE (synthetic data only)`);
  console.log(`Running at http://localhost:${config.port}`);
  console.log(`Environment: ${config.env}\n`);
  console.log('Seeded logins (password for all: Password123):');
  console.log('  Clinician : dr.adeyemi@nhs.net');
  console.log('  Patient   : amara@example.com');
  console.log('  Delegate  : kwame@example.com (next of kin for Amara)\n');
});
