# Data contract with the L13 analytics pack

This story adds no data. It needs these from the P2 pack that L13 (workstream C) builds. Names follow
Synthea's CSV export; L13 may rename them, in which case update `prompt.md`, not the pack.

| Table | Columns used | For question |
| --- | --- | --- |
| `patients` | `Id`, `BIRTHDATE` | 1, 3 |
| `conditions` | `PATIENT`, `CODE`, `START` (diabetes) | 1 |
| `observations` | `PATIENT`, `DATE`, `CODE`, `VALUE`, `UNITS` (HbA1c, LOINC 4548-4) | 1 |
| `encounters` | `Id`, `PATIENT`, `START`, `ENCOUNTERCLASS`, `DESCRIPTION` | 2, 3 |

Question 1 reuses L13's planted HbA1c anomaly and answer key. Questions 2 and 3 need no planted anomaly.
