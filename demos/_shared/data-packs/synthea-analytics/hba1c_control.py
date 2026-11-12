#!/usr/bin/env python3
"""The one HbA1c control calculation for the analytics packs (definition: README.md, "Metrics").

Python:
    import hba1c_control as h
    con = h.connect(pack_dir)                  # analytics.duckdb if present, otherwise views over parquet/*.parquet
    h.install(con)                             # loads hba1c-control.sql
    rows = h.monthly(con, "2026-02", "2026-03")                     # headline cohort (t2dm_value_set)
    rows = h.monthly(con, "2026-02", "2026-03", cohort=h.SNOMED_ONLY)

Each row: cohort, month, n, mmol_rows, controlled_n, control_pct, controlled_raw_n, control_pct_raw.

Command line (for non-Python callers, prints JSON):
    hba1c_control.py <pack_dir> [--from YYYY-MM] [--to YYYY-MM] [--cohort t2dm_value_set|snomed_44054006|all]
"""

import argparse
import json
import os
import sys

import duckdb

HERE = os.path.dirname(os.path.abspath(__file__))
SQL_PATH = os.path.join(HERE, "hba1c-control.sql")
HEADLINE = "t2dm_value_set"
SNOMED_ONLY = "snomed_44054006"
COHORTS = [HEADLINE, SNOMED_ONLY]
TABLES = [
    "patients",
    "organizations",
    "providers",
    "encounters",
    "conditions",
    "observations",
    "medications",
    "devices",
    "device_readings",
]


def connect(pack_dir):
    db = os.path.join(pack_dir, "analytics.duckdb")
    if os.path.exists(db):
        return duckdb.connect(db, read_only=True)
    con = duckdb.connect()
    for table in TABLES:
        path = os.path.join(pack_dir, "parquet", f"{table}.parquet")
        con.execute(f"create view {table} as select * from '{path}'")
    return con


def install(con):
    with open(SQL_PATH) as fh:
        con.execute(fh.read())


def monthly(con, start=None, end=None, cohort=HEADLINE):
    """Monthly rows. start and end are YYYY-MM, both inclusive. cohort is one of COHORTS, or None for both."""
    where, params = [], []
    if cohort is not None:
        if cohort not in COHORTS:
            raise ValueError(f"unknown cohort {cohort}; use one of {COHORTS}")
        where.append("cohort = ?")
        params.append(cohort)
    if start:
        where.append("month >= ?::date")
        params.append(f"{start}-01")
    if end:
        where.append("month <= ?::date")
        params.append(f"{end}-01")
    sql = "select * from hba1c_control_monthly_by_cohort"
    if where:
        sql += " where " + " and ".join(where)
    cur = con.execute(sql + " order by cohort, month", params)
    names = [d[0] for d in cur.description]
    return [dict(zip(names, row)) for row in cur.fetchall()]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pack_dir")
    ap.add_argument("--from", dest="start")
    ap.add_argument("--to", dest="end")
    ap.add_argument("--cohort", default=HEADLINE, choices=COHORTS + ["all"])
    args = ap.parse_args()
    con = connect(args.pack_dir)
    install(con)
    rows = monthly(con, args.start, args.end, None if args.cohort == "all" else args.cohort)
    for row in rows:
        row["month"] = row["month"].isoformat()
    json.dump(rows, sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
