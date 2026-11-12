#!/usr/bin/env node
// Key-free audit Q&A. Reads the trace index and prints the replayed answer.
// Does not call a bot. The Jira dry-run records that this story writes no issues.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { announceLive, fillProspect, prospectName, selectMode, writeJson, writeText } from '../_shared/scripts/demo-mode.mjs';

const command = 'node demos/audit-qa/offline.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const decision = selectMode({
  requiredKeys: ['XAI_API_KEY'],
  command,
});

if (decision.mode === 'blocked') {
  process.exit(3);
}
if (decision.mode === 'live') {
  announceLive('demos/audit-qa/prompt.md');
  process.exit(0);
}

const prospect = prospectName();
const index = YAML.parse(readFileSync(join(here, 'seed/trace-index.yaml'), 'utf8'));
const row = index.rows.find((item) => item.req_id === 'REQ-012');
if (!row) {
  console.error('audit-qa: REQ-012 is not in the trace index');
  process.exit(1);
}

const answer = fillProspect(readFileSync(join(here, 'fixtures/replay/req-012.md'), 'utf8'), prospect);
const required = [
  'REPLAY (no key)',
  'REQ-012',
  fillProspect(row.requirement, prospect).replace(/\s+/g, ' '),
  row.risk.id,
  row.risk.safety_class,
  row.test.name,
  String(row.run),
  row.result,
  row.approval.who,
  row.approval.meaning,
  row.approval.when,
  row.commit.sha,
  'did not execute',
];
const flat = answer.replace(/\s+/g, ' ');
for (const piece of required) {
  if (!flat.includes(piece.replace(/\s+/g, ' '))) {
    console.error(`audit-qa: replay answer is missing ${JSON.stringify(piece)}`);
    process.exit(1);
  }
}
if (index.executed !== false || row.executed !== false) {
  console.error('audit-qa: index row must stay executed: false');
  process.exit(1);
}

const dryRun = {
  label: 'OFFLINE',
  mode: 'OFFLINE',
  project: 'GIO',
  read_fixture: null,
  issues_read: 0,
  status_changes: [],
  comments: [],
  creates: [],
  note: 'Audit Q&A does not create, transition, or comment on GIO issues.',
};

writeText(join(here, 'run/answer.md'), answer.endsWith('\n') ? answer : `${answer}\n`);
writeJson(join(here, 'run/jira-dry-run.json'), dryRun);
writeText(
  join(here, 'run/EVIDENCE.md'),
  [
    'REPLAY (no key)',
    'Requirement: Asking for REQ-012 returns the requirement, risk, test, run, result, approval, and commit from the fixture index.',
    'Change: Wrote demos/audit-qa/run/answer.md from fixtures/replay/req-012.md after checking it against seed/trace-index.yaml.',
    'Test: node demos/audit-qa/offline.mjs',
    'Result: pass (1 replayed answer, 0 Jira writes)',
    'Synthetic: true',
    'Commit: not a live commit. This file is runner output and is not the catalog-check evidence.',
    '',
    'OFFLINE: demos/audit-qa/run/jira-dry-run.json records zero creates. No issue was created, transitioned, or commented on.',
    '',
  ].join('\n')
);

console.log(answer.trimEnd());
console.log('OFFLINE: 0 GIO creates written to demos/audit-qa/run/jira-dry-run.json (no status change, no comment)');
