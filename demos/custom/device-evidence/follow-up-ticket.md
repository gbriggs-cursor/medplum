# Follow-up: Display ECG waveforms and discrete heart-rate vitals for Acme Cardio patch v2

## Context

Take 1 validated that Medplum can ingest a synthetic Acme Cardio patch v2 cohort (20 Patients, 20 Devices + DeviceDefinition, 20 BP panels, 20 ECG summaries) through `MockClient.executeBatch`, that Foo Medical Vitals lists the BP and EKG study rows, and that an ECG summary parser can recover heart rate, intervals, interpretation, and 250-sample Lead II `valueSampledData`.

## Gaps from take 1

1. **Waveform is ingested but not displayed.** `@medplum/core` `formatObservationValue` ignores `valueSampledData`, so Foo Medical Vitals shows ECG component quantities only. There is no Lead II strip or sample-count in the patient portal.
2. **ECG-derived heart rate does not populate Foo Medical heart-rate vitals.** The parser reads `8867-4` from an ECG component. PatientSummary Vitals and the Foo Medical `/health-record/vitals/heart-rate` page look for a standalone Observation coded `8867-4`, so the HR row stays empty.
3. **Interval codes are local placeholders.** PR / QRS / QT use `https://acme-cardio.example/fhir/CodeSystem/ecg-summary` because those LOINC codes are not in this repo's valuesets. They need clinical terminology review before any non-demo use.
4. **Validation is MockClient-only.** Search required indexing FHIR search-parameter bundles in the test setup. This does not prove a hosted Medplum project, subscriptions, or a device gateway.
5. **No Device / DeviceDefinition UI.** Foo Medical does not render the patch serial or DeviceDefinition model name next to the vitals.

## Risks

- Treating take 1 as display-complete would hide missing waveforms from CDx reviewers.
- Shipping local ECG interval codes as if they were LOINC would fail terminology review.
- A live project may reject or remap `valueSampledData` size, Device.definition, or synthetic tags differently than `MockClient`.

## Next validation step

1. Emit a discrete `8867-4` Heart rate Observation (in addition to the ECG component) so Foo Medical measurement pages show HR.
2. Add an ECG waveform renderer (or extend `formatObservationValue`) and a Foo Medical vitals row that shows sample count, period, and a Lead II sparkline.
3. Replace local interval codes with verified LOINC after terminology review, or keep them explicitly local in an IG.
4. Replay `demos/custom/device-evidence/data/acme-cardio-bundle.json` against a disposable Medplum project (not production) and capture the same requirement table from live search + App screenshots.
5. Keep the cohort synthetic-only; do not introduce PHI.

## Acceptance

- Foo Medical heart-rate page lists 20 synthetic HR values from the bundle.
- Foo Medical or a demo page renders ECG `valueSampledData` (not only component text).
- Live-project ingest evidence is attached with the same seed `20251104`.
- No PHI. PR only to `gbriggs-cursor/medplum`.
