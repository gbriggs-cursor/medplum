# Foo Medical: practice analytics findings

Analyst run for a customer practice's office manager. Questions from `demos/practice-analytics/seed/questions.md`, with
prospect Foo Medical and month March 2026.

**Data used.** The P2 10,000-patient pack was not on this machine: `~/.cache/medplum-demos/synthea-analytics-10k` does
not exist. As the data contract allows, every number below comes from the committed P0 fixture
`demos/_shared/data-packs/synthea-analytics/fixture-100` (its `MANIFEST.json` says `"planted": true`). That is 115
patient rows, 1,322 encounters, and 76 HbA1c results. The mechanism found in question 1 should carry over to P2, but
P2's counts and rates will differ. Re-run the same SQL against `analytics.duckdb` once P2 is installed.

All data is synthetic (Synthea, `tag = 'HTEST'`). Queries ran in DuckDB (Python package) over views on the fixture
Parquet files:

```sql
-- P = demos/_shared/data-packs/synthea-analytics/fixture-100/parquet
create view patients      as select * from 'P/patients.parquet';
create view conditions    as select * from 'P/conditions.parquet';
create view observations  as select * from 'P/observations.parquet';
create view encounters    as select * from 'P/encounters.parquet';
create view organizations as select * from 'P/organizations.parquet';
```

---

## 1. "The share of our type 2 diabetes patients with an HbA1c under 7% dropped in March 2026. Why?"

**Answer.** The drop comes from a change in reporting units, not from patients getting worse. Starting with a result on
2026-03-30, some organizations began reporting HbA1c (LOINC `4548-4`) in IFCC units (`mmol/mol`) instead of NGSP units
(`%`). Those results use the same LOINC code and the same `value_num` column, and only the `units` column changes. A
check written as `value_num < 7` therefore reads a well-controlled 44 mmol/mol (6.2%) as "not under 7". From March 2026
on, 9 of the 21 HbA1c results are in `mmol/mol`, from 8 organizations; before March 2026 there were none. In March 2026,
the share of HbA1c results under 7% drops from 100% to 75% when computed on raw values. After converting `mmol/mol` to
`%` (NGSP = IFCC / 10.929 + 2.15), March is back to 100%. Every converted value lines up with the same patient's earlier
`%` results: for example, 4dc6345e had 7.1% twice in 2025, and later 54 mmol/mol, which is 7.1%. The fix is to normalize
units before applying the 7% threshold, or to filter on `units = '%'` and convert the rest, and to ask the reporting
organizations about the switch. Caveat for the fixture: its type 2 diabetes cohort is only 3–4 patients, and none had an
HbA1c in March 2026. So the cohort-level rate in this fixture does not move in March. The March drop shows up in the
panel-wide result rate, which is the same mechanism the 10k cohort would be exposed to. In the fixture, only one type 2
diabetes patient has a `mmol/mol` result (54 mmol/mol on 2026-09-07), and it converts to 7.1%, which is still not under 7.

**SQL 1a. Monthly share of HbA1c results under 7%, raw values vs. normalized to %:**

```sql
with a1c as (
  select patient, date, value_num, units,
         case when units = 'mmol/mol' then round(value_num / 10.929 + 2.15, 1) else value_num end as pct
  from observations where code = '4548-4')
select strftime(date, '%Y-%m') as month, count(*) as tests,
       sum((value_num < 7)::int) as under7_raw, round(100.0 * sum((value_num < 7)::int) / count(*), 1) as pct_raw,
       sum((pct < 7)::int) as under7_normalized, round(100.0 * sum((pct < 7)::int) / count(*), 1) as pct_normalized,
       sum((units = 'mmol/mol')::int) as mmol_results
from a1c where date >= '2025-10-01' group by 1 order by 1;
```

| month   | tests | under7_raw | pct_raw | under7_normalized | pct_normalized | mmol_results |
| ------- | ----: | ---------: | ------: | ----------------: | -------------: | -----------: |
| 2025-11 |     1 |          1 |   100.0 |                 1 |          100.0 |            0 |
| 2025-12 |     4 |          4 |   100.0 |                 4 |          100.0 |            0 |
| 2026-01 |     4 |          4 |   100.0 |                 4 |          100.0 |            0 |
| 2026-02 |     1 |          1 |   100.0 |                 1 |          100.0 |            0 |
| 2026-03 |     4 |          3 |    75.0 |                 4 |          100.0 |            1 |
| 2026-04 |     1 |          0 |     0.0 |                 1 |          100.0 |            1 |
| 2026-05 |     4 |          1 |    25.0 |                 3 |           75.0 |            2 |
| 2026-06 |     3 |          1 |    33.3 |                 3 |          100.0 |            2 |
| 2026-07 |     3 |          2 |    66.7 |                 3 |          100.0 |            1 |
| 2026-08 |     3 |          2 |    66.7 |                 3 |          100.0 |            1 |
| 2026-09 |     3 |          2 |    66.7 |                 2 |           66.7 |            1 |

**SQL 1b. Units of HbA1c results before and after 2026-03-01:**

```sql
select o.units, o.date >= '2026-03-01' as from_march_2026, count(*) as results, count(distinct e.organization) as orgs
from observations o join encounters e on e.id = o.encounter
where o.code = '4548-4' group by all order by all;
```

| units    | from_march_2026 | results | orgs |
| -------- | --------------- | ------: | ---: |
| %        | false           |      55 |   28 |
| %        | true            |      12 |   12 |
| mmol/mol | true            |       9 |    8 |

**SQL 1c. Every `mmol/mol` result, with its organization and converted value:**

```sql
select o.date::date as date, o.patient, o.value_num, o.units, round(o.value_num / 10.929 + 2.15, 1) as pct,
       e.organization, g.name as organization_name,
       o.patient in (select patient from conditions
                     where (system = 'SNOMED-CT' and code = '44054006')
                        or (system in ('ICD-10-CM', 'ICD10') and code like 'E11%')) as is_t2d
from observations o join encounters e on e.id = o.encounter join organizations g on g.id = e.organization
where o.code = '4548-4' and o.units = 'mmol/mol' order by o.date;
```

| date       | patient  | value_num | units    | pct | organization_name                          | is_t2d |
| ---------- | -------- | --------: | -------- | --: | ------------------------------------------ | ------ |
| 2026-03-30 | 3663e822 |        44 | mmol/mol | 6.2 | WALPOLE MEDICAL CENTER PC                  | false  |
| 2026-04-30 | f87d3c47 |        45 | mmol/mol | 6.3 | SUNRISE HEALTHCARE LLC                     | false  |
| 2026-05-19 | db0a332f |        42 | mmol/mol | 6.0 | MINDFUL MEDICAL CARE PC                    | false  |
| 2026-05-29 | b9b2b88c |        13 | mmol/mol | 3.3 | HALLMARK HEALTH URGENT CARE PHYSICIANS LLC | false  |
| 2026-06-05 | b9b2b88c |         7 | mmol/mol | 2.8 | TUFTS MEDICAL CENTER                       | false  |
| 2026-06-26 | b9b2b88c |        10 | mmol/mol | 3.1 | TUFTS MEDICAL CENTER                       | false  |
| 2026-07-31 | b9b2b88c |         9 | mmol/mol | 3.0 | READING FAMILY MEDICINE PC                 | false  |
| 2026-08-24 | c5645a26 |        43 | mmol/mol | 6.1 | HOLYOKE HEALTH CENTER INC                  | false  |
| 2026-09-07 | 4dc6345e |        54 | mmol/mol | 7.1 | PRIMARY CARE NORTH PC                      | true   |

None of these 8 organizations reported a `%` HbA1c after its first `mmol/mol` result, so the pattern fits a
per-organization lab or interface change. With at most 2 post-change results per organization in the fixture, that
reading can't be confirmed here.

**SQL 1d. Type 2 diabetes cohort control rate by month.** Cohort: SNOMED `44054006` or ICD-10-CM `E11%`, onset on or
before month end, alive at month end, latest HbA1c in the trailing 12 months.

```sql
with t2d as (select patient, min(start) as onset from conditions
             where (system = 'SNOMED-CT' and code = '44054006')
                or (system in ('ICD-10-CM', 'ICD10') and code like 'E11%')
             group by 1),
a1c as (select patient, date, value_num, units,
               case when units = 'mmol/mol' then round(value_num / 10.929 + 2.15, 1) else value_num end as pct
        from observations where code = '4548-4'),
months as (select (d + interval 1 month - interval 1 day)::date as month_end, strftime(d, '%Y-%m') as month
           from range(date '2025-10-01', date '2026-10-01', interval 1 month) t(d)),
latest as (
  select m.month, a.patient, arg_max(a.value_num, a.date) as raw, arg_max(a.pct, a.date) as pct,
         arg_max(a.units, a.date) as units
  from months m
  join t2d t on t.onset <= m.month_end
  join patients p on p.id = t.patient and (p.deathdate is null or p.deathdate > m.month_end)
  join a1c a on a.patient = t.patient and a.date::date <= m.month_end and a.date::date > m.month_end - interval 12 month
  group by all)
select month, count(*) as denom,
       round(100.0 * sum((raw < 7)::int) / count(*), 1) as pct_raw,
       round(100.0 * sum((pct < 7)::int) / count(*), 1) as pct_normalized,
       sum((units = 'mmol/mol')::int) as latest_in_mmol
from latest group by 1 order by 1;
```

| month   | denom | pct_raw | pct_normalized | latest_in_mmol |
| ------- | ----: | ------: | -------------: | -------------: |
| 2025-10 |     3 |    33.3 |           33.3 |              0 |
| 2025-11 |     3 |    33.3 |           33.3 |              0 |
| 2025-12 |     3 |    33.3 |           33.3 |              0 |
| 2026-01 |     3 |    33.3 |           33.3 |              0 |
| 2026-02 |     3 |    33.3 |           33.3 |              0 |
| 2026-03 |     3 |    33.3 |           33.3 |              0 |
| 2026-04 |     3 |    33.3 |           33.3 |              0 |
| 2026-05 |     3 |    66.7 |           66.7 |              0 |
| 2026-06 |     4 |    75.0 |           75.0 |              0 |
| 2026-07 |     4 |    75.0 |           75.0 |              0 |
| 2026-08 |     4 |    75.0 |           75.0 |              0 |
| 2026-09 |     4 |    75.0 |           75.0 |              1 |

This is the fixture-size caveat: the cohort is too small to show the March drop, and its one `mmol/mol` result (7.1%)
is genuinely not under 7.

**Checked and ruled out (fixture):**

- No other HbA1c LOINC codes, such as `17856-6`, `4549-2`, or `41995-2`, are in use.
- There are no duplicate HbA1c rows by patient and date.
- No HbA1c row has a null or orphaned `encounter`.
- No type 2 diabetes diagnoses are coded in ICD-10. The 72 `ICD10` condition rows are Synthea's dental and oral codes.
  The single `ICD-10-CM` row is one hypertension diagnosis (`I10`, 2025-12-23), where Synthea would normally use
  SNOMED. So some recent diagnoses can arrive in ICD-10-CM, and a SNOMED-only type 2 diabetes cohort could miss E11.x
  patients on the 10k panel. The cohort SQL above includes ICD-10-CM `E11%` for that reason. The fixture has no E11
  rows, so its numbers do not change.

One cohort-definition note, not March-specific: 6 patients have "… due to type 2 diabetes mellitus" complication codes
(`90781000119102`, `157141000119108`) but no `44054006` row. A cohort that includes those codes would be larger.

---

## 2. "Which month had the fewest visits, and which visit types drove the dip?"

**Answer.** November 2023 had the fewest visits: 23 encounters, against an average of about 36.7 a month over October
2023 to September 2026. October 2023 is close behind at 24. Ambulatory visits drove the dip, with 15 against a monthly
average of 24.1. The biggest single type is "Encounter for problem (procedure)", with 2 against an average of 10.0. One
patient explains most of that gap. Patient `0bdcbc77-f005-ce18-d96f-3c5cf36fc0ca` (age 49) accounts for 349 encounters,
26% of all visits. 333 of those are recurring ambulatory "Encounter for problem" visits for chronic kidney disease stage
4, about 10–11 a month from January 2024. That patient's encounters start in December 2023, so October and November
2023 have none. Without this patient, November 2023 has 23 visits, a normal month. The quietest months are then July
2024 (14), October 2024 (15), and February 2024 (16). Wellness visits were also low in November 2023, with 3 against a
6.7 average. So the "dip" is mostly the absence of one heavy user's recurring visits, not a drop in demand.

```sql
select strftime(start, '%Y-%m') as month, count(*) as visits,
       count(*) filter (where patient = '0bdcbc77-f005-ce18-d96f-3c5cf36fc0ca') as top_patient,
       count(*) filter (where patient <> '0bdcbc77-f005-ce18-d96f-3c5cf36fc0ca') as others
from encounters group by 1 order by visits, month limit 5;
```

| month   | visits | top_patient | others |
| ------- | -----: | ----------: | -----: |
| 2023-11 |     23 |           0 |     23 |
| 2023-10 |     24 |           0 |     24 |
| 2024-07 |     25 |          11 |     14 |
| 2024-10 |     26 |          11 |     15 |
| 2025-01 |     27 |           8 |     19 |

```sql
with months as (select distinct strftime(start, '%Y-%m') as month from encounters),
cls as (select distinct encounter_class from encounters),
grid as (
  select m.month, c.encounter_class, count(e.id) as n
  from months m cross join cls c
  left join encounters e on strftime(e.start, '%Y-%m') = m.month and e.encounter_class = c.encounter_class
  group by all)
select encounter_class, round(avg(n), 1) as avg_per_month, sum(n) filter (where month = '2023-11') as nov_2023,
       round(sum(n) filter (where month = '2023-11') - avg(n), 1) as diff
from grid group by 1 order by diff;
```

| encounter_class | avg_per_month | nov_2023 | diff |
| --------------- | ------------: | -------: | ---: |
| ambulatory      |          24.1 |       15 | -9.1 |
| wellness        |           6.7 |        3 | -3.7 |
| urgentcare      |           0.6 |        0 | -0.6 |
| inpatient       |           0.4 |        0 | -0.4 |
| outpatient      |           3.4 |        3 | -0.4 |
| virtual         |           0.2 |        0 | -0.2 |
| snf             |           0.1 |        0 | -0.1 |
| emergency       |           1.3 |        2 |  0.7 |

```sql
select encounter_class, description, round(count(*) / 36.0, 2) as avg_per_month,
       count(*) filter (where strftime(start, '%Y-%m') = '2023-11') as nov_2023
from encounters group by all
order by count(*) filter (where strftime(start, '%Y-%m') = '2023-11') - count(*) / 36.0 limit 4;
```

| encounter_class | description                                | avg_per_month | nov_2023 |
| --------------- | ------------------------------------------ | ------------: | -------: |
| ambulatory      | Encounter for problem (procedure)          |         10.03 |        2 |
| wellness        | General examination of patient (procedure) |          4.72 |        2 |
| ambulatory      | Outpatient procedure                       |          1.42 |        0 |
| ambulatory      | Encounter for check up (procedure)         |          3.36 |        2 |

```sql
select encounter_class, description, reason_description, count(*) as visits,
       min(start)::date as first, max(start)::date as last
from encounters where patient = '0bdcbc77-f005-ce18-d96f-3c5cf36fc0ca'
group by all order by visits desc limit 3;
```

| encounter_class | description                                | reason_description                        | visits | first      | last       |
| --------------- | ------------------------------------------ | ----------------------------------------- | -----: | ---------- | ---------- |
| ambulatory      | Encounter for problem (procedure)          | Chronic kidney disease stage 4 (disorder) |    333 | 2024-01-26 | 2026-09-24 |
| ambulatory      | Encounter for problem (procedure)          | NULL                                      |      7 | 2023-12-04 | 2023-12-20 |
| wellness        | General examination of patient (procedure) | NULL                                      |      3 | 2024-01-12 | 2026-01-23 |

---

## 3. "What share of our visits comes from the busiest 10% of patients?"

**Answer.** The busiest 10% of patients account for **47.2% of all visits**: 624 of 1,322 encounters. I counted 101
patients with at least one visit between October 2023 and September 2026, and the top 10% rounds up to the 11 patients
with the most visits. Ties at the cutoff (21 visits) are broken by patient id. That share is dominated by the single
chronic kidney disease patient from question 2, who alone has 349 visits (26.4%). Without that patient, the other 10
patients in the top group account for 28.3% of the remaining visits. That is the more typical concentration for this
panel; the median patient had 7 visits. If "10% of patients" means all 115 patient rows, including the 14 with no
visits in the window, the top 12 patients give 48.8%.

```sql
with pv as (select p.id as patient, p.birthdate, count(e.id) as visits
            from patients p left join encounters e on e.patient = p.id group by all),
ranked as (select *, row_number() over (order by visits desc, patient) as rn, count(*) over () as n
           from pv where visits > 0)
select n as patients_with_visits, ceil(n * 0.10)::int as top_n,
       sum(visits) filter (where rn <= ceil(n * 0.10)) as top_visits, sum(visits) as all_visits,
       round(100.0 * sum(visits) filter (where rn <= ceil(n * 0.10)) / sum(visits), 1) as top_share_pct,
       round(100.0 * (sum(visits) filter (where rn <= ceil(n * 0.10)) - max(visits)) / (sum(visits) - max(visits)), 1)
         as top_share_excl_top1_pct
from ranked group by n;
```

| patients_with_visits | top_n | top_visits | all_visits | top_share_pct | top_share_excl_top1_pct |
| -------------------: | ----: | ---------: | ---------: | ------------: | ----------------------: |
|                  101 |    11 |        624 |       1322 |          47.2 |                    28.3 |

```sql
with pv as (select p.id as patient, p.birthdate, count(e.id) as visits
            from patients p left join encounters e on e.patient = p.id group by all)
select row_number() over (order by visits desc, patient) as rn, patient,
       date_diff('year', birthdate, date '2026-10-01') as age, visits,
       round(100.0 * visits / sum(visits) over (), 1) as pct_of_all
from pv order by rn limit 11;
```

|  rn | patient  | age | visits | pct_of_all |
| --: | -------- | --: | -----: | ---------: |
|   1 | 0bdcbc77 |  49 |    349 |       26.4 |
|   2 | 24b3f5e7 |  15 |     37 |        2.8 |
|   3 | abb08e7d |  78 |     34 |        2.6 |
|   4 | 67a85afa |  47 |     30 |        2.3 |
|   5 | 6e94ae7f |  30 |     30 |        2.3 |
|   6 | cf5a5a29 |  19 |     29 |        2.2 |
|   7 | 88809d0a |  33 |     25 |        1.9 |
|   8 | 6d11506c |  19 |     24 |        1.8 |
|   9 | 1a82772e |  36 |     23 |        1.7 |
|  10 | f02ba4fa |  17 |     22 |        1.7 |
|  11 | 46716f0c |  23 |     21 |        1.6 |
