# G9 Voice front-office support

**Setup line:** "{prospect}'s support team spends the day on the phone with front desks. Most calls are a how-to, a docs gap, or a bug."

**Wow line:** "One phone call. A ticket with no patient details in it, and a docs PR or a fix PR, before the presenter finishes the slide."

Key-free (no `XAI_API_KEY`, no Jira keys): `node demos/front-office-voice/run.mjs`. It replays the three caller scripts through the L9 confirm and redact pipeline and writes `run/jira.json` labeled OFFLINE. `DEMO_MODE=live` without the keys prints BLOCKED and exits 3. The voice route returns 501 even when `XAI_API_KEY` is set.

## Run it

L9, L10, and L11 are on this branch. Check with:

```
node demos/_shared/scripts/catalog.mjs --preflight front-office-voice
```

1. `demos/front-office-voice/reset.sh` checks those three dependencies and prints the caller scripts.
2. The form is L9: `cd demos/support-voice && ./reset.sh && npm start` serves `http://127.0.0.1:8787` and writes a dry-run ticket to `run/outbox/`. It does not write to Jira unless started with `--live-jira`. This story does not do that.
3. `POST /api/voice/session` returns 503 without `XAI_API_KEY`. There is no live voice.
4. The server loads only `demos/support-voice/prospects/foomedical.json`. `seed/front-office.json` matches that shape and is not swapped in.
5. Gate: read the two-phase confirm aloud, then submit. Show the dry-run JSON. Labels on that file are L9's (`story:support-voice`), not this card's.
6. Redaction is `demos/_shared/phi/redact.mjs`. The tripwire story is `demos/phi-tripwire`, and the synthetic notes are `demos/_shared/data-packs/p3-phi-like`. This is a local screen. It is not a Grok Bot PHI screen.
7. L10 (`demos/speech-to-fhir`) writes a QuestionnaireResponse only when the support server is started with `--medplum` and a local Medplum server is up.

A live agent run of this prompt has not happened. The Ticket Triage and Fix Orchestrator bots are not started by this story.

## What to click

- The support form, then `demos/support-voice/run/outbox/<intake>.json`.
- `seed/front-office.json` next to `demos/support-voice/prospects/foomedical.json`, to show the profile the server does not load.

## Fallback

No recorded G9 run. L9's own offline checks (`npm test`, `npm run eval` in `demos/support-voice`) are the landed path.

## Reset

Nothing is seeded in this folder. `reset.sh` prints status and the scripts.
