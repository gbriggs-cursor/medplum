#!/usr/bin/env python3
"""Checks the shared HbA1c control definition. No test framework needed.

    python3 test_hba1c_control.py [pack_dir ...]

Always runs the definition cases on a tiny synthetic table and loads fixture-100 (and the installed 10k pack when
it is on disk). Pinned per-pack values are not in this repo: they are read from expected-metrics.json in the answer
key directory (--answer-key-dir, $L13_ANSWER_KEY_DIR, or ~/.cache/medplum-demos/answer-keys/analytics-10k). Without
that file the pack checks print "answer key absent" and only check that the views load.
"""

import argparse
import json
import os
import sys

import duckdb

import hba1c_control as h

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_KEY_DIR = os.path.expanduser("~/.cache/medplum-demos/answer-keys/analytics-10k")
failures = 0


def check(ok, msg):
    global failures
    print(f"{'ok  ' if ok else 'FAIL'} {msg}")
    failures += 0 if ok else 1


def definition_cases():
    con = duckdb.connect()
    con.execute("create table conditions (patient varchar, system varchar, code varchar)")
    con.execute(
        "create table observations (patient varchar, date timestamp, code varchar, value_num double, units varchar)"
    )
    con.execute(
        "insert into conditions values ('s1','SNOMED-CT','44054006'),('s2','SNOMED-CT','44054006'),"
        "('i1','ICD-10-CM','E11.9'),('x1','ICD10','E11.9'),('nd','SNOMED-CT','15777000')"
    )
    rows = [
        ("s1", "2024-05-01", "4548-4", 6.9, "%"),
        ("s1", "2024-05-02", "4548-4", 7.0, "%"),
        ("s1", "2024-05-03", "4548-4", 7.1, "%"),
        ("s2", "2024-05-04", "4548-4", 52, "mmol/mol"),
        ("s2", "2024-05-05", "4548-4", 53, "mmol/mol"),
        ("s2", "2024-05-06", "4548-4", 6.0, "mg/dL"),
        ("i1", "2024-05-07", "4548-4", 6.5, "%"),
        ("x1", "2024-05-08", "4548-4", 6.5, "%"),
        ("nd", "2024-05-09", "4548-4", 5.0, "%"),
        ("s1", "2024-05-10", "9999-9", 5.0, "%"),
        ("s1", "2024-06-01", "4548-4", 6.5, "%"),
    ]
    con.executemany("insert into observations values (?,?,?,?,?)", rows)
    h.install(con)
    head = h.monthly(con, "2024-05", "2024-05")[0]
    snomed = h.monthly(con, "2024-05", "2024-05", cohort=h.SNOMED_ONLY)[0]
    check(head["n"] == 6, f"headline cohort: SNOMED 44054006 or ICD-10-CM E11.9, matched on system (n={head['n']})")
    check(snomed["n"] == 5, f"SNOMED-only cohort leaves out the ICD-10-CM patient (n={snomed['n']})")
    check(head["controlled_n"] == 3, f"6.9%, 52 mmol/mol and 6.5% are controlled; 7.0%, 7.1%, 53 mmol/mol are not ({head['controlled_n']})")
    check(head["control_pct"] == 50.0, f"control_pct = 3/6 rounded once (got {head['control_pct']})")
    check(head["controlled_raw_n"] == 2 and head["control_pct_raw"] == 33.3, f"raw threshold on stored values ({head['controlled_raw_n']}, {head['control_pct_raw']})")
    check(head["mmol_rows"] == 2, f"mmol_rows (got {head['mmol_rows']})")
    pct53 = float(con.execute("select hba1c_ngsp_pct(53, 'mmol/mol')").fetchone()[0])
    check(abs(pct53 - 7.00044) < 1e-9, f"53 mmol/mol converts to 7.00044 (got {pct53})")
    check(con.execute("select hba1c_ngsp_pct(6, 'mg/dL')").fetchone()[0] is None, "unknown units convert to NULL")
    check(len(h.monthly(con, "2024-06", "2024-06")) == 1, "the next month is its own row")
    check(
        con.execute("select count(*) from hba1c_control_monthly").fetchone()[0] == 2,
        "hba1c_control_monthly is the headline cohort only",
    )


def pack_cases(pack_dir, expected):
    name = json.load(open(os.path.join(pack_dir, "MANIFEST.json")))["pack"]
    con = h.connect(pack_dir)
    h.install(con)
    total = con.execute("select count(*) from hba1c_control_monthly_by_cohort").fetchone()[0]
    check(total > 0, f"{name}: views load ({total} cohort-months)")
    want = (expected or {}).get(name)
    if want is None:
        print(f"skip {name}: answer key absent, pinned values not checked")
        return
    for cohort, months in want.items():
        for month, row in months.items():
            got = h.monthly(con, month, month, cohort=cohort)
            if row is None:
                check(got == [], f"{name} {cohort} {month}: no rows")
                continue
            got_row = {k: got[0][k] for k in row} if got else None
            check(got_row == row, f"{name} {cohort} {month}: matches the pinned values")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("packs", nargs="*")
    ap.add_argument("--answer-key-dir")
    args = ap.parse_args()
    key_dir = args.answer_key_dir or os.environ.get("L13_ANSWER_KEY_DIR") or DEFAULT_KEY_DIR
    path = os.path.join(key_dir, "expected-metrics.json")
    expected = json.load(open(path))["packs"] if os.path.isfile(path) else None
    print("answer key present" if expected else "answer key absent")

    definition_cases()
    packs = args.packs or [os.path.join(HERE, "fixture-100")]
    installed = os.path.expanduser("~/.cache/medplum-demos/synthea-analytics-10k")
    if not args.packs and os.path.exists(os.path.join(installed, "MANIFEST.json")):
        packs.append(installed)
    for pack in packs:
        pack_cases(pack, expected)
    print(f"{'PASS' if failures == 0 else 'FAIL'}: hba1c control ({failures} failed)")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
