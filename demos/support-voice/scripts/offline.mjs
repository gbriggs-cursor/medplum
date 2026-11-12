#!/usr/bin/env node
// Key-free L9 run from the repo root: node demos/support-voice/scripts/offline.mjs
// Replays a checked-in call and agent turn, redacts for real, and writes an OFFLINE GIO ticket.
// With every live key set (or DEMO_MODE=live), creates the issue through the existing live Jira path instead.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyDemoMode } from '../../_shared/demo-mode.mjs';
import { redact } from '../../_shared/phi/redact.mjs';
import { buildGioIssue, writeGioIssue } from '../lib/jira.mjs';
import { submit } from '../lib/pipeline.mjs';
import { triage } from '../lib/triage.mjs';

const storyDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const offlineCommand = 'node demos/support-voice/scripts/offline.mjs';
const replay = JSON.parse(readFileSync(join(storyDir, 'fixtures', 'replay', 'call.json'), 'utf8'));
const call = replay.call;
const agent = replay.agent.input;
const intakeId = 'INTAKE-replay-pair';

const mode = applyDemoMode({
  needs: ['XAI_API_KEY', 'CURSOR_API_KEY', 'JIRA'],
  offlineCommand,
  kind: 'REPLAY (no key)',
});

if (mode === 'live') {
  const out = await submit({ ...call, channel: 'voice' }, { intakeId, live: true });
  console.log(`live: GIO ${out.written.key}`);
  process.exit(0);
}

const known = [call.caller_name, call.dob, call.callback];
const issue = redact(call.issue, { known });
if (issue.text !== agent.redacted_issue) {
  console.error(`Replay agent redacted_issue is stale.\nrecorded: ${agent.redacted_issue}\nredacted: ${issue.text}`);
  process.exit(1);
}
const baseline = triage({ issue: issue.text, product: agent.product });
if (baseline.category !== agent.category || baseline.article !== agent.article) {
  console.error(
    `Replay agent turn does not match triage: ${agent.category}/${agent.article ?? '-'} vs ${baseline.category}/${baseline.article ?? '-'}`
  );
  process.exit(1);
}

const { payload } = buildGioIssue(
  { ...call, channel: 'voice', issue: call.issue, transcript: call.transcript },
  {
    category: agent.category,
    product: agent.product,
    article: agent.article,
    references: baseline.references,
    reason: agent.reason,
    priority: baseline.priority,
  },
  { intakeId }
);
const written = await writeGioIssue(payload, { offline: true, name: intakeId });
const fileText = readFileSync(join(storyDir, written.file), 'utf8');
const leaked = [call.caller_name, ...call.caller_name.split(' '), call.dob, '555-0100'].filter((s) =>
  fileText.includes(s)
);

console.log('REPLAY (no key)');
console.log(`REPLAY (no key): call transcript demos/support-voice/fixtures/replay/call.json`);
console.log(`REPLAY (no key): agent ${replay.agent.tool} turn (${agent.category}, ${agent.article})`);
console.log(`redacted issue: ${issue.text}`);
console.log(`OFFLINE`);
console.log(`OFFLINE: GIO ticket demos/support-voice/${written.file}`);
if (leaked.length) {
  console.error(`ticket still holds ${leaked.join(', ')}`);
  process.exit(1);
}
console.log('identity in ticket: none');
