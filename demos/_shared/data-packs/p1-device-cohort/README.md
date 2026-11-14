# P1 device cohort

Synthetic: true. Twenty fictional patients on the Acme Cardio patch v2, each with a DeviceDefinition, a Device, a blood-pressure panel, and an ECG Observation (`valueSampledData`). Seed `20261104`. Every resource is tagged `synthetic` and `HTEST`.

Moved from PR #11's device-evidence folder so any story can use it. The only edits are the Foo Medical import depth and the coverage output folder.

| Command (run in this folder) | Does |
| --- | --- |
| `npx vitest run` | 4 tests: ECG parser (2), MockClient ingest, Foo Medical vitals display |
| `npx tsx src/generate.ts` | Regenerates `data/acme-cardio-patch-v2.bundle.json` and `manifest.json` from the seed |

Used by: `demos/approval-gate`.
