# L9 Voice patient support (Foo Medical)

**Setup line:** "Foo Medical's patients call about their portal and their Acme Cardio patch. Watch what happens after they hang up."

**Wow line:** "The caller's name never reached Jira, and the ticket is already turning into a KB article."

All data is synthetic. Foo Medical and Acme Cardio are fictional.

## Flow

1. The caller talks to Grok Voice, or fills in the support form at `http://127.0.0.1:8787`.
2. The server reads the intake back. Nothing is written until the caller confirms that exact read-back (the confirm token is an HMAC of the draft; a forged or replayed confirm gets HTTP 409).
3. The issue text is redacted (`demos/_shared/phi/redact.mjs`). Triage sees only redacted text.
4. Triage picks `answered`, `kb_gap`, `bug` or `urgent_clinical` against the P4 KB: 8 Foo Medical articles plus 9 Medplum docs read in place from `packages/docs/docs` (engineering references only, never read to a patient).
5. The GIO ticket is built with labels `demo, medplum, story:support-voice, track:ls, stage:post-market, support, platform-demo`. Never `automatable`. A PHI tripwire refuses the write if any identifier remains.
6. The Ticket Triage bot handles `kb_gap` (KB article PR, then Escalated) and the Fix Orchestrator handles `bug` (cloud agent, fix PR). Both bots need the changes listed in the PR description before they act on GIO.

## Key-free (no API keys)

This is the default. It replays a checked-in call and the triage agent's `record_triage` turn (`fixtures/replay/call.json`, labeled `REPLAY (no key)`), redacts that text for real, and writes the GIO payload to an `OFFLINE` file. It does not call Grok Voice, the agent, or Jira.

```bash
node demos/support-voice/scripts/offline.mjs
```

`DEMO_MODE=live` without `XAI_API_KEY`, `CURSOR_API_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, and `JIRA_API_KEY` prints `BLOCKED` and exits 3. With those set, the same command uses the existing live Jira create and does not print a replay label. `DEMO_MODE=replay` stays on the key-free path even if the keys are set.

## Run it

```bash
cd demos/support-voice
./reset.sh
npm test                           # redaction, two-phase confirm, GIO payload (node:test)
npm run eval                       # 14 synthetic intakes, deterministic triage + redaction, offline
npm run demo:verify -- --kb-gap    # end to end over HTTP; also --bug, --answered, --urgent
npm start                          # support page on http://127.0.0.1:8787 (Jira dry-run to run/outbox/)
```

Model-backed triage (`@grok/agent-sdk` 0.6.0):

```bash
cd agents/triage && npm install
npx agent-sdk validate --dir .
npx agent-sdk eval --dir . --no-stream   # needs CURSOR_API_KEY
```

Live Jira: set `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_KEY`, then `node server.mjs --live-jira`. It only creates issues. It never changes status or comments.

## What to click

1. Open the support page. Read the disclaimer.
2. Enter the caller script from `prompt.md` (or say it to Grok Voice).
3. Choose **Review**, then **Yes, submit**. Show the category pill and the redaction count.
4. Open `run/outbox/<intake>.json` (or the GIO ticket): no name, no DOB.

## Fallback

No earlier run exists in this repository. Show `npm run demo:verify -- --kb-gap` and `npm run eval` output.

## Mapping from the Nightwing demo

| Nightwing                            | Here                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `prospects/nightwing`                | `prospects/foomedical.json` (portal, Acme Cardio patch v2, Messages, Appointments; voice keyterms; synthetic disclaimer) |
| KB-101 to KB-402                     | `kb/foomedical/KB-101` to `KB-402` plus `kb/medplum-docs.json`                                                           |
| NGHTWNG                              | GIO with the intake labels above                                                                                         |
| SDK triage (`@grok/agent-sdk` 0.5.0) | `agents/triage` on `@grok/agent-sdk` 0.6.0                                                                               |
| 14-case eval harness                 | `evals/cases.json`, scored offline by `scripts/eval.mjs` and by the SDK eval                                             |
| server-enforced confirm              | `lib/intake.mjs`                                                                                                         |

The Nightwing source was not readable from the build environment, so this folder was rebuilt from the design plan rather than copied. The Grok Voice client is not wired: `POST /api/voice/session` returns 503 without `XAI_API_KEY` and 501 with it.
