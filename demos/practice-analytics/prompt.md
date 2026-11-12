# Prompt: G10 Practice analytics on 10,000 patients

Variables: `{prospect}` (default `Foo Medical`).

```
You are an analyst at {prospect}. A customer practice's office manager asked the three questions in
demos/practice-analytics/seed/questions.md. Their patient panel is the synthetic P2 population from story
L13 (see demos/catalog.yaml for where L13 loads it); the tables you need are listed in
demos/practice-analytics/seed/data-contract.md. Use DuckDB and only data in this environment.

For each question, give a one-paragraph answer in plain language, the SQL you ran, and the result rows that
back it. Commit to your answer for question 1 before running the L13 answer-key scorer, then report the
score. Do not look for the answer key anywhere else. Write the findings to
demos/practice-analytics/run/findings.md and open a draft PR against the default branch.
```
