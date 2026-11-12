#!/usr/bin/env node
// Key-free risk teammate. Reads the hazard seed, replays the assessment,
// and writes a Jira dry-run. Does not call Jira or a bot.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { announceLive, fillProspect, prospectName, readJson, selectMode, writeJson, writeText } from '../_shared/scripts/demo-mode.mjs';

const command = 'node demos/risk-teammate/offline.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const classForSeverity = { 1: 'A', 2: 'B', 3: 'C' };
const decision = selectMode({
  requiredKeys: ['XAI_API_KEY', 'JIRA_API_TOKEN'],
  command,
});

if (decision.mode === 'blocked') {
  process.exit(3);
}
if (decision.mode === 'live') {
  announceLive('demos/risk-teammate/prompt.md');
  process.exit(0);
}

const prospect = prospectName();
const intended = fillProspect(readFileSync(join(here, 'seed/intended-use.md'), 'utf8'), prospect);
const log = YAML.parse(readFileSync(join(here, 'seed/hazard-log.yaml'), 'utf8'));
const unassessed = YAML.parse(readFileSync(join(here, 'seed/unassessed.yaml'), 'utf8'));
const jiraRead = readJson(join(here, 'fixtures/jira/search.json'));
const turn = readJson(join(here, 'fixtures/replay/clerk-turn.json'));
const filed = new Set((log.hazards ?? []).map((row) => row.id));

if (!intended.includes('180 mmHg')) {
  fail('intended use is missing the alert threshold');
}
if (jiraRead.label !== 'OFFLINE') {
  fail('Jira read fixture is missing the OFFLINE label');
}
if (turn.label !== 'REPLAY (no key)') {
  fail('replay turn is missing the REPLAY (no key) label');
}
if (unassessed.hazard !== null || unassessed.safety_class !== null) {
  fail('unassessed seed already has a hazard or class');
}
if (turn.req_id !== unassessed.req_id) {
  fail(`replay req_id ${turn.req_id} does not match ${unassessed.req_id}`);
}
if (turn.id !== log.next_id) {
  fail(`replay id ${turn.id} does not match next_id ${log.next_id}`);
}
if (filed.has(turn.id)) {
  fail(`replay re-files ${turn.id}`);
}
if (![1, 2, 3].includes(turn.severity) || classForSeverity[turn.severity] !== turn.safety_class) {
  fail(`safety class ${turn.safety_class} does not follow the fictional rule for severity ${turn.severity}`);
}
if (turn.status !== 'ready-for-review') {
  fail('replay status is not ready-for-review');
}

const record = {
  mode: 'REPLAY (no key)',
  id: turn.id,
  req_id: turn.req_id,
  hazard: turn.hazard,
  situation: fillProspect(turn.situation, prospect),
  harm: turn.harm,
  sequence: turn.sequence,
  severity: turn.severity,
  probability: turn.probability,
  safety_class: turn.safety_class,
  risk_control: turn.risk_control,
  status: turn.status,
  override: 'A reviewer may change safety_class later. This run does not wait.',
  synthetic: true,
  htest: true,
  jira_key: null,
  jira_dry_run: 'demos/risk-teammate/run/jira-dry-run.json',
};

const dryRun = {
  label: 'OFFLINE',
  mode: 'OFFLINE',
  project: 'GIO',
  read_fixture: 'demos/risk-teammate/fixtures/jira/search.json',
  issues_read: jiraRead.issues.map((issue) => issue.key),
  status_changes: [],
  comments: [],
  creates: [
    {
      operation: 'create',
      dry_run_id: `OFFLINE-${turn.id}`,
      summary: `${turn.id} ${turn.req_id}`,
      labels: ['demo', 'medplum', 'story:risk-teammate', 'track:ls', 'stage:02'],
      safety_class: turn.safety_class,
      status: 'ready-for-review',
      transition: null,
      comment: null,
    },
  ],
};

if (dryRun.issues_read.includes(dryRun.creates[0].dry_run_id)) {
  fail('dry-run id collides with an issue that was only read');
}
if (!filed.has('HAZ-001')) {
  fail('hazard log is missing HAZ-001');
}

writeText(join(here, 'run/hazard.yaml'), YAML.stringify(record));
writeJson(join(here, 'run/jira-dry-run.json'), dryRun);
writeText(
  join(here, 'run/EVIDENCE.md'),
  [
    'REPLAY (no key)',
    `Requirement: One hazard is filed for ${turn.req_id} with a safety class, ready for review, and HAZ-001 is left as it was.`,
    `Change: Wrote demos/risk-teammate/run/hazard.yaml from the replayed assessment (${turn.id}, class ${turn.safety_class}).`,
    'Test: node demos/risk-teammate/offline.mjs',
    'Result: pass (1 hazard, 0 edits to HAZ-001, 0 external submissions)',
    'Synthetic: true',
    'Commit: not a live commit. This file is runner output and is not the catalog-check evidence.',
    '',
    'OFFLINE: The Jira create is in demos/risk-teammate/run/jira-dry-run.json. No issue was created, transitioned, or commented on.',
    '',
  ].join('\n')
);

console.log('REPLAY (no key): risk teammate turn from demos/risk-teammate/fixtures/replay/clerk-turn.json');
console.log(`REPLAY (no key): ${turn.id} ${turn.req_id} severity=${turn.severity} safety_class=${turn.safety_class} status=${turn.status}`);
console.log(`OFFLINE: read ${jiraRead.issues.length} GIO issues from demos/risk-teammate/fixtures/jira/search.json`);
console.log('OFFLINE: 1 GIO create written to demos/risk-teammate/run/jira-dry-run.json (no status change, no comment)');

function fail(message) {
  console.error(`risk-teammate: ${message}`);
  process.exit(1);
}
