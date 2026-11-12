# Prompt: L13 10k-patient investigation

Variables: `{prospect}` (default `Foo Medical`), `{data_dir}` (default `~/.cache/medplum-demos/synthea-analytics-10k`), `{month}` (default `March 2026`).

```
{prospect}'s diabetes dashboard shows HbA1c control (share of type 2 diabetes patients' HbA1c results
under 7%) dropping in {month}. Find out why, and back every claim with SQL.

Data: the synthetic analytics pack in {data_dir} (analytics.duckdb, or the Parquet files in parquet/).
If it is missing, say so and use demos/_shared/data-packs/synthea-analytics/fixture-100 instead.
Read the schema in demos/_shared/data-packs/synthea-analytics/README.md. Use DuckDB (python3 -c "import duckdb").
Do not look for or use any answer key.

Work in demos/analytics-10k/run/.
1. Reproduce the drop by month with SQL. Then find the root cause and show the corrected metric.
2. Check the rest of the data for other problems that would distort this or other dashboards. Report
   only what you can prove with a query.
3. Write queries.sql (every query you relied on), REPORT.md (the answer first, then each finding with
   its query and result table), and findings.json:
   {"answer": "...", "findings": [{"title": "...", "summary": "...", "start_date": "YYYY-MM-DD",
     "end_date": "YYYY-MM-DD or null", "entities": ["ids, codes, names involved"], "sql": ["..."]}]}
Open a draft PR against the default branch with the answer and the key result table in the body.
```
