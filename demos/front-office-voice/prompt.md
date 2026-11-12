# Prompt: G9 Voice front-office support

Variables: `{prospect}` (default `Foo Medical`), `{call}` (default `reschedule`; one of `reschedule`, `kb_gap`, `bug` in `seed/calls.md`).

The working path is the support form, not a phone call. `POST /api/voice/session` in `demos/support-voice/server.mjs` returns 503 without `XAI_API_KEY`.

```
Show {prospect}'s front-office support on the L9 form, using the {call} script in
demos/front-office-voice/seed/calls.md.

The server is demos/support-voice/server.mjs. It loads only
demos/support-voice/prospects/foomedical.json. The front-office profile
demos/front-office-voice/seed/front-office.json is the same shape and is not what the server loads.
Do not edit the server to swap it in during this run.

Start the server without --live-jira. The ticket is dry-run JSON in demos/support-voice/run/outbox/.
Redaction is demos/_shared/phi/redact.mjs (L11, demos/phi-tripwire). Do not write to Jira.
Do not claim a Grok Bot PHI screen ran.

If a local Medplum server is up, L10 (demos/speech-to-fhir) can record a confirmed intake as a
QuestionnaireResponse when the support server is started with --medplum. Skip that if Medplum is not running.

Open a draft PR against the default branch only if you change files. In the body, say which script you
submitted, quote the dry-run ticket path, and say whether any identifier remained.
```
