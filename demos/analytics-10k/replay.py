#!/usr/bin/env python3
"""Key-free L13 run. Replays checked-in turns, executes their SQL locally, writes findings.

No CURSOR_API_KEY, no network. Uses the installed 10k pack when it is on disk, otherwise the committed fixture-100.
Everything it learns about the data comes from the queries; outputs go to the gitignored run/ directory.
Scoring goes through score.py, which prints "answer key absent" when the private key is not on this machine.
"""

import datetime as dt
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
SHARED = os.path.join(REPO, "demos", "_shared", "data-packs", "synthea-analytics")
sys.path.insert(0, SHARED)
TURNS = os.path.join(HERE, "fixtures", "replay", "turns.json")
RUN = os.path.join(HERE, "run")
LABEL = "REPLAY (no key)"
LATE_DAYS = 90
COHORT_LABELS = {
    "snomed_44054006": "naive: SNOMED 44054006 only",
    "t2dm_value_set": "headline: SNOMED 44054006 or ICD-10-CM E11.9",
}


def resolve_pack():
    candidate = os.environ.get("L13_PACK_DIR") or os.path.expanduser("~/.cache/medplum-demos/synthea-analytics-10k")
    manifest = os.path.join(candidate, "MANIFEST.json")
    duck = os.path.join(candidate, "analytics.duckdb")
    if os.path.exists(manifest) or os.path.exists(duck):
        pack = "synthea-analytics-10k"
        if os.path.exists(manifest):
            pack = json.load(open(manifest)).get("pack", pack)
        return candidate, pack, "installed"
    fixture = os.path.join(SHARED, "fixture-100")
    pack = json.load(open(os.path.join(fixture, "MANIFEST.json"))).get("pack", "synthea-analytics-100")
    return fixture, pack, "fixture-100"


def cell(value):
    if isinstance(value, dt.datetime):
        return value.date().isoformat()
    if isinstance(value, dt.date):
        return value.isoformat()
    if isinstance(value, float):
        return f"{value:.4g}"
    if isinstance(value, (list, tuple)):
        return "[" + ", ".join(cell(v) for v in value) + "]"
    return str(value)


def as_date(value):
    return value.date() if isinstance(value, dt.datetime) else value


def rows_of(con, sql, params=None):
    cur = con.execute(sql, params or [])
    names = [d[0] for d in cur.description]
    return names, [dict(zip(names, row)) for row in cur.fetchall()]


def table(names, rows, limit=24):
    lines = [" | ".join(names), " | ".join("---" for _ in names)]
    for row in rows[:limit]:
        lines.append(" | ".join(cell(row[name]) for name in names))
    if len(rows) > limit:
        lines.append(f"... {len(rows) - limit} more rows")
    return "\n".join(lines)


def longest_internal_gap(rows):
    by_model = {}
    for row in rows:
        by_model.setdefault(row["model"], set()).add(as_date(row["reading_date"]))
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
                if missing[0] != span_start and (best is None or len(missing) > best[0]):
                    best = (len(missing), model, missing[0], missing[-1] + dt.timedelta(days=1))
                missing = []
            day += dt.timedelta(days=1)
    if best is None:
        return None
    length, model, start, end_exclusive = best
    return {"model": model, "start_date": start.isoformat(), "end_date": end_exclusive.isoformat(), "days": length}


def largest_fall(rows):
    """(previous, current) month rows with the largest month-over-month fall in control_pct_raw, or None."""
    best = None
    for prev, cur in zip(rows, rows[1:]):
        fall = prev["control_pct_raw"] - cur["control_pct_raw"]
        if fall > 0 and (best is None or fall > best[0]):
            best = (fall, prev, cur)
    return best[1:] if best else None


class Session:
    def __init__(self, con):
        self.con = con
        self.results = {}
        self.log = []
        self.report = []

    def run(self, qid, sql, params=None):
        names, rows = rows_of(self.con, sql, params)
        self.results[qid] = rows
        self.log.append({"id": qid, "sql": sql, "params": params or []})
        rendered = table(names, rows)
        print(f"\nOFFLINE {qid} ({len(rows)} rows)")
        print(rendered)
        self.report += [f"### OFFLINE {qid} ({len(rows)} rows)", "", rendered, ""]
        return rows

    def sql_for(self, *ids):
        return [q["sql"] for q in self.log if q["id"] in ids]


def control_table(by_cohort, months):
    lines = ["cohort | conversion | " + " | ".join(months), "--- | --- | " + " | ".join("---" for _ in months)]
    for cohort in ("snomed_44054006", "t2dm_value_set"):
        rows = by_cohort.get(cohort, {})
        for conv, n_key, pct_key in (("raw (as stored)", "controlled_raw_n", "control_pct_raw"),
                                     ("converted (NGSP %)", "controlled_n", "control_pct")):
            cells = []
            for m in months:
                r = rows.get(m)
                cells.append(f"{r[pct_key]}% ({r[n_key]}/{r['n']})" if r else "no rows")
            lines.append(f"{COHORT_LABELS[cohort]} | {conv} | " + " | ".join(cells))
    return "\n".join(lines)


def main():
    try:
        import hba1c_control as shared
    except ImportError:
        print("replay: DuckDB is not installed. Run demos/_shared/data-packs/synthea-analytics/install.sh at environment build time.", file=sys.stderr)
        sys.exit(1)

    doc = json.load(open(TURNS))
    pack_dir, pack, source = resolve_pack()
    con = shared.connect(pack_dir)
    shared.install(con)
    store = "analytics.duckdb" if os.path.exists(os.path.join(pack_dir, "analytics.duckdb")) else "parquet"
    print(LABEL)
    print(f"pack: {pack} ({source}) at {pack_dir} via {store}")
    print(f"turns: {os.path.relpath(TURNS, REPO)} label={doc['label']}")

    s = Session(con)
    s.report += [LABEL, "", f"Pack: {pack} ({source})", f"Store: {store}", ""]
    for turn in doc["turns"]:
        print(f"\n--- {turn['role']} {LABEL} ---")
        print(turn["content"])
        s.report += [f"## {turn['role']}", "", turn["content"], ""]
        for query in turn.get("queries", []):
            s.run(query["id"], query["sql"])

    window_start = as_date(s.results["window"][0]["window_start"])
    late_after = window_start + dt.timedelta(days=LATE_DAYS) if window_start else None
    is_late = lambda d: late_after is not None and d is not None and as_date(d) > late_after

    print(f"\n--- follow-ups {LABEL} (values first seen after {cell(late_after)}) ---")
    s.report += [f"## follow-ups (values first seen more than {LATE_DAYS} days after {cell(window_start)})", ""]
    late_units = [r for r in s.results["hba1c-units"] if is_late(r["first_seen"])]
    for i, u in enumerate(late_units):
        u["orgs"] = [r["organization_id"] for r in s.run(
            f"hba1c-unit-orgs-{i}",
            "select distinct e.organization as organization_id from observations o join encounters e on e.id = o.encounter "
            "where o.code = '4548-4' and o.units = ? order by 1",
            [u["units"]],
        )]
    late_systems = [r for r in s.results["condition-systems"] if is_late(r["first_seen"])]
    for i, sysrow in enumerate(late_systems):
        sysrow["code_list"] = [r["code"] for r in s.run(
            f"condition-system-codes-{i}",
            "select code, min(start)::date as first_seen, count(*) as n from conditions where system = ? group by 1 order by 1",
            [sysrow["system"]],
        )]

    by_cohort = {}
    for r in s.results["monthly-control"]:
        by_cohort.setdefault(r["cohort"], {})[cell(r["month"])[:7]] = r
    naive_rows = sorted(by_cohort.get("snomed_44054006", {}).values(), key=lambda r: r["month"])
    fall = largest_fall(naive_rows)

    findings = []
    for u, i in zip(late_units, range(len(late_units))):
        findings.append({
            "title": f"HbA1c results in a new unit: {u['units']}",
            "summary": f"{u['n']} LOINC 4548-4 rows are in {u['units']} from {cell(u['first_seen'])}; a threshold on stored values misreads them.",
            "start_date": cell(u["first_seen"]),
            "end_date": None,
            "entities": u["orgs"],
            "sql": s.sql_for("hba1c-units", f"hba1c-unit-orgs-{i}", "monthly-control"),
        })
    dup_ids = [str(i) for row in s.results["duplicates"] for i in row["ids"]]
    if dup_ids:
        findings.append({
            "title": "Duplicate patients",
            "summary": f"{len(s.results['duplicates'])} registration groups share an SSN and birth date.",
            "start_date": None,
            "end_date": None,
            "entities": dup_ids,
            "sql": s.sql_for("duplicates"),
        })
    for sysrow, i in zip(late_systems, range(len(late_systems))):
        findings.append({
            "title": f"New condition code system: {sysrow['system']}",
            "summary": f"Conditions coded in {sysrow['system']} ({', '.join(sysrow['code_list'])}) appear from {cell(sysrow['first_seen'])}; a cohort keyed on one code system misses them.",
            "start_date": cell(sysrow["first_seen"]),
            "end_date": None,
            "entities": sysrow["code_list"],
            "sql": s.sql_for("condition-systems", f"condition-system-codes-{i}"),
        })
    gap = longest_internal_gap(s.results["device-days"])
    if gap:
        findings.append({
            "title": "Device reading gap",
            "summary": f"{gap['model']} sends no readings from {gap['start_date']} to {gap['end_date']} ({gap['days']} days).",
            "start_date": gap["start_date"],
            "end_date": gap["end_date"],
            "entities": [gap["model"]],
            "sql": s.sql_for("device-days"),
        })

    if fall:
        pm, cm = cell(fall[0]["month"])[:7], cell(fall[1]["month"])[:7]
        months = [pm, cm]
        head = by_cohort.get("t2dm_value_set", {}).get(cm)
        answer = (
            f"Naive (SNOMED 44054006 only, values as stored, the dashboard's view): {fall[0]['control_pct_raw']}% in {pm} "
            f"to {fall[1]['control_pct_raw']}% in {cm}. "
        )
        if head:
            answer += (
                f"Headline (SNOMED 44054006 or ICD-10-CM E11.9, values in NGSP percent): {cm} control is "
                f"{head['control_pct']}% ({head['controlled_n']}/{head['n']}). "
            )
        causes = [f["summary"] for f in findings if f["title"].startswith(("HbA1c results in a new unit", "New condition code system"))]
        answer += " ".join(causes) if causes else "No late-appearing unit or code system explains the fall."
    else:
        months = sorted({m for rows in by_cohort.values() for m in rows})[-2:]
        answer = "Naive HbA1c control does not fall month over month in this pack's window, so there is no drop to explain here."

    labeled = control_table(by_cohort, months) if months else "No type 2 diabetes HbA1c rows in the window."
    print(f"\nOFFLINE control (naive vs headline)\n{labeled}")
    print(f"\nOFFLINE answer: {answer}")
    s.report += ["## Control, naive vs headline", "", labeled, "", "## Answer", "", answer, ""]

    os.makedirs(RUN, exist_ok=True)
    findings_path = os.path.join(RUN, "findings.json")
    with open(findings_path, "w") as fh:
        json.dump({"mode": LABEL, "pack": pack, "pack_source": source, "answer": answer, "findings": findings}, fh, indent=2)
        fh.write("\n")
    with open(os.path.join(RUN, "queries.sql"), "w") as fh:
        fh.write("-- shared HbA1c control definition (demos/_shared/data-packs/synthea-analytics/hba1c-control.sql)\n")
        fh.write(open(shared.SQL_PATH).read().rstrip() + "\n\n")
        for q in s.log:
            params = f" -- params: {q['params']}" if q["params"] else ""
            fh.write(f"-- {q['id']}{params}\n{q['sql']};\n\n")

    proc = subprocess.run(
        [sys.executable, os.path.join(HERE, "score.py"), findings_path, "--pack-dir", pack_dir],
        capture_output=True,
        text=True,
    )
    score_text = ((proc.stdout or "") + (proc.stderr or "")).rstrip()
    print(f"\nOFFLINE score.py\n{score_text}")
    s.report += ["## Score", "", score_text, ""]

    with open(os.path.join(RUN, "REPORT.md"), "w") as fh:
        fh.write("\n".join(s.report).rstrip() + "\n")
    evidence = [
        LABEL,
        "",
        f"Pack: {pack} ({source}), store {store}",
        "",
        "## HbA1c control, naive vs headline",
        "",
        labeled,
        "",
        "## Answer",
        "",
        answer,
        "",
        "## Findings",
        "",
        *[f"- {f['title']}: {f['summary']}" for f in findings],
        "",
        "## Score",
        "",
        score_text,
        "",
    ]
    with open(os.path.join(RUN, "EVIDENCE.md"), "w") as fh:
        fh.write("\n".join(evidence))
    print(f"\nOFFLINE wrote run/findings.json, run/queries.sql, run/REPORT.md, run/EVIDENCE.md under {os.path.relpath(HERE, REPO)}")
    sys.exit(proc.returncode)


if __name__ == "__main__":
    main()
