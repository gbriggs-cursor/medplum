#!/usr/bin/env node
// Verify-loop CI: runs the traced packages/core tests, appends one run to trace.json
// (evidence v2), rewrites TRACE.md, and exits 1 when any test fails.
//
//   node demos/verify-loop/ci.mjs --root <tree> --label <text> --out <evidence dir>
//
// <tree> is a checkout root (the repository, or the remediation workspace).

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const spec = JSON.parse(readFileSync(join(here, 'trace-spec.json'), 'utf8'));

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const root = resolve(arg('root', repoRoot));
const label = arg('label', 'ci');
const out = resolve(arg('out', join(here, 'evidence')));
mkdirSync(out, { recursive: true });

const tracePath = join(out, 'trace.json');
const trace = existsSync(tracePath)
  ? JSON.parse(readFileSync(tracePath, 'utf8'))
  : { schema: 'evidence-v2/trace', version: 2, story: spec.story, synthetic: true, runs: [], rows: [] };

const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
const runId = `run-${trace.runs.length + 1}`;
const reportFile = join(out, `${runId}.vitest.json`);
const testPath = spec.testFile.slice(spec.workspace.length + 1);
const command = `npx vitest run ${testPath} (in ${spec.workspace})`;

const result = spawnSync(
  'npx',
  ['vitest', 'run', testPath, '--reporter=default', '--reporter=json', `--outputFile=${reportFile}`],
  {
    cwd: join(root, spec.workspace),
    encoding: 'utf8',
  }
);
const log = `${result.stdout}${result.stderr}EXIT:${result.status}\n`;
writeFileSync(join(out, `${runId}.log.txt`), log);

if (!existsSync(reportFile)) {
  process.stdout.write(log);
  console.error(`verify-loop: vitest wrote no report (exit ${result.status})`);
  process.exit(2);
}
const report = JSON.parse(readFileSync(reportFile, 'utf8'));
const assertions = report.testResults.flatMap((f) => f.assertionResults);

const rows = [];
for (const r of spec.requirements) {
  for (const a of assertions.filter((x) => r.tests.some((t) => x.fullName.startsWith(t)))) {
    rows.push({
      req: r.req,
      risk: r.risk,
      test: a.fullName,
      run: runId,
      result: a.status === 'passed' ? 'pass' : 'fail',
      commit,
    });
  }
}

const run = {
  id: runId,
  label,
  command,
  date: new Date().toISOString(),
  tree: root === repoRoot ? 'repository' : 'remediation workspace',
  passed: report.numPassedTests,
  failed: report.numFailedTests,
  exit: result.status,
};
trace.commit = commit;
trace.runs.push(run);
trace.rows.push(...rows);
writeFileSync(tracePath, `${JSON.stringify(trace, null, 2)}\n`);
writeFileSync(join(out, 'TRACE.md'), renderMatrix(trace));

const failing = assertions.filter((a) => a.status !== 'passed').map((a) => a.fullName);
writeFileSync(join(out, `${runId}.failing.txt`), failing.map((n) => `- ${n}\n`).join(''));
console.log(`verify-loop ${runId} (${label}): ${run.passed} passed, ${run.failed} failed`);
for (const name of failing) {
  console.log(`  FAIL ${name}`);
}
for (const r of spec.requirements) {
  const mine = rows.filter((x) => x.req === r.req);
  const bad = mine.filter((x) => x.result === 'fail').length;
  console.log(`  ${r.req} / ${r.risk}: ${bad ? 'RED' : 'GREEN'} (${mine.length - bad}/${mine.length} tests pass)`);
}
process.exit(run.failed === 0 && result.status === 0 ? 0 : 1);

function renderMatrix(t) {
  const lines = [
    '# Trace matrix',
    '',
    `Story: ${t.story}. Synthetic: true. Commit: ${t.commit}`,
    '',
    '| Run | Label | Tree | Passed | Failed |',
    '| --- | --- | --- | --- | --- |',
    ...t.runs.map((r) => `| ${r.id} | ${r.label} | ${r.tree} | ${r.passed} | ${r.failed} |`),
    '',
    `| Requirement | Risk | ${t.runs.map((r) => r.id).join(' | ')} |`,
    `| --- | --- | ${t.runs.map(() => '---').join(' | ')} |`,
  ];
  for (const r of spec.requirements) {
    const cells = t.runs.map((run) => {
      const mine = t.rows.filter((x) => x.req === r.req && x.run === run.id);
      const bad = mine.filter((x) => x.result === 'fail').length;
      return bad ? `fail (${bad} of ${mine.length})` : `pass (${mine.length})`;
    });
    lines.push(`| ${r.req} | ${r.risk} | ${cells.join(' | ')} |`);
  }
  return `${lines.join('\n')}\n`;
}
