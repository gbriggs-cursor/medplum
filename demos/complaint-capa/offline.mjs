#!/usr/bin/env node
// Key-free complaint-to-CAPA run. Reads the seed, replays the clerk turn,
// and writes a Jira dry-run. Does not call Jira or a bot.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { announceLive, fillProspect, prospectName, readJson, selectMode, writeJson, writeText } from '../_shared/scripts/demo-mode.mjs';

const command = 'node demos/complaint-capa/offline.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const decision = selectMode({
  requiredKeys: ['XAI_API_KEY', 'JIRA_API_TOKEN'],
  command,
});

if (decision.mode === 'blocked') {
  process.exit(3);
}
if (decision.mode === 'live') {
  announceLive('demos/complaint-capa/prompt.md');
  process.exit(0);
}

const prospect = prospectName();
const complaint = fillProspect(readFileSync(join(here, 'seed/complaint.md'), 'utf8'), prospect);
const sop = fillProspect(readFileSync(join(here, 'seed/sop.md'), 'utf8'), prospect);
const register = YAML.parse(readFileSync(join(here, 'seed/id-register.yaml'), 'utf8'));
const jiraRead = readJson(join(here, 'fixtures/jira/search.json'));
const turn = readJson(join(here, 'fixtures/replay/clerk-turn.json'));
const applied = applySop(complaint);

if (jiraRead.label !== 'OFFLINE') {
  fail('Jira read fixture is missing the OFFLINE label');
}
if (turn.label !== 'REPLAY (no key)') {
  fail('replay turn is missing the REPLAY (no key) label');
}
if (register.next_complaint_id !== turn.complaint_id || register.next_capa_id !== turn.capa_id) {
  fail('replay ids do not match seed/id-register.yaml');
}
if (turn.sop_section !== applied.section || turn.reportability !== applied.reportability || turn.capa !== applied.capa) {
  fail(`replay ${turn.sop_section}/${turn.reportability}/${turn.capa} does not match the SOP reading ${applied.section}/${applied.reportability}/${applied.capa}`);
}
if (!sop.includes(applied.section)) {
  fail(`SOP is missing ${applied.section}`);
}
if (!complaint.includes('SP-014') || !complaint.includes('No injury was reported')) {
  fail('complaint seed is missing the synthetic subject or the injury line');
}

const event = fillProspect(turn.event, prospect);
const record = {
  mode: 'REPLAY (no key)',
  complaint_id: turn.complaint_id,
  capa_id: turn.capa_id,
  source_fixture: 'demos/complaint-capa/seed/complaint.md',
  live_ticket: false,
  synthetic_subject: 'SP-014',
  device: `${prospect} patch v2`,
  event,
  injury_alleged: false,
  sop_section: turn.sop_section,
  reportability: turn.reportability,
  reportability_rationale: turn.reportability_rationale,
  capa: turn.capa,
  capa_rationale: turn.capa_rationale,
  status: 'ready-for-review',
  override: 'A reviewer may change reportability or capa later. This run does not wait.',
  submitted_externally: false,
  synthetic: true,
  htest: true,
  jira_key: null,
  jira_dry_run: 'demos/complaint-capa/run/jira-dry-run.json',
};

const dryRun = {
  label: 'OFFLINE',
  mode: 'OFFLINE',
  project: 'GIO',
  read_fixture: 'demos/complaint-capa/fixtures/jira/search.json',
  issues_read: jiraRead.issues.length,
  status_changes: [],
  comments: [],
  creates: [
    {
      operation: 'create',
      dry_run_id: 'OFFLINE-CMP-001',
      summary: `${turn.complaint_id} ${turn.synthetic_subject}`,
      labels: ['demo', 'medplum', 'story:complaint-capa', 'track:ls', 'stage:post-market'],
      reportability: turn.reportability,
      submitted_externally: false,
    },
    {
      operation: 'create',
      dry_run_id: 'OFFLINE-CAPA-001',
      summary: `${turn.capa_id} ${turn.complaint_id}`,
      labels: ['demo', 'medplum', 'story:complaint-capa', 'track:ls', 'stage:post-market'],
      capa: turn.capa,
      submitted_externally: false,
    },
  ],
};

writeText(join(here, 'run/complaint.yaml'), YAML.stringify(record));
writeJson(join(here, 'run/jira-dry-run.json'), dryRun);
writeText(
  join(here, 'run/EVIDENCE.md'),
  [
    'REPLAY (no key)',
    'Requirement: A synthetic complaint is filed with a reportability call and a CAPA recommendation, ready for review, and nothing is submitted outside this run.',
    `Change: Wrote demos/complaint-capa/run/complaint.yaml from the replayed clerk turn (${turn.sop_section}).`,
    'Test: node demos/complaint-capa/offline.mjs',
    'Result: pass (1 complaint, 1 CAPA recommendation, 0 external submissions)',
    'Synthetic: true',
    'Commit: not a live commit. This file is runner output and is not the catalog-check evidence.',
    '',
    'OFFLINE: Jira creates are in demos/complaint-capa/run/jira-dry-run.json. No issue was created, transitioned, or commented on.',
    '',
  ].join('\n')
);

console.log('REPLAY (no key): complaint clerk turn from demos/complaint-capa/fixtures/replay/clerk-turn.json');
console.log(`REPLAY (no key): ${turn.complaint_id} ${turn.sop_section} reportability=${turn.reportability} capa=${turn.capa}`);
console.log(`OFFLINE: read ${jiraRead.issues.length} GIO issues from demos/complaint-capa/fixtures/jira/search.json`);
console.log('OFFLINE: 2 GIO creates written to demos/complaint-capa/run/jira-dry-run.json (no status change, no comment)');

function fail(message) {
  console.error(`complaint-capa: ${message}`);
  process.exit(1);
}

function applySop(text) {
  const death = /\bdeath\b/i.test(text) && !/\bno death\b/i.test(text);
  const injury = /injury/i.test(text) && !/no injury/i.test(text);
  const disputed = /different number/i.test(text);
  if (death) {
    return { section: 'CMP-SOP-1', reportability: 'yes', capa: 'open' };
  }
  if (injury) {
    return { section: 'CMP-SOP-2', reportability: 'yes', capa: 'open' };
  }
  if (disputed && /no injury/i.test(text)) {
    return { section: 'CMP-SOP-3', reportability: 'no', capa: 'open' };
  }
  if (/pairing failed/i.test(text)) {
    return { section: 'CMP-SOP-4', reportability: 'no', capa: 'do-not-open' };
  }
  fail('complaint matched no SOP section');
}
