# SMART on FHIR and Oracle Health Millennium: integration note

Prepared for the meeting with Homerton's Deputy CEO, CCIO and CIO, 29 July 2026,
in response to Ward Priestman's request that we research SMART and FHIR integration
into Millennium.

**Short answer: agreed, and it is the design we want.** The service should be a
provider-facing SMART on FHIR app that EHR-launches from PowerChart and FirstNet with
patient context, plus a patient-facing route outside the EPR. There is one significant
constraint in Millennium that shapes the design, set out in section 3.

## 1. What the integration actually looks like

| Layer | Approach |
| --- | --- |
| Launch | SMART on FHIR **EHR launch** from PowerChart / FirstNet, embedded in an MPage workflow component so the plan appears inside the ED workflow rather than as another system to log into |
| Identity | SSO via the SMART launch (no second login for the clinician); NHS CIS2 for any standalone clinician access; NHS login for patients |
| Read from Millennium | FHIR R4 (Oracle "Ignite APIs"): Patient, Encounter, AllergyIntolerance, MedicationRequest, Observation, Condition |
| Write to Millennium | Rendered plan as a **DocumentReference** (write-supported), plus optionally Condition / Observation / Communication. See section 3 |
| Source of truth | The care plan service. Millennium holds a rendered copy so the plan is visible in the chart, and via the HIE in the London Care Record, when the app is not open |
| Standards | FHIR R4, **UK Core** profiles (UKCore-CarePlan exists), SNOMED CT, PRSB / DAPB4022 Personalised Care and Support Plan for content structure |

UK Millennium FHIR base URL is region-specific: `https://fhir-ehr.eu.cerner.com/r4/<tenant id>`.

## 2. The provisioning path, and who does what

Oracle's model is that registration is not activation. Three gates:

1. **Oracle validates and registers the app** (required for provider-facing apps, not for
   direct-to-consumer). The delivery partner registers it in Oracle **code Console**, first
   against the sandbox, then production, producing an application ID and client ID.
2. **Homerton authorises it on its domain.** Homerton logs a Service Request to
   *Cerner Ignite APIs for Millennium* asking for that application ID and client ID to be
   provisioned against Homerton's tenant ID, supplies the FHIR URL, and completes a PECA
   form if applicable. Homerton also adds any external site dependencies to Citrix trusted
   sites, and does the SMART setup in PowerChart / FirstNet.
3. **Homerton decides which users and roles** can see it.

Technical prerequisites on our side: publicly reachable HTTPS endpoint on port 443 with an
A-grade TLS certificate, responsive UI, runs in the embedded browser (Edge WebView2), keeps
patient context. Config changes take about 15 minutes to propagate; the SR queue is the long
pole, not the code.

Steps differ slightly by hosting model, so we need to know whether Homerton is **RHO**
(Oracle-hosted) or **CHO** (customer-hosted).

## 3. The constraint worth raising in the room

**Millennium R4 supports CarePlan as read and search only.** There is no write. So we cannot
push the care plan into Millennium as a native FHIR CarePlan resource, and we should not
promise that.

What *is* write-enabled includes DocumentReference, Condition, Observation, AllergyIntolerance,
MedicationRequest, Communication, QuestionnaireResponse, Encounter, RelatedPerson.

This is not a blocker, it is a design decision, and it points the same way clinical safety does:

- The plan lives in the digital sickle service, where it is versioned, audited, co-owned with
  the patient, and portable across trusts. That matters because patients in crisis present to
  whichever hospital they can reach, not only to Homerton.
- Millennium gets a rendered, timestamped copy written as a DocumentReference, so the plan is
  in the chart and flows to the London Care Record HIE.
- Prompting the clinician (a flag or alert when a patient with a plan presents to ED) is
  Millennium-side configuration rather than a FHIR write.

**Ask Homerton for the CapabilityStatement from their tenant** (`GET <base>/metadata`). Resource
and interaction support varies by domain and code level, so that document, not the generic
Oracle docs, is what we design against.

## 4. Precedent: Homerton has already done this pattern

Homerton developed and implemented an in-context link from Cerner Millennium to the OneLondon
**Universal Care Plan**, and OneLondon holds it up as the pattern other trusts can replicate.
In-context SSO access to UCP runs via the Homerton HIE alongside NWL, NCL, Kingston, Croydon,
Lewisham and Barts.

Two things follow. First, the integration we are proposing is a variation on something Ward's
team has already delivered, which lowers the estimate and the risk. Second, UCP users accessing
it through the London Care Record via Millennium have reported significant performance problems.
A purpose-built acute view that loads fast enough to be used inside the NICE 30-minute analgesia
standard is exactly the gap. UCP itself is openEHR (Better platform) underneath, so we are
complementary to it, not competing: we interoperate, we are open source, and we cover the
majority of England where UCP does not operate.

## 5. Commercial and practical caveats to be honest about

- **Oracle's partner validation programme (OPN) is US-only.** Outside the US you work through
  the regional Customer Advocate Executive. The route for us therefore runs through Homerton's
  Oracle account contact, and we should ask who that is.
- **Fees.** Building and deploying an app does not require a paid OPN tier. Optional OPN tiers
  are advertised in the region of $500 / $3,000 / $5,000 a year. The real cost exposure is
  Oracle professional services and SR turnaround, plus trust-side configuration effort, not an
  API licence.
- **Oracle's published profiles are US Core.** UK Core conformance is our work, not Oracle's.
- **Clinical safety and IG** sit alongside this: DPIA, DSPT, DCB0129 and DCB0160, a named
  clinical safety officer, and a controller / processor split. Already in our roadmap.

## 6. What we are asking Homerton for

Deliberately small, because the build sits with the delivery partner appointed through the ITT:

1. A named technical contact in the Millennium team.
2. Tenant ID, hosting model, and confirmation that Ignite / FHIR APIs are enabled in production.
3. Sandbox or non-production domain access for the delivery partner.
4. Willingness to be the pilot site, and to raise the SRs when the time comes.
5. Integration written into the ITT as a requirement, so the partner is bought to deliver it.

Timing fits the existing roadmap: build Oct 2026 to May 2027, private beta from Jun 2027.

## 7. Questions to ask in the meeting

- RHO or CHO? Tenant ID? Are the Ignite / FHIR APIs already switched on in production, and is
  anything running on them today?
- Current Millennium code level, and any planned changes (shared instance, EPR modernisation)
  that would affect a 2027 pilot?
- Who owns PowerChart and MPage configuration, and what is their capacity?
- Preferred write-back target: which document type and folder should a DocumentReference land
  in, and does that flow to the London Care Record?
- Appetite for an ED-facing alert in FirstNet when a patient with a plan presents?
- Who is Homerton's Oracle Customer Advocate Executive?
- Would Homerton reuse the UCP in-context link work, given the performance issues reported
  with UCP over LCR?

## Sources

- Oracle, SMART Application Overview Developer's Guide: https://docs.oracle.com/en/industries/health/millennium-platform-apis/smart-developer-overview/
- Oracle, SMART Application Provisioning: https://docs.oracle.com/en/industries/health/millennium-platform-apis/smart-app-provisioning/
- Oracle, FHIR R4 APIs for Millennium (overview and capability statement): https://docs.oracle.com/en/industries/health/millennium-platform-apis/mfrap/r4_overview.html
- Oracle, DocumentReference REST endpoints: https://docs.oracle.com/en/industries/health/millennium-platform-apis/mfrap/api-documentreference.html
- Oracle Health developer program, API access and fees: https://www.oracle.com/health/developer/api/
- OneLondon UCP, London Care Record (Cerner HIE) access: https://ucp.onelondon.online/london-care-record-cerner-hie-access/
- Better, Universal Care Plan case study: https://www.better.care/case-study/universal-care-plan-making-personalised-care-a-reality/
- NHS England, FHIR UK Core: https://digital.nhs.uk/services/fhir-uk-core
- NHS England, DAPB4022 Personalised Care and Support Plan: https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dapb4022-personalised-care-and-support-plan
