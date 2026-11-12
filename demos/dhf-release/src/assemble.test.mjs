import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { assembleDhf } from './assemble.mjs';

const storyDir = join(import.meta.dirname, '..');
const release = JSON.parse(readFileSync(join(storyDir, 'seed', 'release-records.json'), 'utf8'));
const commit = '0123456789abcdef0123456789abcdef01234567';
const date = '2026-11-12T00:00:00.000Z';

function run(overrides = {}) {
  const outDir = mkdtempSync(join(tmpdir(), 'dhf-release-'));
  const index = assembleDhf({ release, commit, date, outDir, ...overrides });
  return { outDir, index };
}

test('writes a DHF index and one evidence v2 trace, and repeats byte-for-byte', () => {
  const first = run();
  const second = run();
  try {
    assert.equal(first.index.result, 'pass');
    assert.deepEqual([first.index.passed, first.index.failed], [3, 0]);
    assert.deepEqual(readdirSync(first.outDir).sort(), ['DHF-INDEX.md', 'EVIDENCE.md', 'test-log.txt', 'trace.json']);
    const evidence = readFileSync(join(first.outDir, 'EVIDENCE.md'), 'utf8');
    assert.equal(evidence.startsWith('Requirement: The synthetic Acme Cardio patch v2 release records form a design history index and a trace matrix.'), true);
    assert.equal(evidence.includes('Approval:'), false);
    assert.equal(evidence.split('```\n')[1].split('```')[0], readFileSync(join(first.outDir, 'test-log.txt'), 'utf8'));
    const trace = JSON.parse(readFileSync(join(first.outDir, 'trace.json'), 'utf8'));
    assert.equal(trace.schema, 'evidence-v2/trace');
    assert.equal(trace.version, 2);
    assert.equal(trace.story, 'dhf-release');
    assert.equal(trace.rows.length, 3);
    assert.deepEqual(Object.keys(trace.rows[0]), ['req', 'risk', 'test', 'run', 'result', 'commit']);
    assert.match(readFileSync(join(first.outDir, 'DHF-INDEX.md'), 'utf8'), /does not re-execute/);
    for (const name of readdirSync(first.outDir)) {
      assert.equal(readFileSync(join(first.outDir, name), 'utf8'), readFileSync(join(second.outDir, name), 'utf8'));
    }
  } finally {
    rmSync(first.outDir, { recursive: true, force: true });
    rmSync(second.outDir, { recursive: true, force: true });
  }
});

test('a release record missing its risk fails that row', () => {
  const broken = structuredClone(release);
  broken.records[1] = { ...broken.records[1], risk: '' };
  const { outDir, index } = run({ release: broken });
  try {
    assert.equal(index.result, 'fail');
    assert.deepEqual([index.passed, index.failed], [2, 1]);
    const trace = JSON.parse(readFileSync(join(outDir, 'trace.json'), 'utf8'));
    assert.equal(trace.rows[1].result, 'fail');
    assert.equal(trace.rows[1].risk, 'MISSING');
    assert.equal(readdirSync(outDir).includes('approval.json'), false);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test('refuses a release set that is not marked synthetic and writes nothing', () => {
  const outDir = mkdtempSync(join(tmpdir(), 'dhf-release-'));
  try {
    assert.throws(
      () => assembleDhf({ release: { ...release, synthetic: false }, commit, date, outDir }),
      /not synthetic/
    );
    assert.deepEqual(readdirSync(outDir), []);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
