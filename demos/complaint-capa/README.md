# L16 Complaint to CAPA

**Setup line:** "A synthetic subject reported a pairing failure and a blood-pressure number that did not match a home cuff. No injury. The bot has the complaint and {prospect}'s fictional SOP."

**Wow line:** "It files the complaint, a reportability call, and a CAPA recommendation, marked ready for review. Nothing is submitted outside the room."

## Preflight

Stop, and name the blocker, when any of these is missing:

- The complaint-clerk Grok Bot. This folder does not create or edit a bot.
- The Atlassian connector, with permission to create GIO issues and no permission to transition them.

L9 has not filed a ticket. `seed/complaint.md` is the fixture. Do not wait for L9, and do not wait for an approval card.

## Run it

1. `demos/complaint-capa/reset.sh` (safe to re-run). It never calls Jira.
2. Paste `prompt.md` into the complaint-clerk bot. `{prospect}` defaults to Acme Cardio.
3. This story sits after the factory, at post-market. It is not stage 07.
4. Show `run/complaint.yaml`: the SOP section cited, `status: ready-for-review`, and `submitted_externally: false`.

## What to click

- `seed/complaint.md`: subject id SP-014, no name and no date of birth.
- `seed/sop.md`: the fictional rules the bot applies.
- The new GIO tickets, if the connector created them. Status was not transitioned.

## Answer key

`answer-keys://complaint-capa/` resolves to a private repo that is not created yet. The SOP in the seed is the procedure. A separate scored key is not in this repository.

## Fallback

No recorded pull request. The complaint is a fixture, not an L9 ticket.

## Reset

`reset.sh` deletes `demos/complaint-capa/run/` and checks that the seed files exist. Tickets the bot already created stay on the board. Nothing outside GIO is contacted, because the script does not contact anything.
