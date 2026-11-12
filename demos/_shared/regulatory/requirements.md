# Requirements (synthetic)

Synthetic design inputs for the fictional Acme Cardio Companion app. Synthetic: true.

| ID | Requirement | Items | Risks |
| --- | --- | --- | --- |
| REQ-001 | Medplum ingests and displays Acme Cardio patch v2 blood-pressure panels and ECG summaries. | SI-01, SI-02, SI-03 | RISK-001, RISK-002 |
| REQ-002 | Systolic and diastolic values are shown in mmHg with the value received from the device, without rounding. | SI-01, SI-03 | RISK-001 |
| REQ-003 | An ECG summary with an irregular-rhythm flag is surfaced as abnormal. | SI-02 | RISK-002 |
| REQ-004 | A 30-day trend shows every reading in the window, including the first and last day. | SI-03 | RISK-003 |
| REQ-005 | A search filtered by project returns the same results in MockClient and on the server. | SI-04 | RISK-004 |
| REQ-006 | A blood-pressure entry whose diastolic value is greater than or equal to its systolic value is rejected before an Observation is created. | SI-01 | RISK-001 |
