Requirement: Foo Medical patients have a Devices tab in packages/app that lists the patient's connected Device resources and charts the last 30 days of their Observation readings, built as a reusable @medplum/react component on FHIR search with synthetic data only.
Change: packages/react/src/PatientDevices/ (new PatientDevices component, utils, tests), packages/react/src/index.ts, packages/react/src/StatusBadge/StatusBadge.tsx, packages/app/src/resource/DevicesPage.tsx and DevicesPage.test.tsx, packages/app/src/AppRoutes.tsx, packages/app/src/resource/ResourcePage.tsx, and the synthetic fixture under demos/_shared/data/.
Test: NO_COLOR=1 npm test --workspace @medplum/react --workspace @medplum/app (from the repository root)
Result: pass (2059 passed, 0 failed)
Synthetic: true
Commit: 2869bf9f061e037efe42e14b692d241bf42c9055

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| Every resource in the shared Device and Observation fixture is tagged synthetic. | every fixture resource is tagged synthetic | NO_COLOR=1 npm test --workspace @medplum/react --workspace @medplum/app (from the repository root), 2026-11-14 | pass |
| PatientDevices lists each Device linked to the patient and charts only Observation readings from the last 30 days. | charts the last 30 days of readings for each linked device | NO_COLOR=1 npm test --workspace @medplum/react --workspace @medplum/app (from the repository root), 2026-11-14 | pass |
| The reading window length follows the days prop. | days prop narrows the window | NO_COLOR=1 npm test --workspace @medplum/react --workspace @medplum/app (from the repository root), 2026-11-14 | pass |
| A patient with no linked devices sees an empty-state message. | patient with no devices | NO_COLOR=1 npm test --workspace @medplum/react --workspace @medplum/app (from the repository root), 2026-11-14 | pass |
| Numeric readings are grouped into one series per measurement code, panel components become separate series, points are sorted by time, and unusable readings are skipped. | groups numeric values by code, splits components, sorts by time, and skips unusable readings | NO_COLOR=1 npm test --workspace @medplum/react --workspace @medplum/app (from the repository root), 2026-11-14 | pass |
| The app shows a Devices tab on Patient pages that renders PatientDevices. | Patient shows Devices tab with device readings | NO_COLOR=1 npm test --workspace @medplum/react --workspace @medplum/app (from the repository root), 2026-11-14 | pass |
| Non-Patient resources have no Devices tab and the devices route shows an unsupported message. | Non-patient has no Devices tab and shows unsupported message | NO_COLOR=1 npm test --workspace @medplum/react --workspace @medplum/app (from the repository root), 2026-11-14 | pass |
| Existing @medplum/react and packages/app tests still pass. | NO_COLOR=1 npm test --workspace @medplum/react --workspace @medplum/app (from the repository root) | NO_COLOR=1 npm test --workspace @medplum/react --workspace @medplum/app (from the repository root), 2026-11-14 | pass |

## Test log

```text

> @medplum/react@5.2.14 test
> vitest run


 RUN  v4.1.12 /agent/repos/medplum/packages/react

Not implemented: navigation to another Document
Not implemented: navigation to another Document

 Test Files  169 passed (169)
      Tests  1574 passed (1574)
   Start at  16:35:36
   Duration  71.56s (transform 7.78s, setup 122.49s, import 83.18s, tests 113.01s, environment 84.03s)


> @medplum/app@5.2.14 test
> vitest run


 RUN  v4.1.12 /agent/repos/medplum/packages/app


 Test Files  70 passed (70)
      Tests  485 passed (485)
   Start at  16:36:48
   Duration  40.36s (transform 10.69s, setup 50.07s, import 65.12s, tests 80.96s, environment 33.73s)

EXIT:0
```
