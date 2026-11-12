# Data contract with the L13 analytics pack

This story adds no data. It reads the pack from story L13 (`demos/analytics-10k`).

| Pack | Where |
| --- | --- |
| P2 `synthea-analytics-10k` | `{data_dir}` (`~/.cache/medplum-demos/synthea-analytics-10k`): `analytics.duckdb`, or Parquet under `parquet/` |
| P0 `synthea-analytics-100` | `demos/_shared/data-packs/synthea-analytics/fixture-100` (committed). Use this only when P2 is not on the machine, and say so |

Schema source: `demos/_shared/data-packs/synthea-analytics/README.md`. Column names below are that schema, not Synthea's raw CSV headers.

| Table | Columns used | For question |
| --- | --- | --- |
| `patients` | `id`, `birthdate` | 1, 3 |
| `conditions` | `patient`, `code`, `description`, `start` (type 2 diabetes) | 1 |
| `observations` | `patient`, `date`, `code`, `value_num`, `units` (HbA1c, LOINC `4548-4`) | 1 |
| `encounters` | `id`, `patient`, `start`, `encounter_class`, `description` | 2, 3 |

Question 1 is L13's planted HbA1c question (control under 7% in March 2026) and is scored with `answer-keys://analytics-10k/`. Questions 2 and 3 have no answer key.
