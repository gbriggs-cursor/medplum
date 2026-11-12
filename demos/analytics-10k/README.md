# L13 10k-patient investigation

**Setup line:** "{prospect}'s diabetes dashboard says HbA1c control fell off a cliff in March. Before anyone calls the clinics, let's ask the data."

**Wow line:** "Ten thousand synthetic patients, one question, and every claim backed by a query you can rerun. Then we score it against an answer key the agent never saw."

## Before the demo

The P2 pack must already be on the machine at `~/.cache/medplum-demos/synthea-analytics-10k` (environment build runs `demos/_shared/data-packs/synthea-analytics/install.sh` with `FETCH_P2=1`). Nothing is downloaded at demo time. Check it with:

```
python3 demos/_shared/data-packs/synthea-analytics/verify.py ~/.cache/medplum-demos/synthea-analytics-10k
```

If the pack is missing, the prompt falls back to the committed 100-patient fixture (P0).

## Run it (no API keys)

```
bash demos/analytics-10k/run.sh
```

This is the default. It prints `REPLAY (no key)`, replays the checked-in turns in `fixtures/replay/turns.json`, and runs their SQL locally in DuckDB. It does not call a model and does not use the network. If `~/.cache/medplum-demos/synthea-analytics-10k` is installed it uses that pack; otherwise it uses the committed `fixture-100` and says which one ran. Output lands in `run/` (deleted by `reset.sh`).

`DEMO_MODE=live` without `CURSOR_API_KEY` prints `BLOCKED` and exits 3, and the message points back at the command above. With `CURSOR_API_KEY` set, the script takes the live branch and leaves `prompt.md` unchanged. It does not launch the cloud agent itself.

Every run writes `run/EVIDENCE.md`, whose first line is `REPLAY (no key)`, with HbA1c control for the month before and the month of the largest fall, labeled naive (SNOMED 44054006 only) and headline (SNOMED 44054006 or ICD-10-CM E11.9), each raw and converted. Both come from the shared definition (`demos/_shared/data-packs/synthea-analytics/README.md`, "Metrics").

Scoring goes through `score.py`. It loads the private answer key from `--answer-key-dir`, `$L13_ANSWER_KEY_DIR`, or `~/.cache/medplum-demos/answer-keys/analytics-10k` (provisioned from `answer-keys://analytics-10k/`, not in this repo). Without the key it prints `answer key absent`, the run is unscored, and the command still exits 0.

## Run it live

1. `demos/analytics-10k/reset.sh` clears earlier run output (safe to re-run).
2. Start a cloud agent in environment `67842161` from the default branch and paste `prompt.md`. This needs `CURSOR_API_KEY`.
3. While it runs, show the pack: `MANIFEST.json` counts, seed, and the synthetic + HTEST tag.
4. When the draft PR opens, read the answer and the SQL behind it in `run/REPORT.md`.
5. Demo Setup scores `run/findings.json` with the private scorer at `answer-keys://analytics-10k/` and shows the score.

## What to click

- `run/REPORT.md`: the `REPLAY (no key)` line, the answer, then the control table labeled naive and headline.
- `run/EVIDENCE.md`: the labeled control table, findings and the score line.
- `run/queries.sql`: every query the agent relied on.
- The score line from Demo Setup.

## Fallback

No live cloud-agent PR yet. With the 10k pack absent, `bash demos/analytics-10k/run.sh` uses `fixture-100` and says so.

## Reset

`reset.sh` deletes `demos/analytics-10k/run/`. The pack is read-only.
