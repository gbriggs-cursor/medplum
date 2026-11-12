# L10 Speech to FHIR

**Setup line:** "The patient just told support who they are and what's wrong. Where does that go?"

**Wow line:** "It's a validated QuestionnaireResponse on their chart, and the Jira ticket has none of their identity."

All data is synthetic.

## Flow

1. A transcript (Grok Voice output, or a seeded one) is parsed into name, birth date, callback, product and issue (`lib/extract.mjs`). Missing identity fields are reported, never guessed.
2. The synthetic Patient is matched by name + birth date, or created and tagged synthetic + HTEST.
3. The QuestionnaireResponse (`seed/questionnaire.json`, url `https://foomedical.example/fhir/Questionnaire/support-intake`) is checked with the server's `$validate` and written. The intake id is its identifier, so repeats don't duplicate it.
4. The L9 pipeline redacts and triages. The GIO ticket (dry-run) gets `QuestionnaireResponse/<id>` and no identity.

## Run it

Needs the local Medplum server on `http://localhost:8103` (override with `MEDPLUM_BASE_URL`, `MEDPLUM_EMAIL`, `MEDPLUM_PASSWORD`).

```bash
cd demos/speech-to-fhir
npm test                                   # extraction + mapping, offline
node scripts/run.mjs --transcript pairing  # also appointments-blank, airport, or --text "..."
./reset.sh                                 # deletes this story's Patients and QuestionnaireResponses
```

From the support page: `node ../support-voice/server.mjs --medplum`, submit the form, and the response shows `chart: QuestionnaireResponse/<id>`.

## What to click

Open `http://localhost:3000/QuestionnaireResponse/<id>` from the `run.mjs` output. Show the answers, then the Patient link. Then open the dry-run ticket in `demos/support-voice/run/outbox/` to show it holds no name or birth date.

## Not wired

Grok Voice is not connected (no `XAI_API_KEY`). Extraction is deterministic regex over the transcript, not a model.
