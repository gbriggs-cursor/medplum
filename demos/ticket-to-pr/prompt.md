# Prompt: G2 Ticket-to-PR automation

Variables: `{prospect}` (default `Acme Cardio`).

The automation sends the ticket body as the prompt, so no one pastes anything on stage. The ticket text is in `seed/ticket.md`.

Use this prompt only when the automation is unavailable and the presenter starts the agent by hand from the default branch:

```
Read the GIO ticket "[{prospect} Medplum Maintenance] MockClient search ignores a filter that the
server honors". Do what it asks: add a failing regression test, fix the source so it passes, run the
tests for the packages you changed, use the evidence-package skill, and open a draft PR against the
default branch that cites the ticket key.
```
