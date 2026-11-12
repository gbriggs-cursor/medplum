# G10 Practice analytics on 10,000 patients

**Setup line:** "{prospect}'s customers ask why their numbers moved. Today an analyst spends a day in SQL per question."

**Wow line:** "Three questions, 10,000 patients, every answer backed by a query. And it found the real cause of the HbA1c drop without being told."

## Status

**Stubbed until L13 lands** (workstream C: the P2 Synthea pack in DuckDB, the `@grok/agent-sdk` runner and the answer-key scorer). This folder holds only the practice-manager framing: questions, data contract, card, prompt and talk track. Check with:

```
node demos/_shared/scripts/catalog.mjs --preflight practice-analytics
```

## Run it (once L13 has landed)

1. `demos/practice-analytics/reset.sh` checks the dependency, clears `run/`, and prints the questions.
2. Run the L13 SDK runner with `prompt.md`, or paste it into a cloud agent in environment `67842161`.
3. Walk the three answers and their SQL in `run/findings.md`.
4. Gate: reveal the answer-key score for question 1.

## What to click

- The question 1 SQL that exposes the cause.
- The answer-key score line.

## Fallback

None in this repo yet. Use the L13 fallback once its card lands.

## Reset

`reset.sh` deletes `demos/practice-analytics/run/`. Safe to re-run.
