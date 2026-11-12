#!/usr/bin/env node
// Design review gate on evidence v2 for the P1 device cohort.
//
//   node demos/approval-gate/gate.mjs build
//   node demos/approval-gate/gate.mjs approve --signer "<name>" --role "<role>" [--decision approved|rejected]
//                                             [--meaning "<text>"] [--channel grok-bot|cli]
//   node demos/approval-gate/gate.mjs verify
//
// build never waits for a decision. approve records one in approval.json, bound to the
// sha256 of EVIDENCE.md (without its Approval line) and trace.json. verify exits 1 when the
// evidence changed after the decision.

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const pack = 'demos/_shared/data-packs/p1-device-cohort';
const out = resolve(process.env.APPROVAL_GATE_OUT ?? join(here, 'evidence'));
const STORY = 'approval-gate';
const REQUIREMENT =
  'REQ-001: Medplum ingests and displays Acme Cardio patch v2 blood-pressure panels and ECG summaries.';
const TRACE = [
  { test: 'parseEcgSummary reads component valueSampledData', req: 'REQ-001', risk: 'RISK-002' },
  { test: 'parseEcgSummary throws when sampled data is missing', req: 'REQ-001', risk: 'RISK-002' },
  { test: 'MockClient ingests the synthetic Acme Cardio patch v2 bundle', req: 'REQ-001', risk: 'RISK-001' },
  {
    test: 'Foo Medical Vitals shows ingested blood pressure for the signed-in patient',
    req: 'REQ-001',
    risk: 'RISK-001',
  },
];

const [command] = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const git = (...a) => execFileSync('git', a, { cwd: repoRoot, encoding: 'utf8' }).trim();
const sha256 = (text) => createHash('sha256').update(text).digest('hex');
const withoutApproval = (md) =>
  md
    .split('\n')
    .filter((l) => !l.startsWith('Approval:'))
    .join('\n');

function record() {
  const files = {
    'EVIDENCE.md': sha256(withoutApproval(readFileSync(join(out, 'EVIDENCE.md'), 'utf8'))),
    'trace.json': sha256(readFileSync(join(out, 'trace.json'))),
  };
  const digest = sha256(
    Object.keys(files)
      .sort()
      .map((f) => `${f}:${files[f]}\n`)
      .join('')
  );
  return { algorithm: 'sha256', files, digest };
}

function build() {
  const manifest = JSON.parse(readFileSync(join(repoRoot, pack, 'manifest.json'), 'utf8'));
  if (manifest.synthetic !== true) {
    console.error(`approval-gate: ${pack}/manifest.json is not marked synthetic; stopping`);
    process.exit(1);
  }
  mkdirSync(out, { recursive: true });
  for (const f of ['approval.json', 'APPROVAL-CARD.md']) {
    if (existsSync(join(out, f))) {
      unlinkSync(join(out, f));
    }
  }
  const commit = git('rev-parse', 'HEAD');
  const reportFile = join(out, 'vitest.json');
  const r = spawnSync('npx', ['vitest', 'run', '--reporter=default', '--reporter=json', `--outputFile=${reportFile}`], {
    cwd: join(repoRoot, pack),
    encoding: 'utf8',
  });
  const log = `${r.stdout}${r.stderr}EXIT:${r.status}\n`;
  writeFileSync(join(out, 'test-log.txt'), log);
  if (!existsSync(reportFile)) {
    process.stdout.write(log);
    process.exit(2);
  }
  const report = JSON.parse(readFileSync(reportFile, 'utf8'));
  unlinkSync(reportFile);
  const assertions = report.testResults.flatMap((f) => f.assertionResults);
  const date = new Date().toISOString();
  const run = {
    id: 'run-1',
    label: 'design review build',
    command: `npx vitest run (in ${pack})`,
    date,
    tree: 'repository',
    passed: report.numPassedTests,
    failed: report.numFailedTests,
    exit: r.status,
  };
  const rows = TRACE.map((t) => {
    const a = assertions.find((x) => x.fullName === t.test);
    return {
      req: t.req,
      risk: t.risk,
      test: t.test,
      run: run.id,
      result: a?.status === 'passed' ? 'pass' : 'fail',
      commit,
    };
  });
  const trace = { schema: 'evidence-v2/trace', version: 2, story: STORY, synthetic: true, commit, runs: [run], rows };
  writeFileSync(join(out, 'trace.json'), `${JSON.stringify(trace, null, 2)}\n`);

  const ids = [...new Set(rows.flatMap((x) => [x.req, x.risk]))].join(', ');
  const result = run.failed === 0 && r.status === 0 ? 'pass' : 'fail';
  const md = [
    `Requirement: ${REQUIREMENT}`,
    `Change: ${arg('change', `P1 device cohort (${pack}, seed ${manifest.seed}): ECG summary parser and Foo Medical vitals ingest`)}`,
    `Test: ${run.command}`,
    `Result: ${result} (${run.passed} passed, ${run.failed} failed)`,
    'Synthetic: true',
    `Commit: ${commit}`,
    `Trace: ${ids}`,
    'Approval: pending',
    '',
    '| Requirement | Test | Run | Result |',
    '| --- | --- | --- | --- |',
    ...rows.map((x) => `| ${x.req} (${x.risk}) | ${x.test} | ${run.command}, ${date.slice(0, 10)} | ${x.result} |`),
    '',
    '## Test log',
    '',
    '```',
    log.trimEnd(),
    '```',
    '',
  ].join('\n');
  writeFileSync(join(out, 'EVIDENCE.md'), md);

  const rec = record();
  const card = [
    '# Approval card: design review',
    '',
    `Story: ${STORY} (stage 06 Approve). Synthetic: true.`,
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Requirement | ${REQUIREMENT} |`,
    `| Trace | ${ids} |`,
    `| Result | ${result} (${run.passed} passed, ${run.failed} failed) |`,
    `| Data | ${manifest.counts.Patient} synthetic patients, ${manifest.counts.Device} devices, seed ${manifest.seed} |`,
    `| Commit | \`${commit}\` |`,
    `| Record digest | \`${rec.digest}\` |`,
    '',
    'Approving means: the evidence above shows the design input is met. The decision is bound to this digest; any later edit to EVIDENCE.md or trace.json invalidates it.',
    '',
    'Approve:',
    '',
    '```',
    'node demos/approval-gate/gate.mjs approve --signer "<name>" --role "<role>" --channel grok-bot',
    '```',
    '',
    'Reject:',
    '',
    '```',
    'node demos/approval-gate/gate.mjs approve --decision rejected --signer "<name>" --role "<role>" --channel grok-bot',
    '```',
    '',
  ].join('\n');
  writeFileSync(join(out, 'APPROVAL-CARD.md'), card);
  console.log(`approval-gate: build ${result} (${run.passed} passed, ${run.failed} failed). Approval: pending`);
  console.log(`approval-gate: record digest ${rec.digest}`);
  process.exit(result === 'pass' ? 0 : 1);
}

function approve() {
  const signer = arg('signer');
  const role = arg('role');
  const decision = arg('decision', 'approved');
  if (!signer || !role || !['approved', 'rejected'].includes(decision)) {
    console.error('approval-gate: approve needs --signer, --role, and --decision approved|rejected');
    process.exit(2);
  }
  if (!existsSync(join(out, 'EVIDENCE.md')) || !existsSync(join(out, 'trace.json'))) {
    console.error('approval-gate: no evidence to approve; run build first');
    process.exit(1);
  }
  const trace = JSON.parse(readFileSync(join(out, 'trace.json'), 'utf8'));
  const decidedAt = new Date().toISOString();
  const approval = {
    schema: 'evidence-v2/approval',
    version: 2,
    story: STORY,
    synthetic: true,
    commit: trace.commit,
    decision,
    meaning: arg('meaning', `Design review ${decision === 'approved' ? 'passed' : 'failed'} for REQ-001`),
    signer: { name: signer, role },
    decided_at: decidedAt,
    channel: arg('channel', 'cli'),
    record: record(),
  };
  writeFileSync(join(out, 'approval.json'), `${JSON.stringify(approval, null, 2)}\n`);
  const mdPath = join(out, 'EVIDENCE.md');
  const md = readFileSync(mdPath, 'utf8').replace(
    /^Approval: .*$/m,
    `Approval: ${decision} by ${signer} (${role}) at ${decidedAt}`
  );
  writeFileSync(mdPath, md);
  console.log(`approval-gate: ${decision} by ${signer} (${role}); digest ${approval.record.digest}`);
}

function verify() {
  const path = join(out, 'approval.json');
  if (!existsSync(path)) {
    console.log('approval-gate: no decision recorded (Approval: pending)');
    process.exit(1);
  }
  const approval = JSON.parse(readFileSync(path, 'utf8'));
  const now = record();
  const changed = Object.keys(now.files).filter((f) => now.files[f] !== approval.record.files[f]);
  if (changed.length) {
    console.log(`approval-gate: INVALID. Changed after the decision: ${changed.join(', ')}`);
    process.exit(1);
  }
  console.log(
    `approval-gate: VALID. ${approval.decision} by ${approval.signer.name} (${approval.signer.role}) at ${approval.decided_at}; digest ${now.digest}`
  );
}

const commands = { build, approve, verify };
if (!commands[command]) {
  console.error('usage: gate.mjs build | approve --signer <name> --role <role> | verify');
  process.exit(2);
}
commands[command]();
