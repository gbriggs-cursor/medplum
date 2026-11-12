# Prompt: voice patient support

Two prompts. The first is spoken by the presenter as the caller. The second is what the Ticket Triage bot receives; it is shown so the audience can see what the bot is asked to do.

## Caller script (Grok Voice or the support form)

> Hi, I'm calling {prospect} support. My name is Dana Whitfield, born July 2nd, 1958. I'm going through airport security next week. Can I wear my Acme Cardio patch through the scanner and on the plane?

All details are invented. When the read-back plays, say "yes".

## Ticket Triage bot (receives the GIO ticket)

> A new GIO ticket labelled `story:support-voice` and `support` came from {prospect} patient support. The description is already redacted; do not ask for or restore identifiers.
>
> - If triage is `kb_gap`: write a patient KB article for {prospect} under `demos/support-voice/kb/foomedical/` in `gbriggs-cursor/medplum`, open a draft PR against the repository's default branch, link it on the ticket, then move the ticket to Escalated.
> - If triage is `bug`: move the ticket to Escalated so the Fix Orchestrator picks it up.
> - Do not wait for approval.
