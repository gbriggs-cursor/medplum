-- Shared HbA1c control definition for the Synthea analytics packs. Written down in README.md ("Metrics").
-- The caller provides tables or views named observations and conditions (pack schema), then runs this file.
-- Everything is TEMP so it also loads into a read-only analytics.duckdb.

-- NGSP percent from IFCC mmol/mol is 0.09148 * IFCC + 2.152. 53 mmol/mol converts to 7.00044, which is not under 7.
-- Any other unit becomes NULL and is excluded by hba1c_t2dm_results.
create or replace temp macro hba1c_ngsp_pct(v, u) as
  case when u = 'mmol/mol' then 0.09148 * v + 2.152 when u = '%' then v end;

-- One row per HbA1c observation (not per patient) for patients with type 2 diabetes (SNOMED 44054006).
-- No living-patient filter and no date filter here.
create or replace temp view hba1c_t2dm_results as
select o.patient, o.date, o.units, o.value_num as value_raw, hba1c_ngsp_pct(o.value_num, o.units) as value_pct
from observations o
where o.code = '4548-4'
  and o.value_num is not null
  and o.units in ('%', 'mmol/mol')
  and o.patient in (select patient from conditions where code = '44054006');

-- Controlled means value_pct < 7 (strict). control_pct is rounded to one decimal only here, after the counts.
-- control_pct_naive applies the threshold to raw values and ignores units; it is what a dashboard that never
-- converts reports.
create or replace temp view hba1c_control_monthly as
select
  date_trunc('month', date)::date as month,
  count(*) as n,
  sum((units = 'mmol/mol')::int) as mmol_rows,
  sum((value_pct < 7)::int) as controlled_n,
  round(100.0 * sum((value_pct < 7)::int) / count(*), 1) as control_pct,
  round(100.0 * sum((value_raw < 7)::int) / count(*), 1) as control_pct_naive
from hba1c_t2dm_results
group by 1;
