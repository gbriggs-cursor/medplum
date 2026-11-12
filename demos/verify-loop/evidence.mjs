#!/usr/bin/env node
// Writes evidence/EVIDENCE.md (evidence v2) from the runs recorded in trace.json.
//
//   node demos/verify-loop/evidence.mjs --out <evidence dir> --remediator <agent|reference>

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const arg = (name) => process.argv[process.argv.indexOf(`--${name}`) + 1];
const out = resolve(arg('out'));
const remediator = arg('remediator');

const spec = JSON.parse(readFileSync(join(here, 'trace-spec.json'), 'utf8'));
const trace = JSON.parse(readFileSync(join(out, 'trace.json'), 'utf8'));
const guard = JSON.parse(readFileSync(join(out, 'guard.json'), 'utf8'));
const first = trace.runs[0];
const last = trace.runs[trace.runs.length - 1];
const log = readFileSync(join(out, `${last.id}.log.txt`), 'utf8');
const git = (...a) => execFileSync('git', a, { cwd: repoRoot, encoding: 'utf8' }).trim();
const netDiff = git('diff', '--stat', 'HEAD', '--', 'packages/');

const who =
  remediator === 'agent'
    ? 'Agent SDK remediator (demos/verify-loop/remediator, @grok/agent-sdk 0.6.0)'
    : 'reference remediator (reversed the planted patch; pipeline self-test, not an agent)';
const files = guard.changed.map((c) => c.file).join(', ');
const change = netDiff
  ? `${who} changed ${files}; net diff from the base commit: ${netDiff.split('\n').pop().trim()}`
  : `${who} changed ${files}; the result matches the base commit (no net diff)`;
const ids = spec.requirements.flatMap((r) => [r.req, r.risk]).join(', ');

const lines = [
  `Requirement: ${spec.requirements.map((r) => `${r.req}: ${r.text}`).join(' ')}`,
  `Change: ${change}`,
  `Test: node demos/verify-loop/ci.mjs (${last.command})`,
  `Result: ${last.failed === 0 ? 'pass' : 'fail'} (${last.passed} passed, ${last.failed} failed)`,
  'Synthetic: true',
  `Commit: ${trace.commit}`,
  `Trace: ${ids}`,
  '',
  `Loop: ${first.id} on the planted regression had ${first.failed} failed; ${last.id} after remediation had ${last.failed} failed. Guard: ${guard.accepted ? 'accepted' : 'rejected'} (source only, no test changes).`,
  '',
  '| Requirement | Test | Run | Result |',
  '| --- | --- | --- | --- |',
  ...spec.requirements.flatMap((r) =>
    trace.runs.map((run) => {
      const mine = trace.rows.filter((x) => x.req === r.req && x.run === run.id);
      const bad = mine.filter((x) => x.result === 'fail').length;
      return `| ${r.req} | ${mine.length} traced tests in ${spec.testFile} | ${run.id} (${run.label}), ${run.date.slice(0, 10)} | ${bad ? 'fail' : 'pass'} |`;
    })
  ),
  '',
  '## Test log',
  '',
  '```',
  log.trimEnd(),
  '```',
  '',
];
writeFileSync(join(out, 'EVIDENCE.md'), lines.join('\n'));
writeFileSync(join(out, 'test-log.txt'), log);
