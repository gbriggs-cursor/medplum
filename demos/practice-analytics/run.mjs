#!/usr/bin/env node
// Key-free path for G10. Uses the P2 10k pack (fetched with the shared fetch.sh and verified), or the
// committed 100-patient fixture if the download or checksum fails. Question 1 is a select from the shared
// views hba1c_control_monthly (headline) and hba1c_control_monthly_by_cohort (naive SNOMED-only).
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
  console.log('LIVE: a cloud agent runs prompt.md against the P2 pack. This command does not call the Cursor API.');
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

function formatRow(row) {
  if (!row) {
    return 'no March 2026 rows';
  }
  const [, n, controlled, pct, rawN, rawPct] = row;
  const one = (value) => Number(value).toFixed(1);
  return `${one(pct)}% (${controlled}/${n}); without conversion ${one(rawPct)}% (${rawN}/${n})`;
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
import json, sys
sys.path.insert(0, sys.argv[1])
import hba1c_control as h
pack = sys.argv[2]
queries = json.loads(sys.argv[3])
con = h.connect(pack)
h.install(con)

def cell(v):
    if hasattr(v, "isoformat"):
        return v.isoformat()[:7]
    if isinstance(v, float) or type(v).__name__ == "Decimal":
        return round(float(v), 1)
    return int(v) if isinstance(v, int) else v

def rows(sql):
    return [[cell(c) for c in r] for r in con.execute(sql).fetchall()]

march = "month = date '2026-03-01'"
cols = "strftime(month, '%Y-%m'), n, controlled_n, control_pct, controlled_raw_n, control_pct_raw"
out = {
    "headline": rows(f"select {cols} from hba1c_control_monthly where {march}"),
    "headline_by_cohort": rows(f"select {cols} from hba1c_control_monthly_by_cohort where cohort = 't2dm_value_set' and {march}"),
    "naive": rows(f"select {cols} from hba1c_control_monthly_by_cohort where cohort = 'snomed_44054006' and {march}"),
}
for key, sql in queries.items():
    out[key] = rows(sql)
print(json.dumps(out))
`;
const ran = spawnSync('python3', ['-c', script, packDir, picked.path, JSON.stringify(analysis.queries)], {
  encoding: 'utf8',
  maxBuffer: 1 << 24,
});
if (ran.status !== 0) {
  console.error(ran.stderr);
  process.exit(1);
}
const got = JSON.parse(ran.stdout);
if (JSON.stringify(got.headline) !== JSON.stringify(got.headline_by_cohort)) {
  console.error('OFFLINE: hba1c_control_monthly disagrees with the headline rows of hba1c_control_monthly_by_cohort');
  process.exit(1);
}
for (const key of ['headline', 'naive']) {
  if (JSON.stringify(got[key]) !== JSON.stringify(dataset.march[key])) {
    console.error(`OFFLINE: ${key} on ${picked.id} drifted from the recording: ${JSON.stringify(got[key])}`);
    process.exit(1);
  }
}
for (const [k, want] of Object.entries(dataset.rows)) {
  if (JSON.stringify(got[k]) !== JSON.stringify(want)) {
    console.error(`OFFLINE: ${k} on ${picked.id} drifted from the recorded rows: ${JSON.stringify(got[k])}`);
    process.exit(1);
  }
}
console.log(
  `OFFLINE: re-ran the shared views and ${Object.keys(dataset.rows).length} other queries on ${picked.id}. Rows match the recording.`
);

const headline = got.headline[0] ?? null;
const naive = got.naive[0] ?? null;
const headlineLabel = 'headline (hba1c_control_monthly, SNOMED 44054006 or ICD-10-CM E11.9)';
const naiveLabel = 'naive (hba1c_control_monthly_by_cohort, SNOMED 44054006 only)';
console.log(`OFFLINE ${picked.id} ${headlineLabel}: March 2026 ${formatRow(headline)}`);
console.log(`OFFLINE ${picked.id} ${naiveLabel}: March 2026 ${formatRow(naive)}`);
for (const [k, v] of Object.entries(dataset.answers)) {
  console.log(`REPLAY (no key) ${k.toUpperCase()} [${picked.id}]: ${v}`);
}

const outDir = join(here, 'run');
mkdirSync(outDir, { recursive: true });
const findings = {
  mode: 'REPLAY (no key)',
  dataset: dataset.name,
  answer: dataset.answers.q1,
  findings: [
    {
      title: 'March 2026 HbA1c control, headline and naive',
      summary: dataset.answers.q1,
      start_date: null,
      end_date: null,
      entities: ['44054006', 'E11.9', '4548-4'],
      sql: [
        "select * from hba1c_control_monthly where month = date '2026-03-01'",
        "select * from hba1c_control_monthly_by_cohort where cohort = 'snomed_44054006' and month = date '2026-03-01'",
      ],
    },
  ],
};
writeFileSync(join(outDir, 'findings.json'), JSON.stringify(findings, null, 2) + '\n');
const evidence = [
  `REPLAY (no key) / OFFLINE evidence. Dataset: ${dataset.name}.`,
  '',
  `- Dataset choice: ${picked.why}.`,
  '- Definition: demos/_shared/data-packs/synthea-analytics/hba1c-control.sql',
  `- ${headlineLabel}: March 2026 ${formatRow(headline)}`,
  `- ${naiveLabel}: March 2026 ${formatRow(naive)}`,
  `- Q2: ${dataset.answers.q2}`,
  `- Q3: ${dataset.answers.q3}`,
  '- Answer-key scorer (answer-keys://analytics-10k/): not run. The private keys are not on this machine.',
  '',
];
writeFileSync(join(outDir, 'EVIDENCE.md'), evidence.join('\n'));
console.log(`OFFLINE: wrote ${join(outDir, 'findings.json')} and ${join(outDir, 'EVIDENCE.md')}`);
console.log('OFFLINE: answer-key scorer not run. The private keys are not on this machine.');
console.log('OFFLINE: no Jira ticket. This story does not write to Jira.');
