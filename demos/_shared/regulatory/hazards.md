# Hazards (synthetic, ISO 14971 style)

Synthetic hazard log for the fictional Acme Cardio Companion app. Synthetic: true.

| ID | Hazardous situation | Harm | Severity | Control |
| --- | --- | --- | --- | --- |
| RISK-001 | Clinician sees a wrong blood-pressure value | Delayed or wrong treatment | Serious | REQ-002, unit tests on SI-01 |
| RISK-002 | Irregular rhythm not flagged | Missed arrhythmia | Serious | REQ-003, unit tests on SI-02 |
| RISK-003 | Patient trend omits readings | Patient misjudges control | Minor | REQ-004, unit tests on SI-03 |
| RISK-004 | Search drops readings from review | Data not reviewed | Minor | REQ-005, regression tests on SI-04 |
