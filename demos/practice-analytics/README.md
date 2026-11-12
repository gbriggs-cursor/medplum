# G10 Practice analytics on 10,000 patients

**Setup line:** "{prospect}'s customers ask why their numbers moved. Today an analyst spends a day in SQL per question."

**Wow line:** "Three questions, 10,000 patients, every answer backed by a query. And it found the real cause of the HbA1c drop without being told."

Key-free (no `CURSOR_API_KEY`): `node demos/practice-analytics/run.mjs`. It uses the P2 10k pack, running the shared `fetch.sh` (release `data-p2-synthea-analytics-10k-v1`, sha256 from `pack.yaml`) if the pack is not cached. It falls back to `fixture-100` only if the download, checksum, or `verify.py` fails. Question 1 is a select from the shared views: `hba1c_control_monthly` for the headline cohort (SNOMED 44054006 or ICD-10-CM E11.9) and `hba1c_control_monthly_by_cohort` for the naive cohort (SNOMED 44054006 only). Each line is labeled. It prints `REPLAY (no key)` and `OFFLINE DATASET:` with the dataset that produced the numbers. It writes `run/findings.json` and `run/EVIDENCE.md`. `evidence/EVIDENCE.md` is the committed 10k run. `DEMO_MODE=live` without the key prints BLOCKED and exits 3.

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

No recorded live agent run. `run.mjs` replays the recorded analysis (10k pack, or `fixture-100` if P2 cannot be fetched). On `fixture-100`, March 2026 has no rows in either cohort, so question 1 reports that.

## Reset

`reset.sh` deletes `demos/practice-analytics/run/`. Safe to re-run. It does not touch the pack.
