'use strict';

const { test, before, after, describe } = require('node:test');
const assert = require('node:assert');
const { freshApp, login, postForm, csrfFrom } = require('./helpers');

describe('authentication', () => {
  let ctx;
  before(async () => { ctx = await freshApp(); });
  after(() => ctx.cleanup());

  test('clinician registration rejects a non-nhs.net email', async () => {
    const res = await postForm(ctx.agent, '/register/clinician', '/register/clinician', {
      full_name: 'Dr Test',
      email: 'test@gmail.com',
      password: 'Password123',
    });
    assert.strictEqual(res.status, 400);
    assert.match(res.text, /nhs\.net/);
  });

  test('clinician registration accepts an nhs.net email', async () => {
    const res = await postForm(ctx.agent, '/register/clinician', '/register/clinician', {
      full_name: 'Dr New',
      email: 'dr.new@nhs.net',
      password: 'Password123',
    });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/acknowledge');
  });

  test('login with correct credentials redirects to the role dashboard', async () => {
    const res = await login(ctx.agent, 'dr.adeyemi@nhs.net');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.location, '/patients');
  });

  test('login with a wrong password is rejected', async () => {
    const res = await login(ctx.agent, 'amara@example.com', 'wrong-password');
    assert.strictEqual(res.status, 401);
  });

  test('a POST without a CSRF token is forbidden', async () => {
    const res = await ctx.agent.post('/login').type('form').send({ email: 'x@y.z', password: 'p' });
    assert.strictEqual(res.status, 403);
  });
});
