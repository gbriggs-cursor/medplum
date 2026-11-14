Requirement: REQ-001: Medplum ingests and displays Acme Cardio patch v2 blood-pressure panels and ECG summaries.
Change: demos/device-evidence/run/ — seeded synthetic cohort generator (src/cohort.ts, src/generate.ts) with data/acme-cardio-patch-v2.bundle.json and manifest.json, ECG summary parser (src/ecg.ts), MockClient loader (src/load.ts), Vitest tests and config; .prettierignore skips the generated bundle and evidence.
Test: cd demos/device-evidence/run && npx vitest run --coverage --reporter=verbose
Result: pass (7 passed, 0 failed)
Synthetic: true
Commit: f08510acaf8741e28d43be76788944839b2dd849

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| REQ-001: The synthetic cohort (seed 20261104) regenerates byte-for-byte into the committed bundle and manifest.json. | regenerating from the seed reproduces the committed bundle and manifest | cd demos/device-evidence/run && npx vitest run --coverage --reporter=verbose, 2026-11-14 | pass |
| REQ-001: manifest.json lists every resource id and the counts (20 Patients, 20 DeviceDefinitions, 20 Devices, 40 Observations), and every resource is valid FHIR R4 and tagged synthetic and HTEST. | manifest lists every resource id with counts; every resource is valid R4 and tagged synthetic and HTEST | cd demos/device-evidence/run && npx vitest run --coverage --reporter=verbose, 2026-11-14 | pass |
| REQ-001: Medplum ingests the Acme Cardio patch v2 bundle through MockClient with each patient, Device, DeviceDefinition, blood-pressure panel, and ECG linked. | MockClient ingests the bundle and links patient, device, definition, BP panel, and ECG | cd demos/device-evidence/run && npx vitest run --coverage --reporter=verbose, 2026-11-14 | pass |
| REQ-001: The ECG summary parser summarizes every ECG Observation, and the heart rate it derives from valueSampledData matches the reported heart rate. | summarizes every synthetic ECG, with waveform-derived heart rate matching the reported rate | cd demos/device-evidence/run && npx vitest run --coverage --reporter=verbose, 2026-11-14 | pass |
| REQ-001: The ECG summary parser decodes SampledData (origin, factor, dimensions, E/L/U samples) and detects R peaks. | decodes SampledData edge cases and detects R peaks on a hand-built trace | cd demos/device-evidence/run && npx vitest run --coverage --reporter=verbose, 2026-11-14 | pass |
| REQ-001: The ECG summary parser flags abnormal values and rejects non-ECG or malformed input. | handles a minimal ECG without waveform, flags abnormal values, and rejects non-ECG input | cd demos/device-evidence/run && npx vitest run --coverage --reporter=verbose, 2026-11-14 | pass |
| REQ-001: Foo Medical vitals displays the blood-pressure panel and ECG summary for a synthetic patch v2 patient. | a synthetic patch v2 patient sees the blood-pressure panel and ECG summary in Foo Medical vitals | cd demos/device-evidence/run && npx vitest run --coverage --reporter=verbose, 2026-11-14 | pass |

## Test log

```text

 RUN  v4.1.12 /agent/repos/medplum/demos/device-evidence/run
      Coverage enabled with v8

 ✓ src/ecg.test.ts > REQ-001 ECG summary parser > summarizes every synthetic ECG, with waveform-derived heart rate matching the reported rate 52ms
 ✓ src/ecg.test.ts > REQ-001 ECG summary parser > decodes SampledData edge cases and detects R peaks on a hand-built trace 2ms
 ✓ src/ecg.test.ts > REQ-001 ECG summary parser > handles a minimal ECG without waveform, flags abnormal values, and rejects non-ECG input 3ms
 ✓ src/cohort.test.ts > REQ-001 synthetic Acme Cardio patch v2 cohort > regenerating from the seed reproduces the committed bundle and manifest 75ms
 ✓ src/cohort.test.ts > REQ-001 synthetic Acme Cardio patch v2 cohort > manifest lists every resource id with counts; every resource is valid R4 and tagged synthetic and HTEST 537ms
 ✓ src/vitals.test.tsx > REQ-001 Foo Medical vitals display > a synthetic patch v2 patient sees the blood-pressure panel and ECG summary in Foo Medical vitals 949ms
 ✓ src/cohort.test.ts > REQ-001 synthetic Acme Cardio patch v2 cohort > MockClient ingests the bundle and links patient, device, definition, BP panel, and ECG 688ms

 Test Files  3 passed (3)
      Tests  7 passed (7)
   Start at  16:19:26
   Duration  3.03s (transform 2.22s, setup 192ms, import 3.19s, tests 2.31s, environment 1.25s)

 % Coverage report from v8
-----------|---------|----------|---------|---------|---------------------------
File       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s         
-----------|---------|----------|---------|---------|---------------------------
All files  |     100 |    90.06 |     100 |     100 |                           
 cohort.ts |     100 |      100 |     100 |     100 |                           
 ecg.ts    |     100 |    89.81 |     100 |     100 | ...69,186-196,235,244-247 
 load.ts   |     100 |    71.42 |     100 |     100 | 23,51-52                  
-----------|---------|----------|---------|---------|---------------------------

=============================== Coverage summary ===============================
Statements   : 100% ( 273/273 )
Branches     : 90.06% ( 136/151 )
Functions    : 100% ( 49/49 )
Lines        : 100% ( 247/247 )
================================================================================
EXIT:0
```
