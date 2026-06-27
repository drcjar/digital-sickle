# ADR 0003 — Hash passwords with argon2id

- Status: Accepted
- Date: 2026-06-27

## Context

The prototype has genuine email/password login for patients and delegates (clinicians use an
`@nhs.net` email; production would use NHS Care Identity / CIS2 SSO). Passwords must be stored
using a modern, memory-hard hash.

## Decision

Use **argon2id** (the `argon2` package) with OWASP-recommended parameters. This is the current
OWASP/NIST default for new applications and is preferred over bcrypt's CPU-only cost.

## Consequences

- Strong password storage out of the box.
- A small `lib/password.js` wrapper isolates the choice so it can be tuned or swapped.
- Production note: real deployment should layer CIS2 SSO for clinicians and consider
  passwordless / MFA options for patients.
