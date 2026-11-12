import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { refreshBatch } from './refresh.mjs';

const storyDir = join(import.meta.dirname, '..');
const cohort = JSON.parse(readFileSync(join(storyDir, 'seed', 'cohort-index.json'), 'utf8'));
const batch = JSON.parse(readFileSync(join(storyDir, 'seed', 'changes.json'), 'utf8'));
const commit = '0123456789abcdef0123456789abcdef01234567';
const date = '2026-11-12T00:00:00.000Z';

function run(overrides = {}) {
  const outDir = mkdtempSync(join(tmpdir(), 'batch-evidence-'));
  const index = refreshBatch({ cohort, batch, commit, date, outDir, ...overrides });
  return { outDir, index };
}

test('writes one evidence v2 package for the batch and repeats byte-for-byte', () => {
  const first = run();
  const second = run();
  try {
    assert.equal(first.index.result, 'pass');
    assert.deepEqual([first.index.passed, first.index.failed], [4, 0]);
    assert.deepEqual(readdirSync(first.outDir).sort(), ['EVIDENCE.md', 'test-log.txt', 'trace.json']);
    const evidence = readFileSync(join(first.outDir, 'EVIDENCE.md'), 'utf8');
    assert.deepEqual(evidence.split('\n').slice(0, 7), [
      'Requirement: Every synthetic Acme Cardio device change in the batch is present in the P1 cohort index (seed 20261104).',
      'Change: demos/batch-evidence/seed/changes.json — synthetic device-change batch checked against seed/cohort-index.json',
      'Test: node demos/batch-evidence/src/refresh.mjs',
      'Result: pass (4 passed, 0 failed)',
      'Synthetic: true',
      `Commit: ${commit}`,
      'Trace: REQ-014-00, RISK-014-00, REQ-014-07, RISK-014-07, REQ-014-13, RISK-014-13, REQ-014-19, RISK-014-19',
    ]);
    assert.equal(evidence.includes('Approval:'), false);
    const log = readFileSync(join(first.outDir, 'test-log.txt'), 'utf8');
    assert.equal(evidence.split('```\n')[1].split('```')[0], log);
    const trace = JSON.parse(readFileSync(join(first.outDir, 'trace.json'), 'utf8'));
    assert.equal(trace.schema, 'evidence-v2/trace');
    assert.equal(trace.version, 2);
    assert.equal(trace.story, 'batch-evidence');
    assert.equal(trace.synthetic, true);
    assert.equal(trace.commit, commit);
    assert.equal(trace.runs.length, 1);
    assert.equal(trace.runs[0].id, 'run-1');
    assert.equal(trace.runs[0].date, date);
    assert.equal(trace.rows.length, 4);
    assert.deepEqual(Object.keys(trace.rows[0]), ['req', 'risk', 'test', 'run', 'result', 'commit']);
    assert.equal(trace.rows[0].result, 'pass');
    for (const name of readdirSync(first.outDir)) {
      assert.equal(readFileSync(join(first.outDir, name), 'utf8'), readFileSync(join(second.outDir, name), 'utf8'));
    }
  } finally {
    rmSync(first.outDir, { recursive: true, force: true });
    rmSync(second.outDir, { recursive: true, force: true });
  }
});

test('a device id missing from the cohort fails that row and the run', () => {
  const broken = structuredClone(batch);
  broken.changes[0] = { ...broken.changes[0], device: 'acme-device-99' };
  const { outDir, index } = run({ batch: broken });
  try {
    assert.equal(index.result, 'fail');
    assert.deepEqual([index.passed, index.failed], [3, 1]);
    const trace = JSON.parse(readFileSync(join(outDir, 'trace.json'), 'utf8'));
    assert.equal(trace.runs[0].exit, 1);
    assert.equal(trace.rows[0].result, 'fail');
    assert.match(trace.rows[0].test, /Device\/acme-device-99 missing/);
    assert.equal(readdirSync(outDir).includes('approval.json'), false);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test('refuses a cohort that is not marked synthetic and writes nothing', () => {
  const outDir = mkdtempSync(join(tmpdir(), 'batch-evidence-'));
  try {
    assert.throws(
      () => refreshBatch({ cohort: { ...cohort, synthetic: false }, batch, commit, date, outDir }),
      /not synthetic/
    );
    assert.deepEqual(readdirSync(outDir), []);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
