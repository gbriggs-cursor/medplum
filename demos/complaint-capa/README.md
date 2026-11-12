# L16 Complaint to CAPA

**Setup line:** "A synthetic subject reported a pairing failure and a blood-pressure number that did not match a home cuff. No injury. The bot has the complaint and {prospect}'s fictional SOP."

**Wow line:** "It files the complaint, a reportability call, and a CAPA recommendation, marked ready for review. Nothing is submitted outside the room."

## Preflight

No API key and no bot are required. L9 has not filed a ticket. `seed/complaint.md` is the fixture.

## Run it

1. `demos/complaint-capa/reset.sh` (safe to re-run). It never calls Jira.
2. From the repo root, with no keys set: `node demos/complaint-capa/offline.mjs`. Stdout is labeled `REPLAY (no key)` and `OFFLINE`.
3. Show `run/complaint.yaml` and `run/jira-dry-run.json`. The dry-run file is the Jira write. Nothing is sent to GIO.
4. This story sits after the factory, at post-market. It is not stage 07.

Live mode available once keys are added: paste `prompt.md` into the complaint-clerk bot. `{prospect}` defaults to Acme Cardio. This folder does not create or edit that bot. `DEMO_MODE=live` with no keys prints `BLOCKED` and points back at the command above.

## What to click

- `seed/complaint.md`: subject id SP-014, no name and no date of birth.
- `seed/sop.md`: the fictional rules the bot applies.
- `run/jira-dry-run.json`: two creates, labeled OFFLINE, with empty status changes and comments.

## Answer key

`answer-keys://complaint-capa/` resolves to a private repo that is not created yet. The SOP in the seed is the procedure. A separate scored key is not in this repository.

## Fallback

No recorded pull request. The complaint is a fixture, not an L9 ticket.

## Reset

`reset.sh` deletes `demos/complaint-capa/run/` and checks that the seed files exist. Tickets the bot already created stay on the board. Nothing outside GIO is contacted, because the script does not contact anything.
