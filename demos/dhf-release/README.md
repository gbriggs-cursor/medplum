# L7 DHF release

**Setup line:** "{prospect} is ready to index the design history for patch v2. The release records are synthetic, and nobody waits on a signature."

**Wow line:** "One command writes the design history index and a trace matrix. The tests named in the records are not re-run."

## Run it

From the repository root, with no `CURSOR_API_KEY`:

`node demos/dhf-release/src/demo.mjs`

That prints `REPLAY (no key)`, replays the checked-in model turn, and executes the `assemble-dhf` tool. The tool writes `evidence/`. The first line of `EVIDENCE.md` and `DHF-INDEX.md`, and `trace.json` `"mode"`, are `REPLAY (no key)`. `DEMO_MODE=live` without `CURSOR_API_KEY` prints `BLOCKED` and exits 3. With `CURSOR_API_KEY` and `DEMO_MODE` unset, the same command runs `agent-sdk run` and does not label the files as a replay.

1. `demos/dhf-release/reset.sh` deletes `evidence/` (safe to re-run). The demo command does this itself.
2. `node demos/dhf-release/src/assemble.mjs` is the tool body. It does not re-run the named tests and it does not label a mode.
3. Open `demos/dhf-release/evidence/DHF-INDEX.md` and `evidence/trace.json`. There is no `approval.json`.

A live model turn needs `CURSOR_API_KEY`. That secret is not set. `XAI_API_KEY` is not used.

## What to click

- `evidence/EVIDENCE.md`: first line `REPLAY (no key)` after the key-free command, then the six control lines and `Trace:`. No `Approval:` line.
- `evidence/DHF-INDEX.md`: first line `REPLAY (no key)` after the key-free command, then one row per release record.
- `evidence/trace.json`: `mode` `REPLAY (no key)`, then `schema` `evidence-v2/trace`, `version` 2, one run, three rows.

## What the check is

Each record must have `req`, `risk`, `title`, and `test`. The first record cites the P1 cohort counts on pull request 11. This story does not copy that bundle and does not re-run its tests.

## Evidence v2

File names and the trace shape match the spec in pull request 21. `approval.json` is written by the approval gate in pull request 23, only after a human decision.

## Fallback

[PR #11](https://github.com/gbriggs-cursor/medplum/pull/11) is the cohort evidence, not a DHF runner.

## Reset

`reset.sh` deletes `demos/dhf-release/evidence/`.
