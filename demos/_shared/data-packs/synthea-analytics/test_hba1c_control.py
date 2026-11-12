#!/usr/bin/env python3
"""Checks the shared HbA1c control definition. No test framework needed.

    python3 test_hba1c_control.py [pack_dir ...]

Always runs the boundary cases on a tiny synthetic table and the committed fixture-100. Also runs the installed
10k pack (~/.cache/medplum-demos/synthea-analytics-10k) when it is on disk, or any pack_dir given.
"""

import json
import os
import sys

import duckdb

import hba1c_control as h

HERE = os.path.dirname(os.path.abspath(__file__))
EXPECTED = json.load(open(os.path.join(HERE, "hba1c-control.expected.json")))["packs"]
failures = 0


def check(ok, msg):
    global failures
    print(f"{'ok  ' if ok else 'FAIL'} {msg}")
    failures += 0 if ok else 1


def boundary_cases():
    con = duckdb.connect()
    con.execute("create table conditions (patient varchar, code varchar)")
    con.execute(
        "create table observations (patient varchar, date timestamp, code varchar, value_num double, units varchar)"
    )
    con.execute("insert into conditions values ('d1','44054006'),('d2','44054006'),('nd','15777000')")
    rows = [
        ("d1", "2026-03-01", "4548-4", 6.9, "%"),
        ("d1", "2026-03-02", "4548-4", 7.0, "%"),
        ("d1", "2026-03-03", "4548-4", 7.1, "%"),
        ("d2", "2026-03-04", "4548-4", 52, "mmol/mol"),
        ("d2", "2026-03-05", "4548-4", 53, "mmol/mol"),
        ("d2", "2026-03-06", "4548-4", 54, "mmol/mol"),
        ("d2", "2026-03-07", "4548-4", 6.0, "mg/dL"),
        ("nd", "2026-03-08", "4548-4", 5.0, "%"),
        ("d1", "2026-03-09", "9999-9", 5.0, "%"),
        ("d1", "2026-04-01", "4548-4", 6.5, "%"),
    ]
    con.executemany("insert into observations values (?,?,?,?,?)", rows)
    h.install(con)
    march = h.monthly(con, "2026-03", "2026-03")[0]
    check(march["n"] == 6, f"March counts only type 2 diabetes HbA1c rows in % or mmol/mol (n={march['n']})")
    check(march["controlled_n"] == 2, f"6.9% and 52 mmol/mol are controlled; 7.0%, 53, 7.1, 54 are not (controlled_n={march['controlled_n']})")
    check(march["control_pct"] == 33.3, f"control_pct is 2/6 rounded once to one decimal (got {march['control_pct']})")
    check(march["mmol_rows"] == 3, f"mmol_rows counts mmol/mol rows (got {march['mmol_rows']})")
    check(march["control_pct_naive"] == 16.7, f"naive threshold on raw values reads every mmol/mol row as over 7 (got {march['control_pct_naive']})")
    pct53 = float(con.execute("select hba1c_ngsp_pct(53, 'mmol/mol')").fetchone()[0])
    check(abs(pct53 - 7.00044) < 1e-9, f"53 mmol/mol converts to 7.00044 (got {pct53})")
    check(con.execute("select hba1c_ngsp_pct(6, 'mg/dL')").fetchone()[0] is None, "unknown units convert to NULL")
    check(len(h.monthly(con, "2026-04", "2026-04")) == 1, "April is its own month")


def pack_cases(pack_dir):
    manifest = json.load(open(os.path.join(pack_dir, "MANIFEST.json")))
    name = manifest["pack"]
    want = EXPECTED.get(name)
    if want is None:
        print(f"skip {pack_dir}: no expectations for pack {name}")
        return
    con = h.connect(pack_dir)
    h.install(con)
    total = con.execute("select sum(n), sum(controlled_n) from hba1c_control_monthly").fetchone()
    check((total[0], total[1]) == (want["cohort_rows"], want["controlled_rows"]), f"{name}: cohort rows and controlled rows {tuple(total)}")
    for month, expected in want["months"].items():
        got = h.monthly(con, month, month)
        if expected is None:
            check(got == [], f"{name} {month}: no cohort rows")
            continue
        row = {k: got[0][k] for k in expected} if got else None
        check(row == expected, f"{name} {month}: {row}")


def main():
    boundary_cases()
    packs = sys.argv[1:] or [os.path.join(HERE, "fixture-100")]
    installed = os.path.expanduser("~/.cache/medplum-demos/synthea-analytics-10k")
    if not sys.argv[1:] and os.path.exists(os.path.join(installed, "MANIFEST.json")):
        packs.append(installed)
    for pack in packs:
        pack_cases(pack)
    print(f"{'PASS' if failures == 0 else 'FAIL'}: hba1c control ({failures} failed)")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
