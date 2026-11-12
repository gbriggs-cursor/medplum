# L13 10k-patient investigation

**Setup line:** "{prospect}'s diabetes dashboard says HbA1c control fell off a cliff in March. Before anyone calls the clinics, let's ask the data."

**Wow line:** "Ten thousand synthetic patients, one question, and every claim backed by a query you can rerun. Then we score it against an answer key the agent never saw."

## Before the demo

The P2 pack must already be on the machine at `~/.cache/medplum-demos/synthea-analytics-10k` (environment build runs `demos/_shared/data-packs/synthea-analytics/install.sh` with `FETCH_P2=1`). Nothing is downloaded at demo time. Check it with:

```
python3 demos/_shared/data-packs/synthea-analytics/verify.py ~/.cache/medplum-demos/synthea-analytics-10k
```

If the pack is missing, the prompt falls back to the committed 100-patient fixture (P0).

## Run it

1. `demos/analytics-10k/reset.sh` clears earlier run output (safe to re-run).
2. Start a cloud agent in environment `67842161` from the default branch and paste `prompt.md`.
3. While it runs, show the pack: `MANIFEST.json` counts, seed, and the synthetic + HTEST tag.
4. When the draft PR opens, read the answer and the SQL behind it in `run/REPORT.md`.
5. Demo Setup scores `run/findings.json` with the private scorer at `answer-keys://analytics-10k/` and shows the score.

## What to click

- `run/REPORT.md`: the answer first, then the monthly table that reproduces the drop and the corrected metric.
- `run/queries.sql`: every query the agent relied on.
- The score line from Demo Setup.

## Fallback

No recorded run yet. Run the same prompt against `demos/_shared/data-packs/synthea-analytics/fixture-100` (100 patients, seconds to query).

## Reset

`reset.sh` deletes `demos/analytics-10k/run/`. The pack is read-only.
