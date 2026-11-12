REPLAY (no key) / OFFLINE evidence. Dataset: P2 synthea-analytics-10k (10,000 living patients, 11,842 patient rows).

- Dataset choice: cached P2 pack, verify.py PASS.
- Definition: demos/_shared/data-packs/synthea-analytics/hba1c-control.sql
- headline (hba1c_control_monthly, SNOMED 44054006 or ICD-10-CM E11.9): March 2026 93.0% (199/214); without conversion 67.8% (145/214)
- naive (hba1c_control_monthly_by_cohort, SNOMED 44054006 only): March 2026 93.4% (199/213); without conversion 68.1% (145/213)
- Q2: October 2023 had the fewest visits, 4,136. The largest visit type that month was Encounter for problem (procedure), 1,100.
- Q3: The busiest 10% of patients account for 84,104 of 167,424 visits (50.2%).
- Answer-key scorer (answer-keys://analytics-10k/): not run. The private keys are not on this machine.
