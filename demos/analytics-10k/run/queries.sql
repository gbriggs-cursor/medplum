-- L13 investigation: Foo Medical HbA1c control drop.
-- Every query the report relies on. Each block starts with "-- name: <id>" and is run by run.py,
-- which registers one view per table (patients, observations, ...) over the data pack's Parquet files.
-- HbA1c is LOINC 4548-4. IFCC (mmol/mol) to NGSP (%): pct = mmol_mol / 10.929 + 2.15.

-- name: t2d_cohort_size
-- Type 2 diabetes cohort: a type 2 diabetes diagnosis (SNOMED 44054006) or a diabetic complication code.
-- The data has no type 1 diabetes codes, so every diabetic complication belongs to type 2.
WITH t2d AS (
  SELECT DISTINCT patient FROM conditions
  WHERE code IN ('44054006', '127013003', '90781000119102', '157141000119108', '422034002', '1551000119108', '1501000119109')
)
SELECT
  (SELECT count(DISTINCT patient) FROM conditions WHERE code = '44054006') AS with_t2d_diagnosis,
  (SELECT count(*) FROM t2d) AS t2d_cohort,
  (SELECT count(DISTINCT patient) FROM conditions WHERE description ILIKE '%type 1%') AS with_type1_codes;

-- name: q1_reproduce_drop
-- Dashboard metric as naively computed (value_num < 7 regardless of units), T2D cohort, by month.
WITH t2d AS (
  SELECT DISTINCT patient FROM conditions
  WHERE code IN ('44054006', '127013003', '90781000119102', '157141000119108', '422034002', '1551000119108', '1501000119109')
)
SELECT strftime(o.date, '%Y-%m') AS month,
       count(*) AS hba1c_results,
       sum((o.value_num < 7)::INT) AS under_7,
       round(100.0 * avg((o.value_num < 7)::INT), 1) AS control_pct
FROM observations o JOIN t2d USING (patient)
WHERE o.code = '4548-4' AND o.date >= '2025-04-01'
GROUP BY 1 ORDER BY 1;

-- name: q1b_reproduce_drop_all_tested
-- Same naive metric over every patient with an HbA1c result (the denominator a results-driven dashboard uses).
SELECT strftime(date, '%Y-%m') AS month,
       count(*) AS hba1c_results,
       sum((value_num < 7)::INT) AS under_7,
       round(100.0 * avg((value_num < 7)::INT), 1) AS control_pct
FROM observations
WHERE code = '4548-4' AND date >= '2025-04-01'
GROUP BY 1 ORDER BY 1;

-- name: q2_units_by_month
-- Root cause: HbA1c results start arriving in mmol/mol on 2026-03-30. Before that every result is in %.
SELECT strftime(date, '%Y-%m') AS month, units,
       count(*) AS results,
       min(value_num) AS min_value, max(value_num) AS max_value
FROM observations WHERE code = '4548-4' AND date >= '2025-10-01'
GROUP BY ALL ORDER BY 1, 2;

-- name: q2b_units_first_last
SELECT units, count(*) AS results, count(DISTINCT patient) AS patients,
       min(date)::DATE AS first_result, max(date)::DATE AS last_result
FROM observations WHERE code = '4548-4' GROUP BY 1 ORDER BY 1;

-- name: q2c_mmol_rows
-- Every mmol/mol result, its NGSP equivalent, the patient's prior % result, and where it was recorded.
SELECT o.date::DATE AS date, o.patient, org.name AS organization,
       o.value_num AS value_mmol_mol,
       round(o.value_num / 10.929 + 2.15, 2) AS value_pct_converted,
       (SELECT p.value_num FROM observations p
         WHERE p.patient = o.patient AND p.code = '4548-4' AND p.units = '%' AND p.date < o.date
         ORDER BY p.date DESC LIMIT 1) AS prior_pct_result,
       o.value_num < 7 AS counted_as_controlled_naive
FROM observations o
JOIN encounters e ON e.id = o.encounter
JOIN organizations org ON org.id = e.organization
WHERE o.code = '4548-4' AND o.units = 'mmol/mol'
ORDER BY o.date;

-- name: q2d_switch_not_one_org
-- The switch is not one site: affected organizations and their % results before and after 2026-03-30.
SELECT count(DISTINCT e.organization) FILTER (WHERE o.units = 'mmol/mol') AS orgs_with_mmol,
       count(DISTINCT o.patient) FILTER (WHERE o.units = 'mmol/mol') AS patients_with_mmol,
       count(*) FILTER (WHERE o.date >= '2026-03-30' AND o.units = 'mmol/mol') AS mmol_results_since_switch,
       count(*) FILTER (WHERE o.date >= '2026-03-30' AND o.units = '%') AS pct_results_since_switch
FROM observations o JOIN encounters e ON e.id = o.encounter
WHERE o.code = '4548-4';

-- name: q3_corrected_metric
-- Corrected metric: convert mmol/mol to % before applying the < 7% threshold. T2D cohort and all tested.
WITH t2d AS (
  SELECT DISTINCT patient FROM conditions
  WHERE code IN ('44054006', '127013003', '90781000119102', '157141000119108', '422034002', '1551000119108', '1501000119109')
),
a1c AS (
  SELECT date, patient, value_num, units,
         CASE WHEN units = 'mmol/mol' THEN value_num / 10.929 + 2.15 ELSE value_num END AS pct
  FROM observations WHERE code = '4548-4' AND date >= '2025-04-01'
)
SELECT strftime(date, '%Y-%m') AS month,
       count(*) FILTER (WHERE patient IN (SELECT patient FROM t2d)) AS t2d_results,
       round(100.0 * avg((value_num < 7)::INT) FILTER (WHERE patient IN (SELECT patient FROM t2d)), 1) AS t2d_naive_pct,
       round(100.0 * avg((pct < 7)::INT) FILTER (WHERE patient IN (SELECT patient FROM t2d)), 1) AS t2d_corrected_pct,
       count(*) AS all_results,
       sum((units = 'mmol/mol')::INT) AS mmol_results,
       round(100.0 * avg((value_num < 7)::INT), 1) AS all_naive_pct,
       round(100.0 * avg((pct < 7)::INT), 1) AS all_corrected_pct
FROM a1c GROUP BY 1 ORDER BY 1;

-- name: q3b_before_after
-- Before vs after the switch, T2D cohort and all tested, naive vs corrected.
WITH t2d AS (
  SELECT DISTINCT patient FROM conditions
  WHERE code IN ('44054006', '127013003', '90781000119102', '157141000119108', '422034002', '1551000119108', '1501000119109')
),
a1c AS (
  SELECT date, patient, value_num, units,
         CASE WHEN units = 'mmol/mol' THEN value_num / 10.929 + 2.15 ELSE value_num END AS pct,
         patient IN (SELECT patient FROM t2d) AS is_t2d
  FROM observations WHERE code = '4548-4' AND date >= '2025-04-01'
)
SELECT CASE WHEN date < '2026-03-30' THEN '1: 2025-04-01 to 2026-03-29' ELSE '2: 2026-03-30 to 2026-09-30' END AS period,
       CASE WHEN is_t2d THEN 'T2D cohort' ELSE 'other tested' END AS population,
       count(*) AS results,
       round(100.0 * avg((value_num < 7)::INT), 1) AS naive_pct,
       round(100.0 * avg((pct < 7)::INT), 1) AS corrected_pct
FROM a1c GROUP BY ALL ORDER BY 1, 2;

-- name: f2_duplicate_patient
-- Same person under two patient ids: same SSN, birthdate, middle and last name, address (case differs).
SELECT id, first, middle, last, birthdate, ssn, address, city,
       (SELECT min(start)::DATE FROM encounters e WHERE e.patient = p.id) AS first_encounter,
       (SELECT max(start)::DATE FROM encounters e WHERE e.patient = p.id) AS last_encounter,
       (SELECT count(*) FROM encounters e WHERE e.patient = p.id) AS encounters
FROM patients p
WHERE ssn IN (SELECT ssn FROM patients GROUP BY ssn HAVING count(*) > 1)
ORDER BY first_encounter;

-- name: f2b_patient_counts
SELECT count(*) AS patient_rows, count(DISTINCT ssn) AS distinct_ssn,
       count(DISTINCT lower(last) || birthdate || lower(address)) AS distinct_person_keys
FROM patients;

-- name: f3_meter_outage_by_day
-- GlucoSense G2 meters stop reporting 2026-01-09 through 2026-01-20; G3 and G3 Plus are unaffected.
SELECT reading_date,
       count(*) FILTER (WHERE model = 'GlucoSense G2') AS g2_readings,
       count(*) FILTER (WHERE model = 'GlucoSense G3') AS g3_readings,
       count(*) FILTER (WHERE model = 'GlucoSense G3 Plus') AS g3_plus_readings
FROM device_readings
WHERE reading_date BETWEEN '2026-01-07' AND '2026-01-22'
GROUP BY 1 ORDER BY 1;

-- name: f3b_meter_coverage
-- Per-model expected vs actual readings 2025-10-01 to 2026-09-30 (one reading per meter per active day).
WITH span AS (
  SELECT device_id, model, min(reading_date) AS first_day, max(reading_date) AS last_day, count(*) AS readings
  FROM device_readings GROUP BY 1, 2
)
SELECT model, count(*) AS meters,
       sum(datediff('day', first_day, last_day) + 1) AS expected_readings,
       sum(readings) AS actual_readings,
       sum(datediff('day', first_day, last_day) + 1) - sum(readings) AS missing_readings
FROM span GROUP BY 1 ORDER BY 1;

-- name: f3c_missing_days_per_meter
-- Every G2 meter misses the same 12 days and no other meter misses any day.
WITH days AS (
  SELECT d.device_id, d.model, gs::DATE AS day
  FROM (SELECT device_id, model, min(reading_date) AS a, max(reading_date) AS b FROM device_readings GROUP BY 1, 2) d,
       generate_series(d.a::TIMESTAMP, d.b::TIMESTAMP, INTERVAL 1 DAY) t(gs)
)
SELECT days.model, count(DISTINCT days.device_id) AS meters_with_gaps, count(*) AS missing_meter_days,
       min(day) AS first_missing_day, max(day) AS last_missing_day
FROM days LEFT JOIN device_readings r ON r.device_id = days.device_id AND r.reading_date = days.day
WHERE r.device_id IS NULL
GROUP BY 1 ORDER BY 1;

-- name: f4_hypertension_icd10
-- One hypertension diagnosis is coded ICD-10-CM I10; the other 28 use SNOMED 59621000.
SELECT system, code, description, count(*) AS rows, count(DISTINCT patient) AS patients,
       min(start) AS first_start, max(start) AS last_start
FROM conditions
WHERE code IN ('59621000', 'I10') OR description ILIKE '%hypertension%'
GROUP BY ALL ORDER BY rows DESC;

-- name: f4b_i10_patient_missing_from_snomed_registry
SELECT c.patient, c.start, c.system, c.code,
       EXISTS (SELECT 1 FROM conditions s WHERE s.patient = c.patient AND s.code = '59621000') AS has_snomed_hypertension,
       (SELECT max(value_num) FROM observations o
         WHERE o.patient = c.patient AND o.code = '8480-6' AND o.date::DATE = c.start) AS systolic_that_day
FROM conditions c WHERE c.system = 'ICD-10-CM';

-- name: f4c_condition_systems
SELECT system, count(*) AS rows FROM conditions GROUP BY 1 ORDER BY rows DESC;

-- name: chk_duplicate_observations
-- Not a finding: the only whole-row duplicates are 7 results in one encounter.
SELECT date::DATE AS date, patient, encounter, count(*) AS duplicated_codes
FROM (SELECT *, count(*) AS n FROM observations GROUP BY ALL HAVING count(*) > 1)
GROUP BY ALL;

-- name: chk_duplicate_panel_is_double_order
-- In that encounter the whole renal panel appears twice, including creatinine and eGFR with different values,
-- so it is two orders of one panel, not copied rows.
SELECT code, description, count(*) AS rows, count(DISTINCT value_num) AS distinct_values
FROM observations
WHERE encounter = '635dd15c-2b6e-36eb-ffbf-c4276f37cc56'
GROUP BY ALL HAVING count(*) > 1 ORDER BY code;

-- name: chk_integrity
-- Checks that came back clean (reported so the reader knows they were run).
SELECT
  (SELECT count(*) FROM patients WHERE NOT synthetic OR tag <> 'HTEST') AS non_synthetic_patients,
  (SELECT count(*) FROM encounters WHERE stop < start) AS encounters_stop_before_start,
  (SELECT count(*) FROM encounters WHERE patient NOT IN (SELECT id FROM patients)) AS orphan_encounters,
  (SELECT count(*) FROM observations WHERE encounter NOT IN (SELECT id FROM encounters)) AS orphan_observations,
  (SELECT count(*) FROM observations o JOIN patients p ON p.id = o.patient WHERE o.date::DATE > p.deathdate) AS observations_after_death,
  (SELECT count(*) FROM devices d JOIN (SELECT DISTINCT device_id, patient, model FROM device_readings) r USING (device_id)
     WHERE r.patient <> d.patient OR r.model <> d.model) AS readings_device_mismatch,
  (SELECT count(*) FROM device_readings WHERE units <> 'mg/dL') AS readings_not_mg_dl,
  (SELECT count(*) FROM medications WHERE stop < start OR dispenses < 0) AS bad_medication_rows;

-- name: chk_low_readings_follow_low_hba1c
-- Not a finding: the only readings under 40 mg/dL belong to two patients whose HbA1c has been about 3% since 2023.
SELECT r.patient, r.model, count(*) AS readings_under_40,
       (SELECT round(avg(CASE WHEN units = 'mmol/mol' THEN value_num / 10.929 + 2.15 ELSE value_num END), 2)
          FROM observations o WHERE o.code = '4548-4' AND o.patient = r.patient) AS avg_hba1c_pct
FROM device_readings r WHERE glucose_mg_dl < 40 GROUP BY ALL ORDER BY 1;

-- name: chk_complications_without_t2d_dx
-- Cohort note, not a dated defect: patients with diabetic complication codes but no 44054006 diagnosis.
SELECT count(DISTINCT patient) AS patients, min(start) AS earliest_complication, max(start) AS latest_complication
FROM conditions
WHERE code IN ('127013003', '90781000119102', '157141000119108', '422034002', '1551000119108', '1501000119109')
  AND patient NOT IN (SELECT patient FROM conditions WHERE code = '44054006');
