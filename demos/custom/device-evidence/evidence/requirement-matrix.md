# Requirement → test → run → result

Ticket: Validate BP + ECG summary ingest for Acme Cardio patch v2.
Synthetic data only. Generator seed `20251104` (`acme-cardio-v2-20251104`).

| ID | Requirement | Test | Run | Result |
| --- | --- | --- | --- | --- |
| R1 | 20 synthetic Patients, 20 Devices each referencing a DeviceDefinition, BP panels, and ECG Observations with `component` + `valueSampledData` | `src/generate.test.ts` creates 20 patients, 20 devices with definitions, BP panels, and ECG summaries | `npx vitest run --coverage` | **PASS** — 20 / 20 / 1 DeviceDefinition / 20 BP / 20 ECG. All tagged synthetic. |
| R2 | Fixed generator seed and committed bundle | `is deterministic for the fixed seed`; `committed bundle matches the fixed-seed generator` | same | **PASS** — seed `20251104`; `data/acme-cardio-bundle.json` matches the generator. |
| R3 | Manifest lists every resource id, seed, and counts | `manifest.json` written by `src/write-data.ts` | `npx tsx src/write-data.ts` | **PASS** — 82 resources: Organization 1, DeviceDefinition 1, Patient 20, Device 20, Observation 40. |
| R4 | MockClient ingest of the bundle | `src/ecg-summary-parser.test.ts` loads the synthetic bundle; `src/foomedical-vitals.test.tsx` MockClient ingest | same | **PASS** — `executeBatch` returns 82 × HTTP 200; Observation `code` and `patient` search return the cohort. |
| R5 | ECG summary parser reads components and SampledData | `loads the synthetic bundle and parses every ECG observation`; SampledData token tests | same | **PASS** — 20/20 ECG summaries parse heart rate, PR/QRS/QT, interpretation, and 250 samples. |
| R6 | Foo Medical Vitals displays ingested BP and ECG | `Foo Medical Vitals table renders ingested BP and ECG rows` | same | **PASS** — table shows Blood pressure panel and EKG study for Patient 01. |
| R7 | PatientSummary Vitals reads systolic / diastolic from the BP panel | `PatientSummary Vitals reads systolic and diastolic from the ingested panel` | same | **PASS** — BP Sys 136 mm[Hg], BP Dias 89 mm[Hg] for Patient 01. |
| R8 | Foo Medical formats ECG waveform values | observed via `formatObservationValue` on ECG rows | same | **GAP** — `formatObservationValue` prints component quantities (`/min`, `ms`) and ignores `valueSampledData`. |
| R9 | PatientSummary / Foo Medical heart-rate page shows ECG-derived HR | PatientSummary HR row in the same render | same | **GAP** — HR is an ECG component (`8867-4` on Observation `11524-6`), not a standalone vital. The HR row stays empty. |

## Run summary

| Metric | Value |
| --- | --- |
| Test files | 3 passed |
| Tests | 11 passed, 0 failed |
| Statements | 88.88% (96/108) |
| Branches | 81.25% (52/64) |
| Functions | 96.87% (31/32) |
| Lines | 88.11% (89/101) |
| Log | `evidence/vitest.log` |
| Coverage | `evidence/coverage/` |
| Screenshots | `evidence/screenshots/` |
