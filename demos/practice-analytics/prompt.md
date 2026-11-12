# Prompt: G10 Practice analytics on 10,000 patients

Variables: `{prospect}` (default `Foo Medical`), `{data_dir}` (default `~/.cache/medplum-demos/synthea-analytics-10k`), `{month}` (default `March 2026`).

```
You are an analyst at {prospect}. A customer practice's office manager asked the three questions in
demos/practice-analytics/seed/questions.md (substitute {prospect} and {month} in that file). Their patient
panel is the synthetic pack from story L13.

Data: {data_dir} (analytics.duckdb, or the Parquet files in parquet/). If it is missing, say so and use
demos/_shared/data-packs/synthea-analytics/fixture-100 instead. Read the schema in
demos/_shared/data-packs/synthea-analytics/README.md (the Schema section). The columns this story uses are listed in
demos/practice-analytics/seed/data-contract.md. Use DuckDB (python3 -c "import duckdb"). Do not look for
or use any answer key. Do not open the Metrics section of that README, hba1c-control.sql, hba1c_control.py,
test_hba1c_control.py, or anything under evidence/.

For each question, give a one-paragraph answer in plain language, the SQL you ran, and the result rows
that back it. Question 1 is the same investigation as L13: commit to the answer before anyone scores it.
Write demos/practice-analytics/run/findings.md (all three questions) and
demos/practice-analytics/run/findings.json for question 1 only, in this shape:
{"answer": "...", "findings": [{"title": "...", "summary": "...", "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD or null", "entities": ["ids, codes, names involved"], "sql": ["..."]}]}
Open a draft PR against the default branch with the three answers and the question 1 SQL in the body.
```
