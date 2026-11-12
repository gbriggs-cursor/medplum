Requirement: REQ-001: Medplum ingests and displays Acme Cardio patch v2 blood-pressure panels and ECG summaries.
Change: P1 device cohort (demos/_shared/data-packs/p1-device-cohort, seed 20261104): ECG summary parser and Foo Medical vitals ingest
Test: npx vitest run (in demos/_shared/data-packs/p1-device-cohort)
Result: pass (4 passed, 0 failed)
Synthetic: true
Commit: 6fbbd73020941d69d469b6515f0e44608b400dba
Trace: REQ-001, RISK-002, RISK-001
Approval: pending

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| REQ-001 (RISK-002) | parseEcgSummary reads component valueSampledData | npx vitest run (in demos/_shared/data-packs/p1-device-cohort), 2026-11-12 | pass |
| REQ-001 (RISK-002) | parseEcgSummary throws when sampled data is missing | npx vitest run (in demos/_shared/data-packs/p1-device-cohort), 2026-11-12 | pass |
| REQ-001 (RISK-001) | MockClient ingests the synthetic Acme Cardio patch v2 bundle | npx vitest run (in demos/_shared/data-packs/p1-device-cohort), 2026-11-12 | pass |
| REQ-001 (RISK-001) | Foo Medical Vitals shows ingested blood pressure for the signed-in patient | npx vitest run (in demos/_shared/data-packs/p1-device-cohort), 2026-11-12 | pass |

## Test log

```

 RUN  v4.1.12 /agent/repos/medplum/demos/_shared/data-packs/p1-device-cohort

 ✓ src/ecg-summary-parser.test.ts (2 tests) 3ms
 ✓ src/vitals.ingest.test.tsx (2 tests) 203ms

 Test Files  2 passed (2)
      Tests  4 passed (4)
   Start at  16:09:28
   Duration  2.38s (transform 1.18s, setup 1.43s, import 1.04s, tests 206ms, environment 745ms)

JSON report written to /agent/repos/medplum/demos/approval-gate/self-test/evidence/vitest.json
EXIT:0
```
