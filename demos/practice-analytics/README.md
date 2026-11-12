# G10 Practice analytics on 10,000 patients

**Setup line:** "{prospect}'s customers ask why their numbers moved. Today an analyst spends a day in SQL per question."

**Wow line:** "Three questions, 10,000 patients, every answer backed by a query. And it found the real cause of the HbA1c drop without being told."

## Run it

L13 is on this branch: `demos/analytics-10k` and `demos/_shared/data-packs/synthea-analytics`. Check with:

```
node demos/_shared/scripts/catalog.mjs --preflight practice-analytics
```

1. `demos/practice-analytics/reset.sh` checks that dependency, clears `run/`, and prints the questions.
2. The 10k pack was generated on [PR #33](https://github.com/gbriggs-cursor/medplum/pull/33): 10,000 living patients, and `verify.py` passed there. It unpacks to `~/.cache/medplum-demos/synthea-analytics-10k`. If that directory is missing, the prompt uses the committed 100-patient fixture and says so.
3. Start a cloud agent in environment `67842161` from the default branch and paste `prompt.md`.
4. Walk the three answers and their SQL in `run/findings.md`.
5. Gate: Demo Setup scores `run/findings.json` with `answer-keys://analytics-10k/` and the presenter reveals the score. Questions 2 and 3 are not scored.

A live agent run of this prompt has not been done yet.

## What to click

- The question 1 SQL that exposes the cause.
- The answer-key score line.

## Fallback

No recorded G10 run yet. Run the same prompt against `demos/_shared/data-packs/synthea-analytics/fixture-100`.

## Reset

`reset.sh` deletes `demos/practice-analytics/run/`. Safe to re-run. It does not touch the pack.
