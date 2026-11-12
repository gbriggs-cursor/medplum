# L2 Risk teammate

**Setup line:** "One design input for {prospect}'s patch has no hazard yet. The log already has HAZ-001, filed earlier, so the bot has a shape to follow."

**Wow line:** "The bot files the hazard and a safety class on its own. A reviewer can override the class later. The demo does not wait."

## Preflight

No API key and no bot are required. L1 does not have to run first. `seed/unassessed.yaml` is a fixture standing in for a requirement the clerk would have filed. The run does not wait on an approval card.

## Run it

1. `demos/risk-teammate/reset.sh` (safe to re-run). It never calls Jira.
2. From the repo root, with no keys set: `node demos/risk-teammate/offline.mjs`. Stdout is labeled `REPLAY (no key)` and `OFFLINE`.
3. While it runs, this is factory stage 02 Risk.
4. Show `run/hazard.yaml`: the replayed class and `status: ready-for-review`. `run/jira-dry-run.json` is the Jira write. Nothing is sent to GIO.

Live mode available once keys are added: paste `prompt.md` into the risk-teammate bot. `{prospect}` defaults to Acme Cardio. This folder does not create or edit that bot. `DEMO_MODE=live` with no keys prints `BLOCKED` and points back at the command above.

## What to click

- `seed/hazard-log.yaml`: HAZ-001 stays filed. The bot must not edit it.
- `seed/unassessed.yaml`: the requirement text only. No class is stored there.
- `run/hazard.yaml` and `run/jira-dry-run.json`: one create, labeled OFFLINE. HAZ-001 is not updated.

## Answer key

`answer-keys://risk-teammate/` resolves to a private repo that is not created yet. The expected hazard and class are not in this repository. The classification rule in the skill is the fictional demo rule, not a reproduction of ISO 14971.

## Fallback

No recorded pull request. The hazard log is a fixture, not a previous bot output.

## Reset

`reset.sh` deletes `demos/risk-teammate/run/` and checks that the seed files exist. A ticket the bot already created stays on the board.
