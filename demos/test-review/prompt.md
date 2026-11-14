# Prompt: L19 Test & Review, Story A

Variables: `{prospect}` (default `Foo Medical`).

```
{prospect} needs the Patient Devices tab in demos/test-review/prd-patient-devices.md. Build it to
REQ-DEV-01 to REQ-DEV-04 with FHIR search only: no new backend and no chart library. Add Vitest
tests. Start a local app, load demos/_shared/data/taylor-demo-bp-cuff.json (re-dated to today with
node demos/test-review/offline.mjs --as-of <today> --write /tmp/taylor.json), and run the
uat-from-acceptance-criteria skill on every REQ-DEV line. Use only synthetic data. Open a draft PR
against the default branch with evidence/EVIDENCE.md and the UAT proof.
```

Expected: a draft PR with four UAT rows, all pass, and a screenshot or video per row. The REQ-DEV-03 row shows the day 0 and day 30 readings.
