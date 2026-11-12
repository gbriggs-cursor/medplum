#!/usr/bin/env node
// Build a design history index and evidence v2 trace from synthetic release records.
// Does not write approval.json and does not re-run the tests named in the records.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeEvidenceV2 } from './evidence-v2.mjs';

const storyDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(storyDir, '..', '..');
const COMMAND = 'node demos/dhf-release/src/assemble.mjs';
const REQUIRED = ['req', 'risk', 'title', 'test'];

export function assembleDhf({ release, commit, date, outDir }) {
  if (release?.synthetic !== true) {
    throw new Error('Refusing to write an evidence package: input is not synthetic');
  }
  const rows = release.records.map((record, index) => {
    const missing = REQUIRED.filter((key) => typeof record[key] !== 'string' || !record[key].trim());
    const label = record.req || `record ${index + 1}`;
    return {
      req: record.req || 'MISSING',
      risk: record.risk || 'MISSING',
      test: missing.length === 0 ? record.test : `${label} missing ${missing.join(', ')}`,
      run: 'run-1',
      result: missing.length === 0 ? 'pass' : 'fail',
      commit,
      title: record.title || '',
    };
  });
  const failed = rows.filter((row) => row.result === 'fail').length;
  const passed = rows.length - failed;
  const exit = failed === 0 ? 0 : 1;
  const log = `${rows.map((row) => `${row.req} ${row.result}`).join('\n')}\n${passed} passed, ${failed} failed\nEXIT:${exit}\n`;
  const run = {
    id: 'run-1',
    label: 'DHF index from synthetic release records',
    command: COMMAND,
    date,
    tree: 'repository',
    passed,
    failed,
    exit,
  };
  const written = writeEvidenceV2(outDir, {
    story: 'dhf-release',
    requirement: `The synthetic ${release.product} release records form a design history index and a trace matrix.`,
    change: 'demos/dhf-release/seed/release-records.json — synthetic release records',
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
  const index = [
    '# Design history file index',
    '',
    `Product: ${release.product}. Prospect: ${release.prospect}. Synthetic: true.`,
    'This run checks that each release record has a requirement, a risk, a title, and a test name. It does not re-execute those tests.',
    '',
    '| REQ | RISK | Title | Test | Check |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row.req} | ${row.risk} | ${row.title} | ${row.test} | ${row.result} |`),
    '',
  ].join('\n');
  writeFileSync(join(outDir, 'DHF-INDEX.md'), index);
  return {
    synthetic: true,
    story: 'dhf-release',
    result: written.result,
    passed,
    failed,
    commit,
    date,
    files: [...written.files, 'DHF-INDEX.md'],
  };
}

function argValue(name) {
  const flag = process.argv.indexOf(name);
  return flag === -1 ? undefined : process.argv[flag + 1];
}

function isoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
}

function main() {
  const release = JSON.parse(readFileSync(join(storyDir, 'seed', 'release-records.json'), 'utf8'));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const porcelain = execFileSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  if (porcelain.trim()) {
    console.error('warning: working tree has uncommitted changes; Commit is HEAD');
  }
  const date = isoDate(argValue('--date') ?? new Date().toISOString());
  const outDir = argValue('--out') ?? join(storyDir, 'evidence');
  const index = assembleDhf({ release, commit, date, outDir });
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
