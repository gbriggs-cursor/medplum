# Query results

Data: `/agent/repos/medplum/demos/_shared/data-packs/synthea-analytics/fixture-100`

## t2d_cohort_size

| with_t2d_diagnosis | t2d_cohort | with_type1_codes |
| --- | --- | --- |
| 5 | 15 | 0 |

## q1_reproduce_drop

| month | hba1c_results | under_7 | control_pct |
| --- | --- | --- | --- |
| 2025-05 | 1 | 0 | 0 |
| 2025-07 | 2 | 2 | 100 |
| 2025-09 | 2 | 0 | 0 |
| 2026-01 | 2 | 2 | 100 |
| 2026-03 | 1 | 1 | 100 |
| 2026-05 | 3 | 1 | 33.3 |
| 2026-06 | 3 | 1 | 33.3 |
| 2026-07 | 2 | 1 | 50 |
| 2026-09 | 1 | 0 | 0 |

## q1b_reproduce_drop_all_tested

| month | hba1c_results | under_7 | control_pct |
| --- | --- | --- | --- |
| 2025-04 | 1 | 1 | 100 |
| 2025-05 | 2 | 1 | 50 |
| 2025-07 | 3 | 3 | 100 |
| 2025-08 | 1 | 1 | 100 |
| 2025-09 | 4 | 2 | 50 |
| 2025-11 | 1 | 1 | 100 |
| 2025-12 | 4 | 4 | 100 |
| 2026-01 | 4 | 4 | 100 |
| 2026-02 | 1 | 1 | 100 |
| 2026-03 | 4 | 3 | 75 |
| 2026-04 | 1 | 0 | 0 |
| 2026-05 | 4 | 1 | 25 |
| 2026-06 | 3 | 1 | 33.3 |
| 2026-07 | 3 | 2 | 66.7 |
| 2026-08 | 3 | 2 | 66.7 |
| 2026-09 | 3 | 2 | 66.7 |

## q2_units_by_month

| month | units | results | min_value | max_value |
| --- | --- | --- | --- | --- |
| 2025-11 | % | 1 | 6 | 6 |
| 2025-12 | % | 4 | 5.9 | 6.2 |
| 2026-01 | % | 4 | 3.3 | 6.2 |
| 2026-02 | % | 1 | 6.4 | 6.4 |
| 2026-03 | % | 3 | 3.9 | 6.4 |
| 2026-03 | mmol/mol | 1 | 44 | 44 |
| 2026-04 | mmol/mol | 1 | 45 | 45 |
| 2026-05 | % | 2 | 6.1 | 7.6 |
| 2026-05 | mmol/mol | 2 | 13 | 42 |
| 2026-06 | % | 1 | 6.5 | 6.5 |
| 2026-06 | mmol/mol | 2 | 7 | 10 |
| 2026-07 | % | 2 | 5.8 | 6.9 |
| 2026-07 | mmol/mol | 1 | 9 | 9 |
| 2026-08 | % | 2 | 6.4 | 6.4 |
| 2026-08 | mmol/mol | 1 | 43 | 43 |
| 2026-09 | % | 2 | 5.9 | 6.3 |
| 2026-09 | mmol/mol | 1 | 54 | 54 |

## q2b_units_first_last

| units | results | patients | first_result | last_result |
| --- | --- | --- | --- | --- |
| % | 67 | 23 | 2023-10-21 | 2026-09-13 |
| mmol/mol | 9 | 6 | 2026-03-30 | 2026-09-07 |

## q2c_mmol_rows

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

## q2d_switch_not_one_org

| orgs_with_mmol | patients_with_mmol | mmol_results_since_switch | pct_results_since_switch |
| --- | --- | --- | --- |
| 8 | 6 | 9 | 9 |

## q3_corrected_metric

| month | t2d_results | t2d_naive_pct | t2d_corrected_pct | all_results | mmol_results | all_naive_pct | all_corrected_pct |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2025-04 | 0 |  |  | 1 | 0 | 100 | 100 |
| 2025-05 | 1 | 0 | 0 | 2 | 0 | 50 | 50 |
| 2025-07 | 2 | 100 | 100 | 3 | 0 | 100 | 100 |
| 2025-08 | 0 |  |  | 1 | 0 | 100 | 100 |
| 2025-09 | 2 | 0 | 0 | 4 | 0 | 50 | 50 |
| 2025-11 | 0 |  |  | 1 | 0 | 100 | 100 |
| 2025-12 | 0 |  |  | 4 | 0 | 100 | 100 |
| 2026-01 | 2 | 100 | 100 | 4 | 0 | 100 | 100 |
| 2026-02 | 0 |  |  | 1 | 0 | 100 | 100 |
| 2026-03 | 1 | 100 | 100 | 4 | 1 | 75 | 100 |
| 2026-04 | 0 |  |  | 1 | 1 | 0 | 100 |
| 2026-05 | 3 | 33.3 | 66.7 | 4 | 2 | 25 | 75 |
| 2026-06 | 3 | 33.3 | 100 | 3 | 2 | 33.3 | 100 |
| 2026-07 | 2 | 50 | 100 | 3 | 1 | 66.7 | 100 |
| 2026-08 | 0 |  |  | 3 | 1 | 66.7 | 100 |
| 2026-09 | 1 | 0 | 0 | 3 | 1 | 66.7 | 66.7 |

## q3b_before_after

| period | population | results | naive_pct | corrected_pct |
| --- | --- | --- | --- | --- |
| 1: 2025-04-01 to 2026-03-29 | T2D cohort | 8 | 62.5 | 62.5 |
| 1: 2025-04-01 to 2026-03-29 | other tested | 16 | 100 | 100 |
| 2: 2026-03-30 to 2026-09-30 | T2D cohort | 9 | 33.3 | 77.8 |
| 2: 2026-03-30 to 2026-09-30 | other tested | 9 | 55.6 | 100 |

## f2_duplicate_patient

| id | first | middle | last | birthdate | ssn | address | city | first_encounter | last_encounter | encounters |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| d1e0303f-62e7-0cd8-a588-3dd21dc975f6 | Lien262 | Sallie654 | Hessel84 | 1982-11-18 | 999-10-8466 | 470 Hane Mill | Mansfield | 2024-11-28 | 2025-11-14 | 3 |
| 704b7b53-21ff-4b35-bd8f-057b9597b58b | Line | Sallie654 | Hessel84 | 1982-11-18 | 999-10-8466 | 470 HANE MILL | Mansfield | 2026-05-04 | 2026-08-12 | 4 |

## f2b_patient_counts

| patient_rows | distinct_ssn | distinct_person_keys |
| --- | --- | --- |
| 115 | 114 | 114 |

## f3_meter_outage_by_day

| reading_date | g2_readings | g3_readings | g3_plus_readings |
| --- | --- | --- | --- |
| 2026-01-07 | 10 | 8 | 11 |
| 2026-01-08 | 10 | 8 | 11 |
| 2026-01-09 | 0 | 8 | 11 |
| 2026-01-10 | 0 | 8 | 11 |
| 2026-01-11 | 0 | 8 | 11 |
| 2026-01-12 | 0 | 8 | 11 |
| 2026-01-13 | 0 | 8 | 11 |
| 2026-01-14 | 0 | 8 | 11 |
| 2026-01-15 | 0 | 8 | 11 |
| 2026-01-16 | 0 | 8 | 11 |
| 2026-01-17 | 0 | 8 | 11 |
| 2026-01-18 | 0 | 8 | 11 |
| 2026-01-19 | 0 | 8 | 11 |
| 2026-01-20 | 0 | 8 | 11 |
| 2026-01-21 | 10 | 8 | 11 |
| 2026-01-22 | 10 | 8 | 11 |

## f3b_meter_coverage

| model | meters | expected_readings | actual_readings | missing_readings |
| --- | --- | --- | --- | --- |
| GlucoSense G2 | 10 | 3650 | 3530 | 120 |
| GlucoSense G3 | 8 | 2920 | 2920 | 0 |
| GlucoSense G3 Plus | 12 | 4166 | 4166 | 0 |

## f3c_missing_days_per_meter

| model | meters_with_gaps | missing_meter_days | first_missing_day | last_missing_day |
| --- | --- | --- | --- | --- |
| GlucoSense G2 | 10 | 120 | 2026-01-09 | 2026-01-20 |

## f4_hypertension_icd10

| system | code | description | rows | patients | first_start | last_start |
| --- | --- | --- | --- | --- | --- | --- |
| SNOMED-CT | 59621000 | Essential hypertension (disorder) | 28 | 28 | 1937-03-21 | 2026-07-27 |
| ICD-10-CM | I10 | Essential (primary) hypertension | 1 | 1 | 2025-12-23 | 2025-12-23 |

## f4b_i10_patient_missing_from_snomed_registry

| patient | start | system | code | has_snomed_hypertension | systolic_that_day |
| --- | --- | --- | --- | --- | --- |
| cd50a10e-37ea-7e09-7b15-0aefb9fc7f31 | 2025-12-23 | ICD-10-CM | I10 | False | 139 |

## f4c_condition_systems

| system | rows |
| --- | --- |
| SNOMED-CT | 1747 |
| ICD10 | 72 |
| ICD-10-CM | 1 |

## chk_duplicate_observations

| date | patient | encounter | duplicated_codes |
| --- | --- | --- | --- |
| 2026-01-23 | b9b2b88c-01c8-c883-81d2-b72c68ba55bc | 635dd15c-2b6e-36eb-ffbf-c4276f37cc56 | 7 |

## chk_duplicate_panel_is_double_order

| code | description | rows | distinct_values |
| --- | --- | --- | --- |
| 20565-8 | Carbon dioxide  total [Moles/volume] in Blood | 2 | 1 |
| 2069-3 | Chloride [Moles/volume] in Blood | 2 | 1 |
| 2339-0 | Glucose [Mass/volume] in Blood | 2 | 1 |
| 2947-0 | Sodium [Moles/volume] in Blood | 2 | 1 |
| 33914-3 | Glomerular filtration rate/1.73 sq M.predicted [Volume Rate/Area] in Serum or Plasma by Creatinine-based formula (MDRD) | 2 | 2 |
| 38483-4 | Creatinine [Mass/volume] in Blood | 2 | 2 |
| 49765-1 | Calcium [Mass/volume] in Blood | 2 | 1 |
| 6298-4 | Potassium [Moles/volume] in Blood | 2 | 1 |
| 6299-2 | Urea nitrogen [Mass/volume] in Blood | 2 | 1 |

## chk_integrity

| non_synthetic_patients | encounters_stop_before_start | orphan_encounters | orphan_observations | observations_after_death | readings_device_mismatch | readings_not_mg_dl | bad_medication_rows |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## chk_low_readings_follow_low_hba1c

| patient | model | readings_under_40 | avg_hba1c_pct |
| --- | --- | --- | --- |
| b9b2b88c-01c8-c883-81d2-b72c68ba55bc | GlucoSense G3 | 122 | 3.11 |
| ee56bf6a-f0da-f73a-f099-e2b174fc70a2 | GlucoSense G3 Plus | 122 | 3.23 |

## chk_complications_without_t2d_dx

| patients | earliest_complication | latest_complication |
| --- | --- | --- |
| 10 | 1959-12-06 | 2023-07-14 |
