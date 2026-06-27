'use strict';

const { test, before, after, describe } = require('node:test');
const assert = require('node:assert');
const { freshApp, login, postForm } = require('./helpers');

describe('care plan, audit and feedback', () => {
  let ctx;
  before(async () => { ctx = await freshApp(); });
  after(() => ctx.cleanup());

  test('editing a care plan bumps the version and records the editor', async () => {
    const { getByPatientId } = require('../app/services/carePlans');
    await login(ctx.agent, 'dr.adeyemi@nhs.net');
    const before = getByPatientId(1).version;
    const res = await postForm(ctx.agent, '/patients/1/care-plan', '/patients/1/care-plan', {
      first_line_drug: 'Morphine sulfate',
      first_line_dose: '7.5 mg',
    });
    assert.strictEqual(res.status, 302);
    const after = getByPatientId(1);
    assert.strictEqual(after.version, before + 1);
    assert.strictEqual(after.last_updated_by, 1); // clinician id 1
  });

  test('viewing the crisis page writes a break-glass audit event', async () => {
    const auditLog = require('../app/services/auditLog');
    await ctx.agent.get('/patients/1/crisis');
    const events = auditLog.forPatient(1);
    const view = events.find((e) => e.action === 'view_care_plan' && e.break_glass === 1);
    assert.ok(view, 'expected a break-glass view_care_plan event');
  });

  test('logging out records a session duration', async () => {
    const auditLog = require('../app/services/auditLog');
    await ctx.agent.get('/logout');
    const sessions = auditLog.recentSessions(10);
    const ended = sessions.find((s) => s.duration_seconds !== null);
    assert.ok(ended, 'expected at least one ended session with a duration');
    assert.ok(ended.duration_seconds >= 0);
  });

  test('a patient can submit a Friends & Family Test', async () => {
    const { agent } = await freshApp();
    // Require the service AFTER freshApp so it is bound to this test's DB.
    const feedback = require('../app/services/feedback');
    await login(agent, 'amara@example.com');
    const before = feedback.listForPatient(1).length;
    const res = await postForm(agent, '/me/feedback', '/me/feedback', {
      fft_rating: 'very_good',
      free_text: 'Quick analgesia.',
    });
    assert.strictEqual(res.status, 302);
    const items = feedback.listForPatient(1);
    assert.strictEqual(items.length, before + 1);
    assert.ok(items.some((f) => f.fft_rating === 'very_good'));
  });

  test('a patient can record research consent', async () => {
    const { agent } = await freshApp();
    const consents = require('../app/services/consents');
    await login(agent, 'amara@example.com');
    const res = await postForm(agent, '/me/consent', '/me/consent', {
      consent_contact_research: 'yes',
      consent_secondary_use: 'yes',
    });
    assert.strictEqual(res.status, 302);
    const latest = consents.latestForPatient(1);
    assert.strictEqual(latest.consent_contact_research, 1);
  });
});
