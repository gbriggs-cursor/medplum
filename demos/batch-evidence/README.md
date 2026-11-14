# L14 Batch evidence

**Setup line:** "{prospect} shipped four device changes against the synthetic patch cohort. QA wants one evidence package for the batch, without waiting on a signature."

**Wow line:** "One command writes a single evidence folder. trace.json has one row per device change. A device that is not in the cohort fails that row. Nothing here is signed."

## Run it

From the repository root, with no `CURSOR_API_KEY`:

`node demos/batch-evidence/src/demo.mjs`

That prints `REPLAY (no key)`, replays the checked-in model turn, and executes the `refresh-evidence` tool. The tool writes `evidence/`. The first line of `EVIDENCE.md` and `trace.json` `"mode"` are `REPLAY (no key)`. `DEMO_MODE=live` without `CURSOR_API_KEY` prints `BLOCKED` and exits 3. With `CURSOR_API_KEY` and `DEMO_MODE` unset, the same command runs `agent-sdk run` and does not label the files as a replay.

1. `demos/batch-evidence/reset.sh` deletes `evidence/` (safe to re-run). The demo command does this itself.
2. `node demos/batch-evidence/src/refresh.mjs` is the tool body. It does not label a mode.
3. Open `demos/batch-evidence/evidence/EVIDENCE.md` and `evidence/trace.json`. There is no `approval.json`.

A live model turn needs `CURSOR_API_KEY`. That secret is not set. `XAI_API_KEY` is not used.

## What to click

- `evidence/EVIDENCE.md`: first line `REPLAY (no key)` after the key-free command, then the six control lines and `Trace:`. No `Approval:` line.
- `evidence/trace.json`: `schema` `evidence-v2/trace`, `version` 2, one run, four rows (`req`, `risk`, `test`, `run`, `result`, `commit`).

## Cohort

`seed/cohort-index.json` is the resource ids and counts from the P1 device cohort manifest on pull request 11 (Acme Cardio patch v2, seed 20261104, synthetic). This story does not copy the FHIR bundle and does not re-run that pull request's tests. The check is that each change's device, patient, and observation ids are in this index.

## Evidence v2

`EVIDENCE.md` follows `demos/_shared/skills/evidence-package`, plus the `Trace:` line from evidence v2. `trace.json` uses `schema: evidence-v2/trace` and `version: 2`. This story does not write `approval.json`. That file is written by the approval gate, and only after a human decision. The names and the trace shape match the spec in pull request 21 (`demos/_shared/evidence-v2/README.md`); the gate that consumes them is pull request 23.

## Fallback

[PR #11](https://github.com/gbriggs-cursor/medplum/pull/11).

## Reset

`reset.sh` deletes `demos/batch-evidence/evidence/`.
