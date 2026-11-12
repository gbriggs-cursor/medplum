# Jira label taxonomy

Every demo ticket lives on the **GIO** board. Stories are told apart by labels, not by separate projects.
`demos/_shared/scripts/catalog.mjs` checks each `story.yaml` against this list.

## Labels

| Label | On which tickets | Meaning |
| --- | --- | --- |
| `demo` | every demo ticket | Synthetic demo work. Never customer data. |
| `medplum` | every demo ticket | Work targets `gbriggs-cursor/medplum`. |
| `story:<id>` | every demo ticket | The story folder under `demos/`, for example `story:ticket-to-pr`. |
| `track:generic` or `track:ls` | every demo ticket | Generic beat, or the life-sciences factory track. |
| `stage:<01-07>` | life-sciences tickets only | Factory stage: 01 Requirement, 02 Risk, 03 Build, 04 Review, 05 Verify, 06 Approve, 07 Release. Generic stories carry no stage label. |
| `automatable` | automation stories only | Fires the ticket-to-PR automation. |
| `agent-safe` | automation stories only | Fires the ticket-to-PR automation. |
| `maintenance` | automation stories only (legacy) | Present on GIO-40 to GIO-43, which proved automation `d5489670`. Keep it on ticket-to-PR tickets until that automation's label filter is confirmed. |

## Rules

- Add `automatable` and `agent-safe` only when the card sets `jira.automation: true`. On any other ticket the automation would fire a second, unwanted cloud agent.
- Never put `automatable` on intake or support tickets (for example voice intake). Those are triaged by bots, not by the automation.
- Ticket titles use the generic account (Acme Cardio / Foo Medical) unless the run names a prospect.
- Demo Setup creates tickets with exactly the labels on the card. It never changes ticket status.

## Example: ticket-to-PR

```
demo, medplum, story:ticket-to-pr, track:generic, automatable, agent-safe, maintenance
```

## Example: life-sciences build stage

```
demo, medplum, story:device-evidence, track:ls, stage:03
```
