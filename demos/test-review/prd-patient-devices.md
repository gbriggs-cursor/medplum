# PRD: Patient Devices tab (synthetic)

Synthetic product requirement for the fictional Acme Cardio Companion app on Medplum. Customer: Foo Medical clinicians. Test patient: Taylor Demo. Synthetic: true.

## Problem

Clinicians at Foo Medical cannot see which home devices a patient uses or what those devices sent this month without opening each Observation.

## Scope

- A Devices tab on the Patient page in the Medplum app.
- Reads existing Device and Observation resources with FHIR search only.
- No new backend, server operation, database index, or chart library. Use existing Mantine and `@medplum/react` components.

## Requirements

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| REQ-DEV-01 | The Patient page has a Devices tab at `/Patient/:id/devices`. | Opening `/Patient/<Taylor Demo id>/devices` shows a Devices tab that is selected, and the tab appears on Patient pages only. |
| REQ-DEV-02 | The tab lists each Device whose `patient` is this patient. | Taylor Demo's tab lists "Acme Cardio home BP cuff" with its type and status. |
| REQ-DEV-03 | For each device, the tab shows blood-pressure Observations from the last 30 days, including readings on day 0 and day 30. Blood pressure is LOINC 85354-9 (panel), 8480-6 (systolic), and 8462-4 (diastolic), in mmHg. | With the synthetic bundle loaded and dated to today, the tab shows all 12 readings, including the oldest (day 0) and the newest (day 30). The search uses `date=ge<day 0>`, not `gt`. |
| REQ-DEV-04 | The tab shows the latest reading as systolic/diastolic. | Taylor Demo's latest reading reads `117/75 mmHg`. |

## Risk

| ID | Hazardous situation | Control | Verified by |
| --- | --- | --- | --- |
| RISK-DEV-01 | A reading on the first or last day of the 30-day window is dropped, so a clinician reviews an incomplete trend. | REQ-DEV-03: inclusive `ge` start bound and an inclusive end, checked against day 0 and day 30 readings. | UAT row for REQ-DEV-03 |
| RISK-DEV-02 | Systolic and diastolic are swapped or rounded, so the clinician misreads the latest value. | REQ-DEV-04: show the received values in mmHg without rounding, systolic first. | UAT row for REQ-DEV-04 |
| RISK-DEV-03 | The view shows another patient's device. | REQ-DEV-02: search Device by `patient=Patient/<id>`, with the id escaped, under the user's AccessPolicy. | UAT row for REQ-DEV-02 |

## Test data

`demos/_shared/data/taylor-demo-bp-cuff.json`: transaction bundle with Patient Taylor Demo (MRN `HTEST-0001`), one Acme Cardio home BP cuff Device, and 12 blood-pressure panels over 30 days (latest 117/75). Every resource is tagged `synthetic` and `HTEST`. Dates are anchored at 2026-11-17; `node demos/test-review/offline.mjs --as-of <YYYY-MM-DD> --write <file>` re-dates a copy so day 30 is that date.

## Out of scope

The feature itself is not in this repository. Build it from this PRD; then run the `uat-from-acceptance-criteria` skill against REQ-DEV-01 to REQ-DEV-04.
