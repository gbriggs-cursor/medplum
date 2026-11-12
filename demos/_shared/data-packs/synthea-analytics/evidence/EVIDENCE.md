Requirement: The L13 analytics packs are generated from pinned Synthea v3.3.0 with pinned seeds, flattened to Parquet/DuckDB, tagged synthetic + HTEST, and verifiable against their manifest.
Change: Added demos/_shared/data-packs/synthea-analytics (install, generate, flatten, build-db, build-pack, fetch, verify, pack.yaml, P0 fixture-100) and the demos/analytics-10k story.
Test: python3 demos/_shared/data-packs/synthea-analytics/verify.py <pack_dir>, for fixture-100 and the locally built P2 pack
Result: pass (P0 19 checks, P2 28 checks, 0 failed)
Synthetic: true
Commit: 15a08a50d87d4c910cf95982bcdde8fd12846a7b (base; this change is the commit that adds this file)

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| P0 fixture matches its manifest and is tagged synthetic + HTEST | verify.py fixture-100 | 2026-11-12, DuckDB 1.1.3 | pass |
| P2 pack (10,000 living patients, 11,842 patient rows) matches its manifest, Parquet and analytics.duckdb agree | verify.py ~/.cache/.../synthea-analytics-10k | 2026-11-12, Synthea v3.3.0, OpenJDK 21 | pass |
| P0 build is reproducible | build-pack.sh p0 twice | 2026-11-12 | pass (identical tarball sha256 85450e29...) |
| P2 build is reproducible | build-pack.sh p2 twice | 2026-11-12 | rows identical; 2 Parquet files differ at byte level |
| Planted anomalies are findable with SQL and the private scorer works | private score.py on SQL-derived findings | 2026-11-12 | 4/4; empty findings 0/4 |

## Runs

```
build-pack.sh p2: Synthea 3m21s on 8 cores, total=11722 alive=10000 dead=1722; tarball 36M
  5f803a524ba57b31067657a0c9a0e6d009bc0d2b62115abdc79c6412bbc20cef  synthea-analytics-10k.tar.gz
build-pack.sh p0: total=114 alive=100 dead=14; tarball 300K
  85450e294700b547dc58daeae8b7a4addfeefb6a424467178020267422cead5b  synthea-analytics-100.tar.gz
verify.py fixture-100: PASS: synthea-analytics-100 (0 failed)
verify.py synthea-analytics-10k: PASS: synthea-analytics-10k (0 failed)
fetch.sh (release URL): curl: (22) The requested URL returned error: 404  (release not published)
fetch.sh (L13_P2_URL=file://...tar.gz): PASS: synthea-analytics-10k (0 failed)
```

## Release fetch (published asset, 2026-11-12)

Requirement: the published P2 release asset downloads, matches the sha256 pinned in pack.yaml, and verifies.
Change: none (the release was published by a maintainer; fetch.sh and pack.yaml are unchanged in this step).
Test: ./fetch.sh with no overrides (default URL and sha256 from pack.yaml), then python3 verify.py on the unpacked pack.
Result: pass (fetch.sh exit 0, verify 28 checks, 0 failed). Raw output: evidence/fetch-verify-release-run.txt
Synthetic: true

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| Release URL returns 200 | curl -L the release URL | 2026-11-12, env 67842161 | pass (200) |
| Downloaded tarball matches pinned sha256 | fetch.sh sha256 check | 2026-11-12 | pass (5f803a52...0cef) |
| Unpacked P2 pack matches manifest, Parquet and analytics.duckdb agree | fetch.sh runs verify.py; standalone verify.py | 2026-11-12 | pass (28 checks, 0 failed) |
| Planted tables are queryable from the built DB | duckdb CLI count on analytics.duckdb | 2026-11-12 | pass (patients 11842; HbA1c 4548-4 rows 25263) |
