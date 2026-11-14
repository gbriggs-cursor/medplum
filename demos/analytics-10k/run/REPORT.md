# Foo Medical: why HbA1c control dropped in March 2026

## Answer

The drop comes from a units problem, not from patients getting worse. Starting **2026-03-30**, some HbA1c results (LOINC `4548-4`) are stored in IFCC units (**mmol/mol**, values 7 to 54) instead of NGSP **%**. The dashboard compares the raw number to 7, so every mmol/mol result counts as "not controlled", even a 42 mmol/mol (6.0%) result. That covers 9 results for 6 patients across 8 organizations, from 2026-03-30 through the end of the data (last one on 2026-09-07), mixed in with ordinary % results.

Converting before applying the threshold (`% = mmol/mol / 10.929 + 2.15`) removes the drop. Across all HbA1c results, March 2026 goes from 75% back to 100%, and April from 0% to 100%. In the type 2 diabetes cohort, control after the switch goes from 33.3% (raw) to 77.8% (corrected), against 62.5% before the switch. Each converted value is within about 0.5 points of the same patient's previous % result, so these are the same lab values reported in a different unit.

Three other data problems would distort this or other dashboards:
- one person is stored as two patient records from 2026-05-04;
- all ten GlucoSense G2 glucose meters stopped reporting from 2026-01-09 to 2026-01-20;
- one hypertension diagnosis is coded in ICD-10-CM, so SNOMED-based registries miss that patient.

**Data used.** The 10k pack was not at `~/.cache/medplum-demos/synthea-analytics-10k`, so as instructed this run used the committed 100-patient fixture (`demos/_shared/data-packs/synthea-analytics/fixture-100`, `MANIFEST.json` says `"planted": true`). Monthly counts are small (1 to 4 HbA1c results a month), so read the percentages as evidence of the mechanism, not as stable rates. `run.py` reruns every query in `queries.sql` and rewrites `results.md`. It picks up the 10k pack automatically when that is installed, or you can point it elsewhere with `L13_DATA_DIR`.

**Type 2 diabetes cohort.** Patients with SNOMED `44054006` (type 2 diabetes) or a diabetic complication code (`127013003`, `90781000119102`, `157141000119108`, `422034002`, `1551000119108`, `1501000119109`). There are no type 1 diabetes codes in the data, so every diabetic complication belongs to type 2. Only 5 patients have `44054006` itself. The broader definition gives 15 (see the cohort note at the end).

| with_t2d_diagnosis | t2d_cohort | with_type1_codes |
| --- | --- | --- |
| 5 | 15 | 0 |

## Finding 1 (root cause): HbA1c results stored in mmol/mol from 2026-03-30

### Reproducing the drop

This is the dashboard metric as currently computed (`value_num < 7` whatever the units), over every patient with an HbA1c result. In this fixture, March is the only month with an affected result where the T2D cohort itself has no affected result yet. The first affected T2D result is in May.

```sql
SELECT strftime(date, '%Y-%m') AS month, count(*) AS hba1c_results,
       sum((value_num < 7)::INT) AS under_7, round(100.0 * avg((value_num < 7)::INT), 1) AS control_pct
FROM observations WHERE code = '4548-4' AND date >= '2025-04-01' GROUP BY 1 ORDER BY 1;
```

| month | hba1c_results | under_7 | control_pct |
| --- | --- | --- | --- |
| 2025-11 | 1 | 1 | 100 |
| 2025-12 | 4 | 4 | 100 |
| 2026-01 | 4 | 4 | 100 |
| 2026-02 | 1 | 1 | 100 |
| **2026-03** | 4 | 3 | **75** |
| 2026-04 | 1 | 0 | 0 |
| 2026-05 | 4 | 1 | 25 |
| 2026-06 | 3 | 1 | 33.3 |
| 2026-07 | 3 | 2 | 66.7 |
| 2026-08 | 3 | 2 | 66.7 |
| 2026-09 | 3 | 2 | 66.7 |

(The full table from 2025-04 and the T2D-only version, `q1_reproduce_drop`, are in `results.md`.)

### Units switch on 2026-03-30

```sql
SELECT units, count(*) AS results, count(DISTINCT patient) AS patients,
       min(date)::DATE AS first_result, max(date)::DATE AS last_result
FROM observations WHERE code = '4548-4' GROUP BY 1 ORDER BY 1;
```

| units | results | patients | first_result | last_result |
| --- | --- | --- | --- | --- |
| % | 67 | 23 | 2023-10-21 | 2026-09-13 |
| mmol/mol | 9 | 6 | 2026-03-30 | 2026-09-07 |

Every mmol/mol row, converted, next to the patient's previous % result (`q2c_mmol_rows`):

| date | patient | organization | value_mmol_mol | value_pct_converted | prior_pct_result | counted_as_controlled_naive |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-03-30 | 3663e822-ff3b-e756-28f4-35181d589f8a | WALPOLE MEDICAL CENTER  PC | 44 | 6.18 | 6.3 | False |
| 2026-04-30 | f87d3c47-08d9-2100-1499-af12d36b47d1 | SUNRISE HEALTHCARE LLC | 45 | 6.27 | 6 | False |
| 2026-05-19 | db0a332f-a1e8-be95-57bf-67c6e7230a84 | MINDFUL MEDICAL CARE PC | 42 | 5.99 | 6.1 | False |
| 2026-05-29 | b9b2b88c-01c8-c883-81d2-b72c68ba55bc | HALLMARK HEALTH URGENT CARE PHYSICIANS LLC | 13 | 3.34 | 3.3 | False |
| 2026-06-05 | b9b2b88c-01c8-c883-81d2-b72c68ba55bc | TUFTS MEDICAL CENTER | 7 | 2.79 | 3.3 | False |
| 2026-06-26 | b9b2b88c-01c8-c883-81d2-b72c68ba55bc | TUFTS MEDICAL CENTER | 10 | 3.06 | 3.3 | False |
| 2026-07-31 | b9b2b88c-01c8-c883-81d2-b72c68ba55bc | READING FAMILY MEDICINE PC | 9 | 2.97 | 3.3 | False |
| 2026-08-24 | c5645a26-ce76-6f68-c20b-e1fa92b3f6c8 | HOLYOKE HEALTH CENTER INC | 43 | 6.08 | 6.2 | False |
| 2026-09-07 | 4dc6345e-dcd6-96f8-f46d-26c6fd254273 | PRIMARY CARE NORTH PC | 54 | 7.09 | 7.1 | False |

No single site is responsible: 8 organizations are involved, and % results keep arriving alongside the mmol/mol ones (`q2d_switch_not_one_org`):

| orgs_with_mmol | patients_with_mmol | mmol_results_since_switch | pct_results_since_switch |
| --- | --- | --- | --- |
| 8 | 6 | 9 | 9 |

### Corrected metric

```sql
-- t2d = patients with 44054006 or a diabetic complication code (see queries.sql)
SELECT strftime(date, '%Y-%m') AS month, ...,
       round(100.0 * avg((value_num < 7)::INT), 1) AS all_naive_pct,
       round(100.0 * avg((CASE WHEN units = 'mmol/mol' THEN value_num / 10.929 + 2.15 ELSE value_num END < 7)::INT), 1) AS all_corrected_pct
FROM observations WHERE code = '4548-4' AND date >= '2025-04-01' GROUP BY 1 ORDER BY 1;  -- full text: q3_corrected_metric
```

| month | t2d_results | t2d_naive_pct | t2d_corrected_pct | all_results | mmol_results | all_naive_pct | all_corrected_pct |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-01 | 2 | 100 | 100 | 4 | 0 | 100 | 100 |
| 2026-02 | 0 |  |  | 1 | 0 | 100 | 100 |
| **2026-03** | 1 | 100 | 100 | 4 | 1 | **75** | **100** |
| 2026-04 | 0 |  |  | 1 | 1 | 0 | 100 |
| 2026-05 | 3 | 33.3 | 66.7 | 4 | 2 | 25 | 75 |
| 2026-06 | 3 | 33.3 | 100 | 3 | 2 | 33.3 | 100 |
| 2026-07 | 2 | 50 | 100 | 3 | 1 | 66.7 | 100 |
| 2026-08 | 0 |  |  | 3 | 1 | 66.7 | 100 |
| 2026-09 | 1 | 0 | 0 | 3 | 1 | 66.7 | 66.7 |

Before vs after the switch (`q3b_before_after`):

| period | population | results | naive_pct | corrected_pct |
| --- | --- | --- | --- | --- |
| 2025-04-01 to 2026-03-29 | T2D cohort | 8 | 62.5 | 62.5 |
| 2025-04-01 to 2026-03-29 | other tested | 16 | 100 | 100 |
| 2026-03-30 to 2026-09-30 | T2D cohort | 9 | **33.3** | **77.8** |
| 2026-03-30 to 2026-09-30 | other tested | 9 | 55.6 | 100 |

**Fix.** Normalize HbA1c to % at ingest, or in the metric with `CASE WHEN units = 'mmol/mol' THEN value_num / 10.929 + 2.15 ELSE value_num END`. Also add a check that fails when a `4548-4` result arrives in a unit other than `%` or `mmol/mol`.

## Finding 2: one person stored as two patient records (from 2026-05-04)

Patient `704b7b53-21ff-4b35-bd8f-057b9597b58b` ("Line Hessel84") has the same SSN, birthdate, middle and last name, and address (in upper case) as `d1e0303f-62e7-0cd8-a588-3dd21dc975f6` ("Lien262 Hessel84"). Its encounters begin on 2026-05-04, after the original record's last encounter. Unlike the other ids, which follow the Synthea pattern, its id is a random version 4 UUID, and its first name lacks Synthea's numeric suffix. Patient counts and active-patient dashboards count one person twice, and the person's history is split across two ids.

```sql
SELECT id, first, middle, last, birthdate, ssn, address, city,
       (SELECT min(start)::DATE FROM encounters e WHERE e.patient = p.id) AS first_encounter,
       (SELECT max(start)::DATE FROM encounters e WHERE e.patient = p.id) AS last_encounter,
       (SELECT count(*) FROM encounters e WHERE e.patient = p.id) AS encounters
FROM patients p WHERE ssn IN (SELECT ssn FROM patients GROUP BY ssn HAVING count(*) > 1) ORDER BY first_encounter;
```

| id | first | middle | last | birthdate | ssn | address | city | first_encounter | last_encounter | encounters |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| d1e0303f-62e7-0cd8-a588-3dd21dc975f6 | Lien262 | Sallie654 | Hessel84 | 1982-11-18 | 999-10-8466 | 470 Hane Mill | Mansfield | 2024-11-28 | 2025-11-14 | 3 |
| 704b7b53-21ff-4b35-bd8f-057b9597b58b | Line | Sallie654 | Hessel84 | 1982-11-18 | 999-10-8466 | 470 HANE MILL | Mansfield | 2026-05-04 | 2026-08-12 | 4 |

| patient_rows | distinct_ssn | distinct_person_keys |
| --- | --- | --- |
| 115 | 114 | 114 |

## Finding 3: GlucoSense G2 meters stopped reporting, 2026-01-09 to 2026-01-20

Every G2 meter (10 of them) has no readings for 12 consecutive days. G3 and G3 Plus meters have no gaps anywhere in the year. That's 120 missing meter-days, which explains January 2026's low reading count (779 against the 899 expected). Any adherence or "days with a reading" dashboard dips, and averages for that window only reflect the G3 models.

```sql
SELECT reading_date,
       count(*) FILTER (WHERE model = 'GlucoSense G2') AS g2_readings,
       count(*) FILTER (WHERE model = 'GlucoSense G3') AS g3_readings,
       count(*) FILTER (WHERE model = 'GlucoSense G3 Plus') AS g3_plus_readings
FROM device_readings WHERE reading_date BETWEEN '2026-01-07' AND '2026-01-22' GROUP BY 1 ORDER BY 1;
```

| reading_date | g2_readings | g3_readings | g3_plus_readings |
| --- | --- | --- | --- |
| 2026-01-07 | 10 | 8 | 11 |
| 2026-01-08 | 10 | 8 | 11 |
| 2026-01-09 | 0 | 8 | 11 |
| ... (0 G2 readings every day) | 0 | 8 | 11 |
| 2026-01-20 | 0 | 8 | 11 |
| 2026-01-21 | 10 | 8 | 11 |

Missing meter-days over the whole year (`f3c_missing_days_per_meter`; every other model returns no rows):

| model | meters_with_gaps | missing_meter_days | first_missing_day | last_missing_day |
| --- | --- | --- | --- | --- |
| GlucoSense G2 | 10 | 120 | 2026-01-09 | 2026-01-20 |

## Finding 4: hypertension diagnosis coded in ICD-10-CM (2025-12-23)

The other 28 essential hypertension diagnoses use SNOMED `59621000`. One, recorded 2025-12-23 for patient `cd50a10e-37ea-7e09-7b15-0aefb9fc7f31`, is `ICD-10-CM I10`. It's the only `ICD-10-CM` row in `conditions`; the dental codes use system `ICD10`. The patient has no SNOMED hypertension code, so any SNOMED-based hypertension registry or BP-control dashboard misses her. Her systolic pressure that day was 139.

```sql
SELECT system, code, description, count(*) AS rows, count(DISTINCT patient) AS patients, min(start) AS first_start, max(start) AS last_start
FROM conditions WHERE code IN ('59621000', 'I10') OR description ILIKE '%hypertension%' GROUP BY ALL ORDER BY rows DESC;
```

| system | code | description | rows | patients | first_start | last_start |
| --- | --- | --- | --- | --- | --- | --- |
| SNOMED-CT | 59621000 | Essential hypertension (disorder) | 28 | 28 | 1937-03-21 | 2026-07-27 |
| ICD-10-CM | I10 | Essential (primary) hypertension | 1 | 1 | 2025-12-23 | 2025-12-23 |

| patient | start | system | code | has_snomed_hypertension | systolic_that_day |
| --- | --- | --- | --- | --- | --- |
| cd50a10e-37ea-7e09-7b15-0aefb9fc7f31 | 2025-12-23 | ICD-10-CM | I10 | False | 139 |

## Checked and not reported as defects

- **Integrity checks all came back clean** (`chk_integrity`): every patient is synthetic and tagged `HTEST`; there are no encounters ending before they start, no orphan encounters or observations, no observations after death, no meter readings whose patient or model disagrees with `devices`, no readings in units other than mg/dL, and no medication rows with bad dates or negative dispenses.
- **Readings under 40 mg/dL** all belong to two patients whose HbA1c has been about 3.1 to 3.2% since 2023 (`chk_low_readings_follow_low_hba1c`). They follow the HbA1c history the readings are synthesized from, so they don't point to a meter fault.
- **Whole-row duplicate observations** are 7 results in one encounter on 2026-01-23 (`chk_duplicate_observations`). That encounter has its whole renal panel recorded twice, including creatinine and eGFR with different values (`chk_duplicate_panel_is_double_order`), so it's two orders of one panel, not copied rows. No HbA1c rows are duplicated.
- **Cohort note.** 10 patients have diabetic complication codes but no `44054006` diagnosis, with onsets from 1959 to 2023 (`chk_complications_without_t2d_dx`). This is long-standing source behavior, not a dated defect. It does mean a dashboard keyed only on `44054006` sees 5 of the 15 patients with type 2 diabetes, so Foo Medical should confirm which definition the dashboard uses.
- **Other patterns that look like normal Synthea output:** eGFR units alternate between `mL/min` and `mL/min/{1.73_m2}` all through the window, and urine strip units vary in the same way. Duplicate organization names map to different sites, and some encounters share a start time.
