REPLAY (no key) / OFFLINE evidence. Dataset: P2 synthea-analytics-10k (10,000 living patients, 11,842 patient rows).

- Dataset choice: cached P2 pack, verify.py PASS.
- Control: Share of type 2 diabetes (SNOMED 44054006) HbA1c results (LOINC 4548-4) under 7%. mmol/mol is converted first: NGSP % = 0.09148 * IFCC mmol/mol + 2.152.
- HbA1c in mmol/mol from 2026-03-07, 2126 rows.
- 2026-01: n=241, mmol/mol rows=0, naive 95.9%, normalized 95.9%
- 2026-02: n=217, mmol/mol rows=0, naive 96.8%, normalized 96.8%
- 2026-03: n=213, mmol/mol rows=73, naive 68.1%, normalized 93.4%
- 2026-04: n=226, mmol/mol rows=82, naive 65.9%, normalized 93.8%
- Q2: October 2023 had the fewest visits, 4,136. The largest visit type that month was Encounter for problem (procedure), 1,100.
- Q3: The busiest 10% of patients account for 84,104 of 167,424 visits (50.2%).
- Answer-key scorer (answer-keys://analytics-10k/): not run. The private keys are not on this machine.
