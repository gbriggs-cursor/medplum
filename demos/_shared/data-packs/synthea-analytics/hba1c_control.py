#!/usr/bin/env python3
"""The one HbA1c control calculation for the analytics packs (definition: README.md, "Metrics").

Python:
    import hba1c_control as h
    con = h.connect(pack_dir)          # analytics.duckdb if present, otherwise views over parquet/*.parquet
    h.install(con)                     # loads hba1c-control.sql
    rows = h.monthly(con, "2026-03")   # list of dicts: month, n, mmol_rows, controlled_n, control_pct, control_pct_naive

Command line (for non-Python callers, prints JSON):
    hba1c_control.py <pack_dir> [--from YYYY-MM] [--to YYYY-MM]
"""

import argparse
import json
import os
import sys

import duckdb

HERE = os.path.dirname(os.path.abspath(__file__))
SQL_PATH = os.path.join(HERE, "hba1c-control.sql")
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


def _month_start(text):
    return f"{text}-01"


def monthly(con, start=None, end=None):
    """Monthly rows from hba1c_control_monthly. start and end are YYYY-MM, both inclusive."""
    where, params = [], []
    if start:
        where.append("month >= ?::date")
        params.append(_month_start(start))
    if end:
        where.append("month <= ?::date")
        params.append(_month_start(end))
    sql = "select * from hba1c_control_monthly"
    if where:
        sql += " where " + " and ".join(where)
    cur = con.execute(sql + " order by month", params)
    names = [d[0] for d in cur.description]
    return [dict(zip(names, row)) for row in cur.fetchall()]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pack_dir")
    ap.add_argument("--from", dest="start")
    ap.add_argument("--to", dest="end")
    args = ap.parse_args()
    con = connect(args.pack_dir)
    install(con)
    rows = monthly(con, args.start, args.end)
    for row in rows:
        row["month"] = row["month"].isoformat()
    json.dump(rows, sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
