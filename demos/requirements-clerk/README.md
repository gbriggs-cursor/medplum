# L1 Requirements clerk

**Setup line:** "These are notes from a design-input review for {prospect}'s patch software. Nothing is numbered yet."

**Wow line:** "The bot turns the notes into traced design inputs, REQ-010 onward, on the GIO board. It does not wait for anyone to approve them."

## Preflight

Stop, and name the blocker, when any of these is missing:

- The requirements-clerk Grok Bot. This folder does not create or edit a bot.
- The Atlassian connector, with permission to create GIO issues and no permission to transition them.

The run does not wait on an approval card. Approval, if a presenter wants one, is recorded later in the evidence package.

## Run it

1. `demos/requirements-clerk/reset.sh` (safe to re-run). It never calls Jira.
2. Paste `prompt.md` into the requirements-clerk bot. `{prospect}` defaults to Acme Cardio.
3. While it runs, this is factory stage 01 Requirement.
4. When it finishes, open the new GIO tickets and `run/requirements.yaml`.

## What to click

- The meeting notes: four product behaviors, plus a branding aside the bot should skip.
- The new tickets: titles start with the REQ id, labels match the card, status was not transitioned.
- `run/requirements.yaml`: one row per filed input, `safety_class` left empty.

## Answer key

`answer-keys://requirements-clerk/` resolves to a private repo that is not created yet. The expected extraction is not in this repository.

## Fallback

No recorded pull request. Do not show a traced-build pull request as if it were filed requirements.

## Reset

`reset.sh` deletes `demos/requirements-clerk/run/` and checks that the seed files exist. Tickets the bot already created stay on the board.
