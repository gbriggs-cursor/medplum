# Prompt: PHI tripwire

The presenter pastes a synthetic note from {prospect}'s support queue. Default note: {note}.

```bash
node demos/phi-tripwire/scripts/tripwire.mjs --note {note}       # redacted, dry-run ticket
node demos/phi-tripwire/scripts/tripwire.mjs --note {note} --blind  # same note without chart context: refused
node demos/phi-tripwire/scripts/tripwire.mjs --note P3-R-001     # unknown identifier: refused
```

To show the Grok Bot side, paste the raw note text into the bot and ask it to save the note to the ticket. The expected answer is a refusal that names the identifier types. That check depends on the bot's existing PHI screen and is not part of this repository.
