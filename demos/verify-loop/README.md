# L5 Verify loop

**Setup line:** "Someone on {prospect}'s team refactored date matching. It reads fine, and code review passed it. Let's see what Verify says."

**Wow line:** "Red on REQ-004. A separate agent found the boundary bug, fixed the source, and was never allowed to touch a test. Now it's green, and both runs are in the trace matrix."

## What happens

| Step | What runs | On screen |
| --- | --- | --- |
| 1 Plant | `git apply regression.patch`: `ge` and `le` date matching become exclusive | a 2-line diff in `packages/core/src/search/match.ts` |
| 2 CI red | `ci.mjs` runs the traced tests in `packages/core` | `51 passed, 3 failed`, REQ-004 RED |
| 3 Workspace | scratch copy of `packages/` with the failing tree. No `demos/`, so no patch or answer | |
| 4 Remediate | `@grok/agent-sdk` agent in `remediator/`, sandboxed, no network | root cause and fix |
| 5 Guard | `guard.mjs` copies back only modified non-test files under `packages/core/src/` | `accepted modified packages/core/src/search/match.ts` |
| 6 CI green | `ci.mjs` again | `54 passed, 0 failed`, REQ-004 GREEN |
| 7 Evidence | `evidence.mjs` | `EVIDENCE.md`, `trace.json`, `TRACE.md` |

## Run it

1. Make sure environment `67842161` has `CURSOR_API_KEY` as a secret (the remediation agent needs it for model turns).
2. Start a cloud agent from the default branch and paste `prompt.md`. Or run `demos/verify-loop/run.sh` yourself.
3. Show `evidence/TRACE.md` (run-1 red, run-2 green) and `evidence/guard.json`.

Exit codes: `0` green, `1` still red, `3` blocked (no credential), `4` guard rejected a test or non-source change, `5` the planted regression was not caught.

## Rehearse without a model

`REMEDIATOR=reference demos/verify-loop/run.sh` reverses the patch instead of calling the agent. It proves the plant, CI, guard, and matrix in about 5 seconds. The evidence labels it "pipeline self-test, not an agent". Don't present it as the agent's fix.

## Answer key

The expected fix lives at `answer-keys://verify-loop/` in the private answer-key repository (not created yet). The patch in this folder is the regression, so the remediation workspace leaves out `demos/`.

## Reset

`demos/verify-loop/reset.sh` restores `match.ts`, deletes `evidence/`, and removes the scratch workspace. It's safe to re-run, and `run.sh` calls it first.
