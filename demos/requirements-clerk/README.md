# L1 Requirements clerk

**Setup line:** "These are notes from a design-input review for {prospect}'s patch software. Nothing is numbered yet."

**Wow line:** "The bot turns the notes into traced design inputs, REQ-010 onward, on the GIO board. It does not wait for anyone to approve them."

## Preflight

No API key and no bot are required. The run does not wait on an approval card.

## Run it

1. `demos/requirements-clerk/reset.sh` (safe to re-run). It never calls Jira.
2. From the repo root, with no keys set: `node demos/requirements-clerk/offline.mjs`. Stdout is labeled `REPLAY (no key)` and `OFFLINE`.
3. While it runs, this is factory stage 01 Requirement.
4. Show `run/requirements.yaml` and `run/jira-dry-run.json`. The dry-run file is the Jira write. Nothing is sent to GIO.

Live mode available once keys are added: paste `prompt.md` into the requirements-clerk bot. `{prospect}` defaults to Acme Cardio. This folder does not create or edit that bot. `DEMO_MODE=live` with no keys prints `BLOCKED` and points back at the command above.

## What to click

- The meeting notes: four product behaviors, plus a branding aside the bot should skip.
- `run/jira-dry-run.json`: four creates, labeled OFFLINE, with empty status changes and comments. REQ-001 is not among them.
- `run/requirements.yaml`: one row per filed input, `safety_class` left empty.

## Answer key

`answer-keys://requirements-clerk/` resolves to a private repo that is not created yet. The expected extraction is not in this repository.

## Fallback

No recorded pull request. Do not show a traced-build pull request as if it were filed requirements.

## Reset

`reset.sh` deletes `demos/requirements-clerk/run/` and checks that the seed files exist. Tickets the bot already created stay on the board.
