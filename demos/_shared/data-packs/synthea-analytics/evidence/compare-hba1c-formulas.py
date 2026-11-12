#!/usr/bin/env python3
"""Runs the two HbA1c conversions that disagreed on the same pack and lists every row where the decision differs.

    compare-hba1c-formulas.py <pack_dir> [YYYY-MM]

old_l13:   IFCC / 10.929 + 2.15 (L13 replay before the shared definition), then value < 7
shared:    0.09148 * IFCC + 2.152 (the shared definition and G10), then value < 7
Same cohort (SNOMED 44054006), same rows (one per observation), same strict threshold. Only the conversion differs.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import hba1c_control as h  # noqa: E402

pack, month = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "2026-03")
con = h.connect(pack)
con.execute(
    """create temp view r as
    select o.patient, o.date::date as day, o.units, o.value_num as v,
      case when o.units = 'mmol/mol' then o.value_num / 10.929 + 2.15 else o.value_num end as old_l13,
      case when o.units = 'mmol/mol' then 0.09148 * o.value_num + 2.152 else o.value_num end as shared
    from observations o
    where o.code = '4548-4' and o.patient in (select patient from conditions where code = '44054006')"""
)
cols = "count(*) n, sum((old_l13 < 7)::int) old_controlled, sum((shared < 7)::int) shared_controlled"
tail = "where strftime(day, '%Y-%m') = ?"
print(f"month {month}")
n, old_k, new_k = con.execute(f"select {cols} from r {tail}", [month]).fetchone()
print(f"  rows (denominator, both): {n}")
print(f"  old_l13  controlled {old_k}/{n} = {round(100.0 * old_k / n, 1)}%")
print(f"  shared   controlled {new_k}/{n} = {round(100.0 * new_k / n, 1)}%")
print(f"  <= 7 instead of < 7 (shared conversion): {con.execute(f'select sum((shared <= 7)::int) from r {tail}', [month]).fetchone()[0]}/{n}")
print("rows where the two conversions disagree on < 7, this month:")
for row in con.execute(
    f"select patient, day, units, v, round(old_l13, 5), round(shared, 5) from r {tail} and (old_l13 < 7) <> (shared < 7) order by day",
    [month],
).fetchall():
    print("  ", row)
print("all months, same disagreement, by raw value:")
for row in con.execute(
    "select units, v, count(*), round(any_value(old_l13), 5), round(any_value(shared), 5) from r "
    "where (old_l13 < 7) <> (shared < 7) group by all order by 2"
).fetchall():
    print("  ", row)
print("all months: total cohort rows", con.execute("select count(*) from r").fetchone()[0])
