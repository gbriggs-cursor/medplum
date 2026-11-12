# L7 DHF release

**Setup line:** "{prospect} is ready to index the design history for patch v2. The release records are synthetic, and nobody waits on a signature."

**Wow line:** "One command writes the design history index and a trace matrix. The tests named in the records are not re-run."

## Run it

1. `demos/dhf-release/reset.sh` deletes `evidence/` (safe to re-run).
2. From the repository root: `node demos/dhf-release/src/assemble.mjs`
3. Open `demos/dhf-release/evidence/DHF-INDEX.md` and `evidence/trace.json`. There is no `approval.json`.
4. Optional agent runner, after `npm install` in `demos/dhf-release/runner`:

```
npx --yes "@grok/agent-sdk@0.6.0" tool call assemble-dhf --dir demos/dhf-release/runner --input '{}'
```

A model turn needs `CURSOR_API_KEY`. That secret is not set. The node script does not use it. `XAI_API_KEY` is not used.

## What to click

- `evidence/DHF-INDEX.md`: one row per release record, with the check result.
- `evidence/trace.json`: `schema` `evidence-v2/trace`, `version` 2, one run, three rows.
- `evidence/EVIDENCE.md`: six control lines, then `Trace:`. No `Approval:` line.

## What the check is

Each record must have `req`, `risk`, `title`, and `test`. The first record cites the P1 cohort counts on pull request 11. This story does not copy that bundle and does not re-run its tests.

## Evidence v2

File names and the trace shape match the spec in pull request 21. `approval.json` is written by the approval gate in pull request 23, only after a human decision.

## Fallback

[PR #11](https://github.com/gbriggs-cursor/medplum/pull/11) is the cohort evidence, not a DHF runner.

## Reset

`reset.sh` deletes `demos/dhf-release/evidence/`.
