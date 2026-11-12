#!/usr/bin/env node
// Key-free requirements clerk. Reads the notes, replays the clerk turn,
// and writes a Jira dry-run. Does not call Jira or a bot.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { announceLive, fillProspect, prospectName, readJson, selectMode, writeJson, writeText } from '../_shared/scripts/demo-mode.mjs';

const command = 'node demos/requirements-clerk/offline.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const decision = selectMode({
  requiredKeys: ['XAI_API_KEY', 'JIRA_API_TOKEN'],
  command,
});

if (decision.mode === 'blocked') {
  process.exit(3);
}
if (decision.mode === 'live') {
  announceLive('demos/requirements-clerk/prompt.md');
  process.exit(0);
}

const prospect = prospectName();
const notes = fillProspect(readFileSync(join(here, 'seed/meeting-notes.md'), 'utf8'), prospect);
const register = YAML.parse(readFileSync(join(here, 'seed/id-register.yaml'), 'utf8'));
const jiraRead = readJson(join(here, 'fixtures/jira/search.json'));
const turn = readJson(join(here, 'fixtures/replay/clerk-turn.json'));
const headings = ['ECG summary', 'High systolic reading', 'Verification record', 'Pairing failure'];
const phrases = ['5 seconds', '180 mmHg', 'software version', 'synthetic error code'];

if (jiraRead.label !== 'OFFLINE') {
  fail('Jira read fixture is missing the OFFLINE label');
}
if (turn.label !== 'REPLAY (no key)') {
  fail('replay turn is missing the REPLAY (no key) label');
}
if (register.next_id !== 'REQ-010') {
  fail('id register next_id is not REQ-010');
}
for (const heading of headings) {
  if (!notes.includes(`## ${heading}`)) {
    fail(`meeting notes are missing ${heading}`);
  }
}
if (!notes.toLowerCase().includes('teal')) {
  fail('meeting notes are missing the brand aside');
}
if (!Array.isArray(turn.requirements) || turn.requirements.length !== headings.length) {
  fail('replay does not have one requirement per design-input heading');
}

const allocated = new Set((register.allocated ?? []).map((row) => row.id));
const labels = ['demo', 'medplum', 'story:requirements-clerk', 'track:ls', 'stage:01'];
const creates = turn.requirements.map((req, index) => {
  const expectedId = `REQ-${String(10 + index).padStart(3, '0')}`;
  const designInput = fillProspect(req.design_input, prospect);
  if (req.req_id !== expectedId) {
    fail(`replay id ${req.req_id} is not ${expectedId}`);
  }
  if (allocated.has(req.req_id)) {
    fail(`replay reuses allocated id ${req.req_id}`);
  }
  if (req.safety_class !== null) {
    fail(`${req.req_id} assigns a safety class; the risk teammate owns that`);
  }
  if (!designInput.includes(phrases[index])) {
    fail(`${req.req_id} does not carry the phrase from ${headings[index]}`);
  }
  if (/teal/i.test(designInput)) {
    fail('replay filed the brand aside');
  }
  if (!String(req.source).includes(headings[index])) {
    fail(`${req.req_id} source does not name ${headings[index]}`);
  }
  return {
    operation: 'create',
    dry_run_id: `OFFLINE-${req.req_id}`,
    summary: `${req.req_id} ${req.title}`,
    labels,
    design_input: designInput,
    transition: null,
    comment: null,
  };
});

const readKeys = new Set(jiraRead.issues.map((issue) => issue.key));
if (creates.some((row) => readKeys.has(row.dry_run_id) || row.summary.startsWith('REQ-001'))) {
  fail('dry-run would create or rewrite an issue that was only read');
}

const record = {
  mode: 'REPLAY (no key)',
  synthetic: true,
  htest: true,
  skipped: turn.skipped,
  requirements: turn.requirements.map((req, index) => ({
    req_id: req.req_id,
    title: req.title,
    design_input: fillProspect(req.design_input, prospect),
    source: req.source,
    acceptance: req.acceptance,
    safety_class: null,
    synthetic: true,
    htest: true,
    jira_key: null,
    offline_create: creates[index].dry_run_id,
    labels,
  })),
};

const dryRun = {
  label: 'OFFLINE',
  mode: 'OFFLINE',
  project: 'GIO',
  read_fixture: 'demos/requirements-clerk/fixtures/jira/search.json',
  issues_read: jiraRead.issues.map((issue) => issue.key),
  status_changes: [],
  comments: [],
  creates,
};

writeText(join(here, 'run/requirements.yaml'), YAML.stringify(record));
writeJson(join(here, 'run/jira-dry-run.json'), dryRun);
writeText(
  join(here, 'run/EVIDENCE.md'),
  [
    'REPLAY (no key)',
    'Requirement: Meeting notes become four traced design inputs, REQ-010 through REQ-013, and the brand aside is not filed.',
    'Change: Wrote demos/requirements-clerk/run/requirements.yaml from the replayed clerk turn.',
    'Test: node demos/requirements-clerk/offline.mjs',
    'Result: pass (4 design inputs, 0 safety classes, 0 external submissions)',
    'Synthetic: true',
    'Commit: not a live commit. This file is runner output and is not the catalog-check evidence.',
    '',
    'OFFLINE: Jira creates are in demos/requirements-clerk/run/jira-dry-run.json. No issue was created, transitioned, or commented on.',
    '',
  ].join('\n')
);

console.log('REPLAY (no key): requirements clerk turn from demos/requirements-clerk/fixtures/replay/clerk-turn.json');
console.log(`REPLAY (no key): filed ${creates.map((row) => row.summary.split(' ')[0]).join(', ')}; skipped the brand aside`);
console.log(`OFFLINE: read ${jiraRead.issues.length} GIO issues from demos/requirements-clerk/fixtures/jira/search.json`);
console.log(`OFFLINE: ${creates.length} GIO creates written to demos/requirements-clerk/run/jira-dry-run.json (no status change, no comment)`);

function fail(message) {
  console.error(`requirements-clerk: ${message}`);
  process.exit(1);
}
