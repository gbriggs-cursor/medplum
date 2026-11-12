# G8 PHI-safe debugging for practice software

**Setup line:** "{prospect}'s support tickets come in full of patient details. Engineers need to fix the bug without that data ever landing in Jira, code, or a PR."

**Wow line:** "The agent reproduced her bug on a synthetic twin, fixed it for every patient it affected, and the tripwire proves none of her identifiers left the ticket."

Key-free (no `CURSOR_API_KEY`): `node demos/phi-safe-dev/run.mjs`. `DEMO_MODE=live` without that key prints BLOCKED and exits 3.

## Run it

1. `demos/phi-safe-dev/reset.sh` shows the dependency status, runs the baseline tests (green), and prints the raw ticket.
2. Start a cloud agent in environment `67842161` from the default branch and paste `prompt.md`.
3. Show the raw ticket next to the redacted summary in the PR body.
4. Show the new synthetic-twin test: red before the fix, green after.
5. Gate: run `git diff origin/HEAD...HEAD | node demos/phi-safe-dev/check-no-phi.mjs` on the PR branch. It should print PASS.

## What to click

- `demos/phi-safe-dev/app/recall.test.mjs` in the PR: invented patient IDs, `synthetic` + `HTEST` tags.
- The root-cause paragraph in the PR body.
- The check-no-phi.mjs output in the PR body.

## Dependencies

- **L11** (`demos/phi-tripwire`) supplies `demos/_shared/phi/redact.mjs`. The P3 pack is `demos/_shared/data-packs/p3-phi-like`. This story redacts locally and does not write to Jira.

## Fallback

No recorded run yet. Add the first live run's PR number to `fallback` in `story.yaml`.

## Reset

The planted bug lives on the default branch, so every new agent starts from it. `reset.sh` deletes nothing; it confirms the baseline tests pass.
