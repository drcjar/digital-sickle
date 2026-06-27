'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const request = require('supertest');

/**
 * Builds a fresh app instance backed by a temp SQLite DB and seed data.
 * Returns { app, agent, cleanup }. `agent` persists cookies across requests.
 */
async function freshApp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dscp-test-'));
  process.env.DB_PATH = path.join(dir, 'test.db');
  process.env.UPLOADS_DIR = path.join(dir, 'uploads');
  process.env.NODE_ENV = 'test';

  // Reset cached singletons so each test gets its own DB.
  for (const key of Object.keys(require.cache)) {
    if (key.includes(path.join('prototype', 'app'))) delete require.cache[key];
  }

  const { createApp } = require('../app/app');
  const { seed } = require('../app/db/seed');
  await seed();
  const app = createApp();

  return {
    app,
    agent: request.agent(app),
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

/** Extracts the CSRF token from a rendered form. */
function csrfFrom(html) {
  const m = html.match(/name="_csrf" value="([^"]+)"/);
  return m ? m[1] : null;
}

/** Logs in via the real form flow so cookies + CSRF are exercised end to end. */
async function login(agent, email, password = 'Password123') {
  const page = await agent.get('/login');
  const token = csrfFrom(page.text);
  return agent
    .post('/login')
    .type('form')
    .send({ _csrf: token, email, password });
}

/** Helper to POST a form with a freshly fetched CSRF token from `getUrl`. */
async function postForm(agent, getUrl, postUrl, body) {
  const page = await agent.get(getUrl);
  const token = csrfFrom(page.text);
  return agent.post(postUrl).type('form').send({ _csrf: token, ...body });
}

module.exports = { freshApp, csrfFrom, login, postForm };
