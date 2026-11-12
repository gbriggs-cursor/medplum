# L3 Traced build (device evidence)

**Setup line:** "{prospect}'s patch sends blood pressure and ECG. Before anything ships, QA needs evidence that Medplum ingests it correctly, on data nobody has to de-identify."

**Wow line:** "Twenty synthetic patients, a parser, tests, coverage, and a trace table from {requirement_id} to the commit. Nothing here is real PHI."

## Run it

1. `demos/device-evidence/reset.sh` clears any local run output (safe to re-run).
2. Start a cloud agent in environment `67842161` from the default branch and paste `prompt.md`.
3. While it runs, open the factory slide: this is stage 03 Build.
4. When the draft PR opens, walk `evidence/EVIDENCE.md`: the six control lines, then the trace table.

## What to click

- `manifest.json`: counts and seed `{seed}`.
- `evidence/EVIDENCE.md`: `Requirement`, `Result: pass (...)`, `Synthetic: true`, `Commit`.
- The coverage report and screenshots under `evidence/`.

## Fallback

[PR #11](https://github.com/gbriggs-cursor/medplum/pull/11) (Acme Cardio patch v2 BP + ECG ingest, 4 passed, seed 20261104).

## Reset

`reset.sh` deletes `demos/device-evidence/run/` from the local working tree. The cohort is regenerated from the seed on every run.
