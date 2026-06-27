# ADR 0001 — Build a custom Express app, not the NHS Prototype Kit

- Status: Accepted
- Date: 2026-06-27

## Context

We need a **functional** prototype: real session auth, role-based access for three roles, a
relational data model, file uploads, and tamper-evident audit logging. The
[NHS Prototype Kit](https://github.com/nhsuk/nhsuk-prototype-kit) is purpose-built for
*throwaway, clickable, user-research* prototypes — its data store is session-only, it has no
database, no real authentication, and auto-routes from template names.

## Decision

Build a custom **Express + Nunjucks** application that depends directly on `nhsuk-frontend`
(the same dependency the Prototype Kit uses), so we keep the full NHS look-and-feel while
having a genuine backend.

## Consequences

- We get real persistence (SQLite), real auth/RBAC, and first-class audit logging.
- The codebase is the honest, conventional shape a delivery agency (e.g. Softwire, dxw) would
  expect to inherit — plain Express + the design system, mirroring GOV.UK practice.
- We own a little more wiring (asset pipeline, session store) than the kit gives for free; this
  is documented and minimal.
