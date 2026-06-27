# ADR 0002 — Use SQLite (better-sqlite3) for the prototype datastore

- Status: Accepted
- Date: 2026-06-27

## Context

The prototype needs a relational store for users, patients, care plans, consents, feedback and
audit logs. It must run with **one command** and **no external services**, and be transparent
for a delivery partner to read.

## Decision

Use **`better-sqlite3`** with **plain SQL** (no ORM). A single file (`data/app.db`) holds
everything, including the session store. Schema lives in `app/db/schema.sql`.

## Consequences

- Zero-setup local run; the whole datastore is one inspectable file.
- Synchronous prepared statements are simple, fast, and injection-safe.
- Production would migrate to a managed relational database (e.g. PostgreSQL on an
  NHS-approved cloud); the plain-SQL services layer keeps that migration straightforward.
