# Shared synthetic fixtures

Synthetic: true. Every resource here is fabricated and tagged `synthetic` (`https://medplum.com/fhir/CodeSystem/synthetic`) with the `HTEST` security label. No real patient or device data.

## `foo-medical-devices.bundle.json`

A FHIR `batch` bundle for the Foo Medical patient Devices tab (G1):

- `Patient/foo-patient-01` (Avery Synthetic)
- `Device/foo-bp-cuff-01`: active blood pressure cuff with a daily BP panel (systolic and diastolic components) for the 30 days ending 2026-11-14, plus one reading 45 days back that falls outside the window
- `Device/foo-oximeter-01`: active pulse oximeter with SpO2 and heart rate every other day
- `Device/foo-glucometer-01`: inactive glucose meter whose only reading is 60 days old

Each Observation links its Device through `Observation.device`, which is what the `device` search parameter matches.

Regenerate (deterministic, seed `20261114`):

```bash
node demos/_shared/data/generate-foo-medical-devices.mjs
```

Load into a local Medplum server by POSTing the bundle to the FHIR base URL (for example `http://localhost:8103/fhir/R4`) as an authenticated user, then open `/Patient/foo-patient-01/devices` in the app. The readings are dated relative to 2026-11-14, so on a later date regenerate with a new `ANCHOR` to keep them inside the 30-day window.
