-- Digital Sickle Cell Care Plan — prototype schema (SYNTHETIC DATA ONLY)
-- All timestamps are ISO-8601 UTC TEXT.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Identity & access -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY,
  role           TEXT NOT NULL CHECK (role IN ('clinician', 'patient', 'delegate')),
  email          TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  password_hash  TEXT NOT NULL,
  full_name      TEXT,
  job_title      TEXT,                 -- clinicians
  organisation   TEXT,                 -- clinicians (e.g. trust)
  acknowledged_prototype INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  last_login_at  TEXT,
  is_active      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS patients (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER UNIQUE REFERENCES users(id),  -- nullable: record may exist before claim
  nhs_number    TEXT,                 -- SYNTHETIC; format-validated only
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  date_of_birth TEXT,
  scd_genotype  TEXT,                 -- e.g. HbSS, HbSC
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  postcode      TEXT,
  is_pregnant   INTEGER NOT NULL DEFAULT 0,
  pregnancy_notes TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS delegate_links (
  id               INTEGER PRIMARY KEY,
  patient_id       INTEGER NOT NULL REFERENCES patients(id),
  delegate_user_id INTEGER NOT NULL REFERENCES users(id),
  relationship     TEXT,              -- 'next of kin', 'parent', etc.
  status           TEXT NOT NULL CHECK (status IN ('pending', 'active', 'revoked')) DEFAULT 'pending',
  created_at       TEXT NOT NULL,
  revoked_at       TEXT,
  UNIQUE (patient_id, delegate_user_id)
);

-- Care plan: structured clinical fields that drive the acute crisis view -------
CREATE TABLE IF NOT EXISTS care_plans (
  id              INTEGER PRIMARY KEY,
  patient_id      INTEGER NOT NULL UNIQUE REFERENCES patients(id),
  usual_analgesia TEXT,
  opioid_tolerance TEXT,
  first_line_drug TEXT, first_line_dose TEXT, first_line_route TEXT,
  breakthrough_drug TEXT, breakthrough_dose TEXT,
  max_24h_dose    TEXT,
  drugs_to_avoid  TEXT,
  allergies       TEXT,
  adverse_reactions TEXT,
  baseline_bp     TEXT, baseline_hr TEXT, baseline_spo2 TEXT,
  baseline_temp   TEXT, baseline_resp_rate TEXT, baseline_hb TEXT,
  escalation_plan TEXT,
  named_consultant TEXT, named_consultant_contact TEXT,
  preferred_hospital TEXT,
  additional_notes TEXT,
  created_by      INTEGER REFERENCES users(id),
  last_updated_by INTEGER REFERENCES users(id),
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS care_plan_documents (
  id                INTEGER PRIMARY KEY,
  patient_id        INTEGER NOT NULL REFERENCES patients(id),
  original_filename TEXT NOT NULL,
  stored_path       TEXT NOT NULL,
  mime_type         TEXT NOT NULL,
  size_bytes        INTEGER NOT NULL,
  uploaded_by       INTEGER REFERENCES users(id),
  uploaded_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id           INTEGER PRIMARY KEY,
  patient_id   INTEGER NOT NULL REFERENCES patients(id),
  name         TEXT NOT NULL,
  relationship TEXT,
  phone        TEXT,
  priority     INTEGER NOT NULL DEFAULT 1
);

-- Research consent -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consents (
  id                      INTEGER PRIMARY KEY,
  patient_id              INTEGER NOT NULL REFERENCES patients(id),
  consent_contact_research INTEGER NOT NULL DEFAULT 0,
  consent_secondary_use   INTEGER NOT NULL DEFAULT 0,
  wording_version         TEXT NOT NULL,
  recorded_by             INTEGER REFERENCES users(id),
  recorded_at             TEXT NOT NULL
);

-- Friends & Family Test + free-text feedback for an acute episode --------------
CREATE TABLE IF NOT EXISTS feedback (
  id           INTEGER PRIMARY KEY,
  patient_id   INTEGER NOT NULL REFERENCES patients(id),
  episode_date TEXT,
  fft_rating   TEXT,                  -- 'very_good'..'very_poor' | 'dont_know' (optional)
  free_text    TEXT,
  submitted_by INTEGER REFERENCES users(id),
  submitted_at TEXT NOT NULL
);

-- Audit: who, what, when -------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id                INTEGER PRIMARY KEY,
  user_id           INTEGER REFERENCES users(id),
  user_role         TEXT,
  session_id        TEXT,
  action            TEXT NOT NULL,
  target_patient_id INTEGER,
  detail            TEXT,
  ip_address        TEXT,
  break_glass       INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL
);

-- Session duration tracking ("who logs on, when, and for how long") ------------
CREATE TABLE IF NOT EXISTS sessions_audit (
  id               INTEGER PRIMARY KEY,
  user_id          INTEGER REFERENCES users(id),
  session_id       TEXT,
  login_at         TEXT NOT NULL,
  logout_at        TEXT,
  duration_seconds INTEGER,
  login_ip         TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_patient ON audit_log(target_patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_delegate_patient ON delegate_links(patient_id);
CREATE INDEX IF NOT EXISTS idx_delegate_user ON delegate_links(delegate_user_id);
