'use strict';

const { test, before, after, describe } = require('node:test');
const assert = require('node:assert');
const { freshApp, login } = require('./helpers');

describe('role-based access control', () => {
  let ctx;
  before(async () => { ctx = await freshApp(); });
  after(() => ctx.cleanup());

  test('a patient cannot reach clinician-only routes', async () => {
    await login(ctx.agent, 'amara@example.com');
    assert.strictEqual((await ctx.agent.get('/patients/1')).status, 403);
    assert.strictEqual((await ctx.agent.get('/audit')).status, 403);
  });

  test('a delegate with an active link can view the linked patient', async () => {
    const agent = (await freshApp()).agent; // isolated session
    await login(agent, 'kwame@example.com');
    const res = await agent.get('/shared/1');
    assert.strictEqual(res.status, 200);
  });

  test('a delegate cannot view a patient they are not linked to', async () => {
    const agent = (await freshApp()).agent;
    await login(agent, 'kwame@example.com');
    const res = await agent.get('/shared/2');
    assert.strictEqual(res.status, 403);
  });

  test('a delegate cannot edit a care plan (read-only)', async () => {
    const agent = (await freshApp()).agent;
    await login(agent, 'kwame@example.com');
    // There is no delegate edit route; the clinician edit route rejects non-clinicians.
    const res = await agent.post('/patients/1/care-plan').type('form').send({ first_line_drug: 'X' });
    assert.ok(res.status === 403 || res.status === 302, 'delegate must not edit');
  });

  test('an unauthenticated user is redirected to sign in', async () => {
    const agent = (await freshApp()).agent;
    const res = await agent.get('/me');
    assert.strictEqual(res.status, 302);
    assert.match(res.headers.location, /\/login/);
  });
});
