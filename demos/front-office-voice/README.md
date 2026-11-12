# G9 Voice front-office support

**Setup line:** "{prospect}'s support team spends the day on the phone with front desks. Most calls are a how-to, a docs gap, or a bug."

**Wow line:** "One phone call. A ticket with no patient details in it, and a docs PR or a fix PR, before the presenter finishes the slide."

## Status

**Stubbed until L9 and L11 land** (workstream B, `demos/support-voice/`). This folder holds the front-office profile, three caller scripts, the card and the talk track. The voice site, triage, bots and redaction come from support-voice. Check with:

```
node demos/_shared/scripts/catalog.mjs --preflight front-office-voice
```

## Run it (once L9 and L11 have landed)

1. `demos/front-office-voice/reset.sh` checks the dependencies and prints the caller scripts.
2. Demo Setup configures the line with `prompt.md` (`{call}` picks the script).
3. Gate: read the two-phase confirm aloud. The ticket is written right after.
4. Show the GIO ticket (no identifiers), the triage note, then the draft PR.

## What to click

- The GIO ticket: redacted summary, labels `story:front-office-voice` and `track:generic`.
- The KB article PR (`kb_gap` call) or fix PR (`bug` call).

## Fallback

None in this repo yet. Use the support-voice (L9) fallback once its card lands.

## Reset

Nothing is seeded locally. `reset.sh` only prints status and scripts.
