# ADR 0004 — Do not redistribute third-party publications in the public repo

- Status: Accepted
- Date: 2026-06-27

## Context

The project draws on third-party publications (e.g. BMJ 2024, HSJ 2023, Telfer 2024, Tanabe
2017, the "No One's Listening" report). Copies were used locally while building, but
republishing copyrighted PDFs on a public repository / website risks infringing copyright.

## Decision

**Do not** commit third-party PDFs to the public repository (they are git-ignored). The website
**cites and links** to publications at their original sources instead. The project's own
documents — the draft MoU and the executive brief — may be hosted, as may the Observatory's own
discovery report (linked at source).

## Consequences

- The repo stays clean of copyright risk, consistent with a trustworthy, accountable project.
- Readers are routed to authoritative original sources.
- If the Observatory holds redistribution rights for any specific item, that item can be added
  back deliberately with the rights noted.
