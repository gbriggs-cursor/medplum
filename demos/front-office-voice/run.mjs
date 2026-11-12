#!/usr/bin/env node
// Key-free path for G9. Replays the caller scripts through the L9 confirm and redaction, then the
// front-office route. The ticket is OFFLINE dry-run JSON. No voice session and no Jira HTTP.
//   node demos/front-office-voice/run.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { redact } from '../_shared/phi/redact.mjs';
import { resolveDemoMode } from '../_shared/scripts/demo-mode.mjs';
import { createIntakeStore } from '../support-voice/lib/intake.mjs';
import { assertSafe, buildGioIssue } from '../support-voice/lib/jira.mjs';
import { routeFrontOffice } from './lib/route.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const command = 'node demos/front-office-voice/run.mjs';
const liveKeys = ['XAI_API_KEY', 'JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_KEY'];
const mode = resolveDemoMode(liveKeys, command);

if (mode === 'live') {
  console.log(
    'LIVE: node demos/support-voice/server.mjs --live-jira is unchanged. With XAI_API_KEY the voice route still returns 501 (client not wired). This command does not start the server and does not call Jira.'
  );
  process.exit(0);
}

const fixture = JSON.parse(readFileSync(join(here, 'fixtures', 'replay', 'calls.json'), 'utf8'));
console.log(fixture.label);
const only = process.env.CALL;
const calls = fixture.calls.filter((call) => !only || call.id === only);
if (calls.length === 0) {
  console.error(`no replayed call ${only}`);
  process.exit(1);
}

const outDir = join(here, 'run');
mkdirSync(outDir, { recursive: true });
const results = [];
for (const call of calls) {
  const store = createIntakeStore();
  const drafted = store.draft({ ...call, channel: 'voice', transcript: call.issue });
  const confirmed = store.confirm(drafted.id, drafted.confirmToken, { confirmed: true });
  if (confirmed.state !== 'confirmed') {
    console.error(`${call.id}: confirm did not complete`);
    process.exit(1);
  }
  const intake = confirmed.intake;
  const known = [intake.caller_name, intake.dob, intake.callback].filter(Boolean);
  const decision = routeFrontOffice({ issue: redact(intake.issue, { known }).text, product: intake.product });
  const { payload, redaction } = buildGioIssue(intake, decision, { intakeId: drafted.id });
  assertSafe(payload, known);
  const ok = decision.category === call.expect;
  results.push({
    call: call.id,
    intakeId: drafted.id,
    expected: call.expect,
    category: decision.category,
    article: decision.article,
    reason: decision.reason,
    kb: decision.kb,
    redaction,
    ticket: payload,
  });
  console.log(
    `REPLAY (no key): ${call.id} confirmed. Route ${decision.category}${decision.article ? ` (${decision.article})` : ''}, intended ${call.expect}: ${ok ? 'match' : 'MISMATCH'}. ${decision.reason}`
  );
}
const mismatches = results.filter((r) => r.category !== r.expected);

const ticket = {
  label: 'OFFLINE',
  mode: 'OFFLINE',
  project: 'GIO',
  action: 'dry-run',
  note: 'Not sent to Jira. Replayed caller scripts, L9 confirm and redaction, front-office route.',
  results,
};
const path = join(outDir, 'jira.json');
writeFileSync(path, JSON.stringify(ticket, null, 2) + '\n');
console.log(`OFFLINE: dry-run ticket ${path}`);
if (mismatches.length) {
  console.error(`REPLAY (no key): ${mismatches.length} caller(s) did not land on the intended route`);
  process.exit(1);
}
