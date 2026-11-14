#!/usr/bin/env python3
"""Checks a pack against its MANIFEST.json: every Parquet file present, sha256 and row counts match,
patients tagged synthetic + HTEST, and (if present) analytics.duckdb has the same row counts.

    verify.py <pack_dir>
"""

import hashlib
import json
import os
import sys

import duckdb


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    root = sys.argv[1]
    manifest = json.load(open(os.path.join(root, "MANIFEST.json")))
    con = duckdb.connect()
    failures = 0

    def check(ok, msg):
        nonlocal failures
        print(f"{'ok  ' if ok else 'FAIL'} {msg}")
        failures += 0 if ok else 1

    for t, info in manifest["tables"].items():
        path = os.path.join(root, info["file"])
        if not os.path.exists(path):
            check(False, f"{t}: missing {info['file']}")
            continue
        check(sha256(path) == info["sha256"], f"{t}: sha256")
        n = con.execute(f"select count(*) from '{path}'").fetchone()[0]
        check(n == info["rows"], f"{t}: {n} rows (manifest {info['rows']})")

    patients = os.path.join(root, manifest["tables"]["patients"]["file"])
    untagged = con.execute(f"select count(*) from '{patients}' where not synthetic or tag <> 'HTEST'").fetchone()[0]
    check(untagged == 0, f"patients: every row synthetic + HTEST ({untagged} untagged)")

    db = os.path.join(root, "analytics.duckdb")
    if os.path.exists(db):
        dbc = duckdb.connect(db, read_only=True)
        for t, info in manifest["tables"].items():
            n = dbc.execute(f"select count(*) from {t}").fetchone()[0]
            check(n == info["rows"], f"analytics.duckdb {t}: {n} rows")

    print(f"{'PASS' if failures == 0 else 'FAIL'}: {manifest['pack']} ({failures} failed)")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
