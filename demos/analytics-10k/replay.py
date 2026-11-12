#!/usr/bin/env python3
"""Key-free L13 run. Replays checked-in turns, executes their SQL locally, writes findings.

No CURSOR_API_KEY, no network. Uses the installed 10k pack when it is on disk, otherwise the
committed fixture-100. Scores with the private score.py when that file and the answer key are present.
"""

import datetime as dt
import json
import os
import subprocess
import sys

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

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
TURNS = os.path.join(HERE, "fixtures", "replay", "turns.json")
RUN = os.path.join(HERE, "run")
LABEL = "REPLAY (no key)"


def resolve_pack():
    candidate = os.environ.get("L13_PACK_DIR") or os.path.expanduser(
        "~/.cache/medplum-demos/synthea-analytics-10k"
    )
    manifest = os.path.join(candidate, "MANIFEST.json")
    duck = os.path.join(candidate, "analytics.duckdb")
    if os.path.exists(manifest) or os.path.exists(duck):
        pack = "synthea-analytics-10k"
        if os.path.exists(manifest):
            pack = json.load(open(manifest)).get("pack", pack)
        return candidate, pack, "installed"
    fixture = os.path.join(REPO, "demos", "_shared", "data-packs", "synthea-analytics", "fixture-100")
    pack = json.load(open(os.path.join(fixture, "MANIFEST.json"))).get("pack", "synthea-analytics-100")
    return fixture, pack, "fixture-100"


def connect(pack_dir):
    import duckdb

    duck = os.path.join(pack_dir, "analytics.duckdb")
    if os.path.exists(duck):
        return duckdb.connect(duck, read_only=True), "analytics.duckdb"
    parquet = os.path.join(pack_dir, "parquet")
    con = duckdb.connect()
    for table in TABLES:
        path = os.path.join(parquet, f"{table}.parquet")
        con.execute(f"create view {table} as select * from '{path}'")
    return con, "parquet"


def cell(value):
    if isinstance(value, dt.datetime):
        return value.date().isoformat()
    if isinstance(value, dt.date):
        return value.isoformat()
    if isinstance(value, float):
        return f"{value:.4g}"
    return str(value)


def as_list(value):
    if value is None:
        return []
    if isinstance(value, str):
        text = value.strip()
        if text.startswith("[") and text.endswith("]"):
            inner = text[1:-1].strip()
            if not inner:
                return []
            return [part.strip().strip("'\"") for part in inner.split(",")]
        return [text]
    return [cell(v) for v in value]


def rows_of(con, sql):
    cur = con.execute(sql)
    names = [d[0] for d in cur.description]
    return names, [dict(zip(names, row)) for row in cur.fetchall()]


def table(names, rows, limit=24):
    shown = rows[:limit]
    lines = [" | ".join(names), " | ".join("---" for _ in names)]
    for row in shown:
        lines.append(" | ".join(cell(row[name]) for name in names))
    if len(rows) > limit:
        lines.append(f"... {len(rows) - limit} more rows")
    return "\n".join(lines)


def longest_internal_gap(rows):
    by_model = {}
    for row in rows:
        by_model.setdefault(row["model"], set()).add(row["reading_date"])
    if not by_model:
        return None
    span_start = min(min(days) for days in by_model.values())
    span_end = max(max(days) for days in by_model.values())
    best = None
    for model, days in by_model.items():
        missing = []
        day = span_start
        while day <= span_end:
            if day not in days:
                missing.append(day)
            elif missing:
                if missing[0] != span_start and missing[-1] != span_end and (best is None or len(missing) > best[0]):
                    best = (len(missing), model, missing[0], missing[-1] + dt.timedelta(days=1))
                missing = []
            day += dt.timedelta(days=1)
    if best is None:
        return None
    length, model, start, end_exclusive = best
    return {"model": model, "start_date": start.isoformat(), "end_date": end_exclusive.isoformat(), "days": length}


def answer_keys_dir():
    candidates = []
    if os.environ.get("L13_ANSWER_KEYS_DIR"):
        candidates.append(os.environ["L13_ANSWER_KEYS_DIR"])
    candidates.append(os.path.expanduser("~/.cache/medplum-demos/answer-keys/analytics-10k"))
    candidates.append(os.path.join(os.path.dirname(REPO), "answer-keys", "analytics-10k"))
    for path in candidates:
        if os.path.isdir(path):
            return path
    return None


def key_file(pack):
    if "10k" in pack:
        return "answer-key-10k.json"
    return "answer-key-fixture-100.json"


def main():
    try:
        import duckdb  # noqa: F401
    except ImportError:
        print("replay: DuckDB is not installed. Run demos/_shared/data-packs/synthea-analytics/install.sh at environment build time.", file=sys.stderr)
        sys.exit(1)

    doc = json.load(open(TURNS))
    pack_dir, pack, source = resolve_pack()
    con, store = connect(pack_dir)
    print(LABEL)
    print(f"pack: {pack} ({source}) at {pack_dir} via {store}")
    print(f"turns: {os.path.relpath(TURNS, REPO)} label={doc['label']}")

    results = {}
    query_log = []
    report = [LABEL, "", f"Pack: {pack} ({source})", f"Store: {store}", ""]
    for turn in doc["turns"]:
        print(f"\n--- {turn['role']} {LABEL} ---")
        print(turn["content"])
        report.append(f"## {turn['role']}")
        report.append("")
        report.append(turn["content"])
        report.append("")
        for query in turn.get("queries", []):
            names, rows = rows_of(con, query["sql"])
            results[query["id"]] = rows
            query_log.append(query)
            rendered = table(names, rows)
            print(f"\nOFFLINE {query['id']} ({len(rows)} rows)")
            print(rendered)
            report.append(f"### OFFLINE {query['id']} ({len(rows)} rows)")
            report.append("")
            report.append(rendered)
            report.append("")

    unit = results["unit-start"][0]
    start = unit["start_date"]
    orgs = [row["organization_id"] for row in results["unit-orgs"]]
    naive = results["monthly-naive"]
    corrected = {row["month"]: row["corrected_control_pct"] for row in results["monthly-corrected"]}
    drop = ""
    if start is not None and naive:
        cut = start.replace(day=1) if hasattr(start, "replace") else start
        before = [row for row in naive if row["month"] < cut]
        after = [row for row in naive if row["month"] >= cut]
        if before and after:
            prev, nxt = before[-1], after[0]
            fixed = corrected.get(nxt["month"])
            drop = (
                f" Naive control goes from {prev['control_pct']}% in {cell(prev['month'])} "
                f"to {nxt['control_pct']}% in {cell(nxt['month'])}."
                f" Corrected ({fixed}%) stays with the earlier months."
            )
    if start is None:
        answer = "No HbA1c results in mmol/mol turned up in this pack, so the unit-change explanation is not supported here."
    else:
        answer = (
            f"HbA1c control drops because {unit['n']} results switch to mmol/mol starting {cell(start)} "
            f"and the dashboard still treats every value as a percent.{drop}"
        )

    dup_ids = []
    for row in results["duplicates"]:
        dup_ids.extend(as_list(row["ids"]))
    coding = results["coding"][0]
    codes = as_list(coding["codes"])
    gap = longest_internal_gap(results["device-days"])

    findings = []
    if start is not None:
        findings.append(
            {
                "title": "HbA1c unit change to mmol/mol",
                "summary": f"{unit['n']} LOINC 4548-4 rows are mmol/mol from {cell(start)}, so a '% under 7' rule misreads them.",
                "start_date": cell(start),
                "end_date": None,
                "entities": orgs,
                "sql": [q["sql"] for q in query_log if q["id"] in ("monthly-naive", "unit-start", "unit-orgs", "monthly-corrected")],
            }
        )
    if dup_ids:
        findings.append(
            {
                "title": "Duplicate patients",
                "summary": f"{len(results['duplicates'])} registration pairs share an SSN and birth date.",
                "start_date": None,
                "end_date": None,
                "entities": dup_ids,
                "sql": [q["sql"] for q in query_log if q["id"] == "duplicates"],
            }
        )
    if coding["start_date"] is not None:
        findings.append(
            {
                "title": "Coding drift to ICD-10-CM",
                "summary": f"New conditions use ICD-10-CM ({', '.join(codes)}) from {cell(coding['start_date'])}.",
                "start_date": cell(coding["start_date"]),
                "end_date": None,
                "entities": codes,
                "sql": [q["sql"] for q in query_log if q["id"] == "coding"],
            }
        )
    if gap:
        findings.append(
            {
                "title": "Device reading gap",
                "summary": f"{gap['model']} sends no readings from {gap['start_date']} to {gap['end_date']}.",
                "start_date": gap["start_date"],
                "end_date": gap["end_date"],
                "entities": [gap["model"]],
                "sql": [q["sql"] for q in query_log if q["id"] == "device-days"],
            }
        )

    payload = {"mode": LABEL, "pack": pack, "pack_source": source, "answer": answer, "findings": findings}
    os.makedirs(RUN, exist_ok=True)
    findings_path = os.path.join(RUN, "findings.json")
    with open(findings_path, "w") as fh:
        json.dump(payload, fh, indent=2)
        fh.write("\n")
    with open(os.path.join(RUN, "queries.sql"), "w") as fh:
        for query in query_log:
            fh.write(f"-- {query['id']}\n{query['sql']};\n\n")

    print(f"\nOFFLINE answer: {answer}")
    report.append("## Answer")
    report.append("")
    report.append(answer)
    report.append("")

    keys = answer_keys_dir()
    score_py = os.path.join(keys, "score.py") if keys else ""
    key_path = os.path.join(keys, key_file(pack)) if keys else ""
    if keys and os.path.isfile(score_py) and os.path.isfile(key_path):
        proc = subprocess.run([sys.executable, score_py, key_path, findings_path], capture_output=True, text=True)
        score_text = (proc.stdout or "") + (proc.stderr or "")
        print(f"\nOFFLINE score.py ({os.path.basename(key_path)})")
        print(score_text.rstrip())
        report.append("## Score")
        report.append("")
        report.append("OFFLINE score.py")
        report.append("")
        report.append(score_text.rstrip())
        report.append("")
        if proc.returncode != 0:
            sys.exit(proc.returncode)
    else:
        note = "score.py not run: private answer key is not on this machine (answer-keys://analytics-10k/). Findings still come from the DuckDB queries."
        print(f"\nOFFLINE {note}")
        report.append("## Score")
        report.append("")
        report.append(note)
        report.append("")

    report_path = os.path.join(RUN, "REPORT.md")
    with open(report_path, "w") as fh:
        fh.write("\n".join(report).rstrip() + "\n")
    print(f"\nOFFLINE wrote {os.path.relpath(findings_path, REPO)} and {os.path.relpath(report_path, REPO)}")


if __name__ == "__main__":
    main()
