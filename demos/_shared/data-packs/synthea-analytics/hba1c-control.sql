-- HbA1c control, the shared definition for the Synthea analytics packs. Written down in README.md ("Metrics").
-- The caller provides tables or views named observations and conditions (pack schema), then runs this file.
-- Everything is TEMP so it also loads into a read-only analytics.duckdb.

-- Type 2 diabetes value set. Matched on system and code together.
create or replace temp view hba1c_t2dm_value_set as
select * from (values ('SNOMED-CT', '44054006'), ('ICD-10-CM', 'E11.9')) as v(system, code);

-- NGSP percent. IFCC mmol/mol uses the NGSP master equation 0.09148 * IFCC + 2.152. Other units give NULL.
create or replace temp macro hba1c_ngsp_pct(v, u) as
  case when u = 'mmol/mol' then 0.09148 * v + 2.152 when u = '%' then v end;

-- t2dm_value_set is the headline cohort. snomed_44054006 is the SNOMED-only cohort, kept for comparison.
create or replace temp view hba1c_cohorts as
select distinct c.patient, 't2dm_value_set' as cohort
from conditions c join hba1c_t2dm_value_set s on s.system = c.system and s.code = c.code
union all
select distinct patient, 'snomed_44054006' as cohort
from conditions
where system = 'SNOMED-CT' and code = '44054006';

-- One row per HbA1c observation (LOINC 4548-4) per cohort. No living-patient or per-patient filter.
create or replace temp view hba1c_results as
select k.cohort, o.patient, o.date, o.units, o.value_num as value_raw, hba1c_ngsp_pct(o.value_num, o.units) as value_pct
from observations o
join hba1c_cohorts k on k.patient = o.patient
where o.code = '4548-4'
  and o.value_num is not null
  and o.units in ('%', 'mmol/mol');

-- Controlled means value_pct < 7 (strict). Rates are rounded to one decimal once, after the counts.
-- control_pct_raw applies the same threshold to value_raw, the value as stored.
create or replace temp view hba1c_control_monthly_by_cohort as
select
  cohort,
  date_trunc('month', date)::date as month,
  count(*) as n,
  sum((units = 'mmol/mol')::int) as mmol_rows,
  sum((value_pct < 7)::int) as controlled_n,
  round(100.0 * sum((value_pct < 7)::int) / count(*), 1) as control_pct,
  sum((value_raw < 7)::int) as controlled_raw_n,
  round(100.0 * sum((value_raw < 7)::int) / count(*), 1) as control_pct_raw
from hba1c_results
group by 1, 2;

create or replace temp view hba1c_control_monthly as
select * from hba1c_control_monthly_by_cohort where cohort = 't2dm_value_set';
