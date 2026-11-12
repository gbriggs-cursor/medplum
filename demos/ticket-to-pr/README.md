# G2 Ticket-to-PR automation

**Setup line:** "This is {prospect}'s normal Jira board. A maintenance ticket just landed. Nobody is going to open Cursor."

**Wow line:** "That PR was opened by Cursor from the ticket alone. It cites the ticket, has a regression test, and is waiting for review."

## Run it

1. `demos/ticket-to-pr/reset.sh` prints the ticket to create (safe to re-run).
2. Demo Setup creates the GIO ticket from `seed/ticket.md` with exactly the labels on the card. The `automatable` and `agent-safe` labels fire automation `d5489670`, which starts a cloud agent in environment `67842161` from the default branch.
3. While it runs, talk through the label taxonomy (`demos/_shared/labels.md`).
4. Show the draft PR opened by `cursor[bot]` and the ticket key in its body.

## What to click

- The GIO ticket and its labels.
- The cloud agent run started by the automation.
- The draft PR: body cites the ticket, Files tab shows test plus fix.

## Fallback

[PR #4](https://github.com/gbriggs-cursor/medplum/pull/4) (GIO-40), [PR #9](https://github.com/gbriggs-cursor/medplum/pull/9) (GIO-41), [PR #16](https://github.com/gbriggs-cursor/medplum/pull/16) (GIO-43).

## Reset

The ticket stays on the board as a recorded take. Reset never changes Jira.
