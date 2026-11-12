#!/usr/bin/env python3
"""Loads a Parquet pack into one DuckDB file. With --manifest, also writes MANIFEST.json.

    build-db.py <parquet_dir> [--db <path>] [--pack <name>] [--manifest] [--no-db]

Defaults: <parquet_dir>/../analytics.duckdb, pack name = parent folder name.
"""

import argparse
import hashlib
import json
import os

import duckdb

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


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("parquet_dir")
    ap.add_argument("--db")
    ap.add_argument("--pack")
    ap.add_argument("--manifest", action="store_true", help="write MANIFEST.json")
    ap.add_argument("--no-db", action="store_true", help="skip analytics.duckdb")
    args = ap.parse_args()

    root = os.path.dirname(os.path.abspath(args.parquet_dir))
    db = args.db or os.path.join(root, "analytics.duckdb")

    if not args.no_db:
        if os.path.exists(db):
            os.remove(db)
        out = duckdb.connect(db)
        for t in TABLES:
            out.execute(f"create table {t} as select * from '{os.path.join(args.parquet_dir, t)}.parquet'")
        out.close()
        print(f"build-db: wrote {db}")

    if args.manifest:
        manifest = {
            "pack": args.pack or os.path.basename(root),
            "synthetic": True,
            "tag": "HTEST",
            "duckdb_version": duckdb.__version__,
            "tables": {},
        }
        con = duckdb.connect()
        for t in TABLES:
            path = os.path.join(args.parquet_dir, f"{t}.parquet")
            n = con.execute(f"select count(*) from '{path}'").fetchone()[0]
            manifest["tables"][t] = {"file": os.path.relpath(path, root), "rows": n, "sha256": sha256(path)}
            print(f"build-db: {t:16} {n:>10} rows")
        with open(os.path.join(root, "MANIFEST.json"), "w") as f:
            json.dump(manifest, f, indent=2)
            f.write("\n")
        print(f"build-db: wrote {os.path.join(root, 'MANIFEST.json')}")


if __name__ == "__main__":
    main()
