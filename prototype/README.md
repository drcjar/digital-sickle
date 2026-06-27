# Prototype — Digital Sickle Cell Care Plan

> [!WARNING]
> **Synthetic data only. Not a medical device. Do not enter real patient information.**

A functional prototype of a personalised digital sickle cell care plan, built with
**Express + Nunjucks + the NHS design system (nhsuk-frontend)** and **SQLite**. See
[`../docs/adr/`](../docs/adr/) for the key technical decisions.

## Run it

```bash
npm install
npm start          # migrates + seeds (if empty) + serves on http://localhost:3000
npm run dev        # same, with auto-reload
```

## Seeded logins

Default password for all seeded accounts: **`Password123`**

| Role | Email | Notes |
|------|-------|-------|
| Clinician | `dr.adeyemi@nhs.net` | Must be an `nhs.net` address |
| Patient | `amara@example.com` | Has a full example care plan |
| Delegate | `kwame@example.com` | Next of kin for Amara (read-only) |

## What to try

- **Clinician** → *Find a patient* → open the **acute crisis view** (the centrepiece). Edit the
  care plan and see the version bump. Open *Audit* for session durations and the action log.
- **Patient** → edit your care plan, set research consent, submit a Friends & Family Test, manage
  delegates, and view **who has accessed my care plan**.
- **Delegate** → see only the patient who shared their plan with you (read-only). Revoke the link
  as the patient and confirm access is removed.

## How it satisfies the requirements

| Requirement | Where |
|-------------|-------|
| Secure login, 3 roles (nhs.net / email+password / delegate) | `app/routes/auth.js`, `app/middleware/auth.js` |
| Upload & view care plan (structured + PDF) | `app/routes/documents.js`, `care-plan-form.njk`, `crisis.njk` |
| Research consent capture | `app/services/consents.js`, `patient/consent.njk` |
| Audit: who/when/how long | `app/services/auditLog.js` (`sessions_audit`), `audit/report.njk` |
| FFT + free-text feedback | `app/services/feedback.js`, `patient/feedback.njk` |
| Accountability & trust | patient-facing access log, plan versioning, break-glass flagging |

## Tests

```bash
npm test           # node --test integration suite
```

## Configuration

Copy `.env.example` to `.env` to override defaults (port, secrets, DB path). The SQLite database
and uploads are created under `data/` (git-ignored).
