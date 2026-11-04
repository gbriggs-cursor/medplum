Requirement: Validate BP + ECG summary ingest for Acme Cardio patch v2.
Change: demos/custom/device-evidence — synthetic Acme Cardio patch v2 bundle, ECG summary parser, and Foo Medical Vitals MockClient tests.
Test: npx vitest run --coverage
Result: pass (4 passed, 0 failed)
Synthetic: true
Commit: a1a2f600a7b33aad12e1bdff208fa5a9e0bfb418

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| Medplum ingests 20 synthetic Patients, DeviceDefinitions, Devices, blood-pressure panels, and ECG Observations from the Acme Cardio patch v2 bundle. | MockClient ingests the synthetic Acme Cardio patch v2 bundle | npx vitest run --coverage, 2026-11-04 | pass |
| Foo Medical Vitals displays ingested blood-pressure panels for the signed-in synthetic patient. | Foo Medical Vitals shows ingested blood pressure for the signed-in patient | npx vitest run --coverage, 2026-11-04 | pass |
| The ECG summary parser reads Observation.component.valueSampledData. | parseEcgSummary reads component valueSampledData | npx vitest run --coverage, 2026-11-04 | pass |

## Test log

```text

 RUN  v4.1.12 /agent/repos/medplum/demos/custom/device-evidence
      Coverage enabled with v8


 Test Files  2 passed (2)
      Tests  4 passed (4)
   Start at  06:17:35
   Duration  2.66s (transform 1.18s, setup 1.55s, import 1.08s, tests 235ms, environment 760ms)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   88.88 |       70 |     100 |   86.66 |                   
 ...mary-parser.ts |   88.88 |       70 |     100 |   86.66 | 25,47             
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 88.88% ( 16/18 )
Branches     : 70% ( 7/10 )
Functions    : 100% ( 6/6 )
Lines        : 86.66% ( 13/15 )
================================================================================
EXIT:0
```
