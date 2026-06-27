# Contributing

Thank you for your interest. This project is run **in the open** by the NHS Race & Health
Observatory as an exemplar of cost-effective, end-user-focused NHS digital work.

## Ground rules

- **No real patient data, ever.** The prototype uses synthetic data only. Do not commit, paste,
  or enter real personal or patient-identifiable information anywhere in this repository or the
  running prototype.
- **Accessibility is non-negotiable.** UI work must meet WCAG 2.2 AA. Use the
  [NHS design system](https://service-manual.nhs.uk/design-system) components rather than
  hand-rolling markup, and keep pages usable without JavaScript.
- **Be respectful.** Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## How to contribute

1. Open an issue describing the change or bug before large work.
2. Fork / branch, make your change with tests where applicable.
3. Run the checks locally:
   ```bash
   cd prototype && npm test     # integration tests
   ```
4. Open a pull request. CI (lint + tests + accessibility check) must pass.

## Decisions

Significant technical decisions are recorded as
[Architecture Decision Records](docs/adr/). If you propose a change to one, add a new ADR rather
than rewriting history.

## Who decides

The Observatory leads the programme and makes final calls on scope, governance and licensing.
The appointed delivery partner will own the production build; this repository is the prototype
and the project's public home.
