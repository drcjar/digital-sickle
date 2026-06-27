# Digital Sickle Cell Care Plan

> An NHS Race & Health Observatory project: a personalised digital care plan for people with
> sickle cell disease, for use during **acute painful crises**, to improve access to timely
> analgesia and to make care more **accessible, trustworthy and accountable**.

This repository is developed **in the open** as an exemplar of a cost-effective NHS digital
project focused on end-user needs. It contains two things:

| Folder | What it is | Where it runs |
|--------|------------|---------------|
| [`website/`](website/) | The **project website** — the case, the evidence, governance, and how to get involved / tender | Static site → **GitHub Pages** |
| [`prototype/`](prototype/) | A **functional prototype** of the care plan service (three roles, care plan, acute crisis view, audit) | Node app → run locally |

> [!WARNING]
> **The prototype is a non-production demonstrator running on synthetic data.**
> It is **not a medical device** and must **not** be used with real patient information.
> The real, secure, cloud-hosted, information-governance-assured service is what the
> appointed **delivery partner** will build following the tender.

## Why this exists

Sickle cell patients do not reliably receive timely analgesia during acute painful episodes in
the NHS and too often experience poor care. The Observatory's 2022–23 research with University
Hospitals Bristol and Weston showed that **personalised digital care plans** show promise for
improving access to, experience of, and accountability of care — but have not been widely
tested or adopted. This project commissions the build of that service. See the
[discovery report](https://www.nhsrho.org/publications/sickle-cell-digital-discovery-report/)
and the [website](website/) for the full case.

## Quick start — run the prototype locally

Requires Node.js 22+.

```bash
cd prototype
npm install
npm start
# open http://localhost:3000
```

This migrates and seeds a local SQLite database with **synthetic** clinicians, patients and
delegates. Seeded logins are printed on start-up and listed in [`prototype/README.md`](prototype/README.md).

## Preview the website locally

```bash
cd website
npm install
npm start   # serves the site with live reload
```

## How the project is governed

The **NHS Race & Health Observatory** leads the programme and retains overall strategic control.
Delivery is via a Memorandum of Understanding between the Observatory (NHS Confederation) and an
NHS acute trust (the draft is in [`MoU/`](MoU/)), and an invitation to tender to a digital
delivery agency. A programme board including patient representatives provides governance. See
the [Governance page](website/) and the [executive brief](executive-brief/).

## Licence

Per the MoU (clause 12), intellectual property created in this project is intended to be
**fundamentally public domain to maximise adoption** for the benefit of patients and the NHS.

- **Code** is licensed under the [MIT Licence](LICENCE).
- **Content/documentation** is intended for open re-use (e.g. Open Government Licence / CC-BY).

> The final licensing decision rests with the Observatory as the lead organisation and IP
> holder; the choices above are recommendations pending confirmation.

## Contributing

We work in the open. See [CONTRIBUTING.md](CONTRIBUTING.md) and our
[architecture decision records](docs/adr/). Issues and pull requests are welcome.
