#!/usr/bin/env node
// Refresh one evidence v2 package for a synthetic batch of P1 device-cohort changes.
// Writes evidence/EVIDENCE.md and evidence/trace.json. Does not write approval.json.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeEvidenceV2 } from './evidence-v2.mjs';

const storyDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(storyDir, '..', '..');
const COMMAND = 'node demos/batch-evidence/src/refresh.mjs';
const ID_TYPES = ['Patient', 'Device', 'DeviceDefinition', 'Observation'];

export function refreshBatch({ cohort, batch, commit, date, outDir }) {
  if (cohort?.synthetic !== true || batch?.synthetic !== true) {
    throw new Error('Refusing to write an evidence package: input is not synthetic');
  }
  if (String(cohort.seed) !== String(batch.seed)) {
    throw new Error(`Refusing to write an evidence package: seed ${batch.seed} does not match cohort seed ${cohort.seed}`);
  }
  for (const type of ID_TYPES) {
    const ids = cohort.ids?.[type];
    if (!Array.isArray(ids) || ids.length !== cohort.counts?.[type]) {
      throw new Error(`Cohort index count mismatch for ${type}`);
    }
  }

  const rows = batch.changes.map((change) => {
    const checks = [
      ['Device', change.device],
      ['Patient', change.patient],
      ['Observation', change.bp],
      ['Observation', change.ecg],
    ];
    const missing = checks.filter(([type, id]) => !cohort.ids[type].includes(id));
    const detail = checks
      .map(([type, id]) => `${type}/${id} ${cohort.ids[type].includes(id) ? 'present' : 'missing'}`)
      .join('; ');
    return {
      req: change.req,
      risk: change.risk,
      test: `${change.id}: ${detail}`,
      run: 'run-1',
      result: missing.length === 0 ? 'pass' : 'fail',
      commit,
      missing,
    };
  });

  const failed = rows.filter((row) => row.result === 'fail').length;
  const passed = rows.length - failed;
  const exit = failed === 0 ? 0 : 1;
  const log = `${rows.map((row) => `${row.test} ${row.result}`).join('\n')}\n${passed} passed, ${failed} failed\nEXIT:${exit}\n`;
  const run = {
    id: 'run-1',
    label: 'batch refresh of synthetic device changes',
    command: COMMAND,
    date,
    tree: 'repository',
    passed,
    failed,
    exit,
  };
  const written = writeEvidenceV2(outDir, {
    story: 'batch-evidence',
    requirement: `Every synthetic ${batch.prospect} device change in the batch is present in the P1 cohort index (seed ${cohort.seed}).`,
    change: 'demos/batch-evidence/seed/changes.json — synthetic device-change batch checked against seed/cohort-index.json',
    commit,
    run,
    log,
    rows: rows.map(({ req, risk, test, run: runId, result, commit: rowCommit }) => ({
      req,
      risk,
      test,
      run: runId,
      result,
      commit: rowCommit,
    })),
  });
  return {
    synthetic: true,
    seed: cohort.seed,
    story: 'batch-evidence',
    result: written.result,
    passed,
    failed,
    commit,
    date,
    files: written.files,
  };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function argValue(name) {
  const flag = process.argv.indexOf(name);
  if (flag === -1) {
    return undefined;
  }
  return process.argv[flag + 1];
}

function isoDate(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00.000Z`;
  }
  return value;
}

function main() {
  const cohort = readJson(join(storyDir, 'seed', 'cohort-index.json'));
  const batch = readJson(join(storyDir, 'seed', 'changes.json'));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const porcelain = execFileSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  if (porcelain.trim()) {
    console.error('warning: working tree has uncommitted changes; Commit is HEAD');
  }
  const date = isoDate(argValue('--date') ?? new Date().toISOString());
  const outDir = argValue('--out') ?? join(storyDir, 'evidence');
  const index = refreshBatch({ cohort, batch, commit, date, outDir });
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(index));
  } else {
    console.log(`${index.result} (${index.passed} passed, ${index.failed} failed)`);
  }
  process.exitCode = index.failed === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
