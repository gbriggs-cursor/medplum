#!/usr/bin/env node
// Key-free path for G10. Uses the P2 10k pack (fetched with the shared fetch.sh and verified), or the
// committed 100-patient fixture if the download or checksum fails. Re-runs the recorded SQL, checks it
// against the REPLAY answers for that dataset, and writes run/findings.json and run/EVIDENCE.md.
//   node demos/practice-analytics/run.mjs

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDemoMode } from '../_shared/scripts/demo-mode.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const packDir = join(here, '..', '_shared', 'data-packs', 'synthea-analytics');
const command = 'node demos/practice-analytics/run.mjs';
const mode = resolveDemoMode(['CURSOR_API_KEY'], command);

if (mode === 'live') {
  console.log(
    'LIVE: prompt.md is unchanged. A cloud agent runs it against the P2 pack. This command does not call the Cursor API.'
  );
  process.exit(0);
}

const analysis = JSON.parse(readFileSync(join(here, 'fixtures', 'replay', 'analysis.json'), 'utf8'));
console.log(analysis.label);

const hasDuckdb = spawnSync('python3', ['-c', 'import duckdb'], { encoding: 'utf8' }).status === 0;
const p2 = join(process.env.L13_DATA_ROOT ?? join(homedir(), '.cache', 'medplum-demos'), 'synthea-analytics-10k');

function pickDataset() {
  if (!hasDuckdb) {
    return { id: null, why: 'duckdb is not installed, so no dataset was queried' };
  }
  if (!existsSync(join(p2, 'parquet'))) {
    console.log(
      'OFFLINE: P2 is not on this machine. Running the shared fetch.sh (release data-p2-synthea-analytics-10k-v1).'
    );
    const fetched = spawnSync('bash', [join(packDir, 'fetch.sh')], { encoding: 'utf8' });
    if (fetched.status !== 0) {
      return {
        id: 'p0-100',
        path: join(packDir, 'fixture-100'),
        why: `fetch.sh failed: ${fetched.stderr.trim().split('\n').pop()}`,
      };
    }
    console.log('OFFLINE: fetch.sh downloaded P2, the pack.yaml sha256 matched, and verify.py passed.');
    return { id: 'p2-10k', path: p2, why: 'fetched by fetch.sh and verified' };
  }
  const verified = spawnSync('python3', [join(packDir, 'verify.py'), p2], { encoding: 'utf8' });
  if (verified.status !== 0) {
    return { id: 'p0-100', path: join(packDir, 'fixture-100'), why: 'verify.py failed on the cached P2 pack' };
  }
  return { id: 'p2-10k', path: p2, why: 'cached P2 pack, verify.py PASS' };
}

const picked = pickDataset();
if (picked.id === null) {
  const recorded = analysis.datasets['p2-10k'];
  console.log(`REPLAY (no key): ${picked.why}. Showing the recorded answers for ${recorded.name}. Not re-queried.`);
  for (const [k, v] of Object.entries(recorded.answers)) {
    console.log(`REPLAY (no key) ${k.toUpperCase()}: ${v}`);
  }
  process.exit(0);
}

const dataset = analysis.datasets[picked.id];
if (picked.id === 'p0-100') {
  console.log(`OFFLINE: falling back to the 100-patient fixture (${picked.why}).`);
}
console.log(`OFFLINE DATASET: ${dataset.name} (${picked.why})`);

const script = `
import json, sys, duckdb
queries = json.loads(sys.argv[1])
pack = sys.argv[2]
con = duckdb.connect()
def cell(v):
    if isinstance(v, float) or type(v).__name__ == 'Decimal':
        return round(float(v), 1)
    return int(v) if isinstance(v, int) else v
print(json.dumps({k: [[cell(c) for c in r] for r in con.sql(q.replace('PACK', pack)).fetchall()] for k, q in queries.items()}))
`;
const ran = spawnSync('python3', ['-c', script, JSON.stringify(analysis.queries), picked.path], {
  encoding: 'utf8',
  maxBuffer: 1 << 24,
});
if (ran.status !== 0) {
  console.error(ran.stderr);
  process.exit(1);
}
const got = JSON.parse(ran.stdout);
for (const [k, want] of Object.entries(dataset.rows)) {
  if (JSON.stringify(got[k]) !== JSON.stringify(want)) {
    console.error(`OFFLINE: ${k} on ${picked.id} drifted from the recorded rows: ${JSON.stringify(got[k])}`);
    process.exit(1);
  }
}
console.log(`OFFLINE: re-ran ${Object.keys(dataset.rows).length} queries on ${picked.id}. Rows match the recording.`);

const monthly = got.q1_monthly;
for (const [mon, n, mmol, naive, normalized] of monthly) {
  console.log(`OFFLINE ${picked.id} ${mon}: n=${n} mmol/mol=${mmol} naive=${naive}% normalized=${normalized}%`);
}
const [[firstMmol, mmolRows]] = got.q1_unit_change;
console.log(
  `OFFLINE ${picked.id}: HbA1c in mmol/mol from ${firstMmol} (${mmolRows} rows). Converted with NGSP = 0.09148 * IFCC + 2.152 before the 7% threshold.`
);
for (const [k, v] of Object.entries(dataset.answers)) {
  console.log(`REPLAY (no key) ${k.toUpperCase()} [${picked.id}]: ${v}`);
}

const outDir = join(here, 'run');
mkdirSync(outDir, { recursive: true });
const findings = {
  mode: 'REPLAY (no key)',
  dataset: dataset.name,
  answer: dataset.answers.q1,
  findings: [{ ...dataset.finding, sql: [analysis.queries.q1_unit_change, analysis.queries.q1_monthly] }],
};
writeFileSync(join(outDir, 'findings.json'), JSON.stringify(findings, null, 2) + '\n');
const evidence = [
  `REPLAY (no key) / OFFLINE evidence. Dataset: ${dataset.name}.`,
  '',
  `- Dataset choice: ${picked.why}.`,
  `- Control: ${analysis.control}.`,
  `- HbA1c in mmol/mol from ${firstMmol}, ${mmolRows} rows.`,
  ...monthly.map(
    ([mon, n, mmol, naive, normalized]) =>
      `- ${mon}: n=${n}, mmol/mol rows=${mmol}, naive ${naive}%, normalized ${normalized}%`
  ),
  `- Q2: ${dataset.answers.q2}`,
  `- Q3: ${dataset.answers.q3}`,
  '- Answer-key scorer (answer-keys://analytics-10k/): not run. The private keys are not on this machine.',
  '',
];
writeFileSync(join(outDir, 'EVIDENCE.md'), evidence.join('\n'));
console.log(`OFFLINE: wrote ${join(outDir, 'findings.json')} and ${join(outDir, 'EVIDENCE.md')}`);
console.log('OFFLINE: answer-key scorer not run. The private keys are not on this machine.');
console.log('OFFLINE: no Jira ticket. This story does not write to Jira.');
