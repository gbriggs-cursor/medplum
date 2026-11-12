#!/usr/bin/env node
// Transcript -> fields -> QuestionnaireResponse on the synthetic patient's chart + redacted GIO ticket (dry-run).
//   node scripts/run.mjs [--transcript pairing|appointments-blank|airport] [--text "..."]
// Needs the local Medplum server (MEDPLUM_BASE_URL, default http://localhost:8103/).

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyDemoMode } from '../../_shared/demo-mode.mjs';
import { extractIntake } from '../lib/extract.mjs';
import { connect, seedQuestionnaire } from '../lib/medplum.mjs';
import { recordIntake } from '../lib/record.mjs';
import { QUESTIONNAIRE_URL } from '../lib/to-questionnaire-response.mjs';

const offlineCommand = 'node demos/speech-to-fhir/scripts/run.mjs';
const mode = applyDemoMode({
  needs: ['XAI_API_KEY'],
  offlineCommand,
  kind: 'REPLAY (no key)',
});

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const replay = mode === 'key-free' && !arg('--text');
const source = replay ? '../fixtures/replay/transcripts.json' : '../seed/transcripts.json';
const { transcripts } = JSON.parse(readFileSync(new URL(source, import.meta.url), 'utf8'));
const transcriptId = arg('--transcript') ?? 'pairing';
const text = arg('--text') ?? transcripts.find((t) => t.id === transcriptId)?.text;
if (!text) {
  console.error('Unknown transcript. Use --transcript pairing|appointments-blank|airport or --text "..."');
  process.exit(2);
}

const fields = extractIntake(text);
if (fields.missing.length) {
  console.error(
    `Transcript is missing ${fields.missing.join(', ')}; the voice agent would ask again before confirming.`
  );
  process.exit(1);
}
const intakeId = `INTAKE-${randomUUID().slice(0, 8)}`;
const intake = {
  caller_name: fields['caller-name'],
  dob: fields['birth-date'],
  callback: fields.callback,
  product: fields.product,
  issue: fields.issue,
  channel: 'voice',
  transcript: text,
};

if (replay) {
  console.log('REPLAY (no key)');
  console.log(`REPLAY (no key): transcript ${transcriptId} from demos/speech-to-fhir/fixtures/replay/transcripts.json`);
}

const medplum = await connect();
const questionnaire = await seedQuestionnaire(medplum);
const out = await recordIntake(medplum, intake, { intakeId, offline: mode === 'key-free' });
const onChart = await medplum.searchResources('QuestionnaireResponse', {
  subject: `Patient/${out.patient.id}`,
  questionnaire: QUESTIONNAIRE_URL,
  _sort: '-_lastUpdated',
});
const ticket = readFileSync(join(new URL('../../support-voice/', import.meta.url).pathname, out.written.file), 'utf8');
const leaked = [intake.caller_name, ...intake.caller_name.split(' '), intake.dob, fields.callback].filter(
  (s) => s && ticket.includes(s)
);

if (mode === 'key-free') {
  console.log('OFFLINE');
}
console.log(`transcript: ${text}`);
console.log(`extracted:  ${JSON.stringify({ ...fields, missing: undefined })}`);
console.log(`triage:     ${out.decision.category}${out.decision.article ? ` (${out.decision.article})` : ''}`);
console.log(
  `Medplum:    Questionnaire/${questionnaire.id}, Patient/${out.patient.id}, QuestionnaireResponse/${out.questionnaireResponse.id} ($validate: no errors)`
);
console.log(
  `chart:      ${onChart.length} support intake response(s) on Patient/${out.patient.id}; newest is intake ${onChart[0]?.identifier?.value}`
);
console.log(
  `GIO ticket: ${out.written.mode} demos/support-voice/${out.written.file}; identity in ticket: ${leaked.length ? leaked.join(', ') : 'none'}`
);
console.log(`app:        http://localhost:3000/QuestionnaireResponse/${out.questionnaireResponse.id}`);
process.exit(leaked.length ? 1 : 0);
