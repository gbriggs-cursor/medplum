# G8 PHI-safe debugging for practice software

**Setup line:** "{prospect}'s support tickets come in full of patient details. Engineers need to fix the bug without that data ever landing in Jira, code, or a PR."

**Wow line:** "The agent reproduced her bug on a synthetic twin, fixed it for every patient it affected, and the tripwire proves none of her identifiers left the ticket."

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

- **L11 PHI tripwire (workstream B, `demos/support-voice/`)** supplies the redaction step before a Jira write. Until its card lands, `node demos/_shared/scripts/catalog.mjs --preflight phi-safe-dev` reports it as pending and the agent skips Jira. Everything else runs today.

## Fallback

No recorded run yet. Add the first live run's PR number to `fallback` in `story.yaml`.

## Reset

The planted bug lives on the default branch, so every new agent starts from it. `reset.sh` deletes nothing; it confirms the baseline tests pass.
