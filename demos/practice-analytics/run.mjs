#!/usr/bin/env node
// Key-free path for G10. Prints the recorded fixture-100 analysis. Re-runs the SQL when duckdb is installed.
//   node demos/practice-analytics/run.mjs

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDemoMode } from '../_shared/scripts/demo-mode.mjs';

const here = dirname(fileURLToPath(import.meta.url));
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
console.log(`REPLAY (no key): ${analysis.limit}`);
for (const q of analysis.questions) {
  console.log(`Q${q.id}: ${q.answer}`);
}
console.log('OFFLINE: no Jira ticket. This story does not write to Jira.');

const check = spawnSync('python3', ['-c', 'import duckdb'], { encoding: 'utf8' });
if (check.status !== 0) {
  console.log('REPLAY (no key): duckdb is not installed, so the recorded fixture-100 results were not re-queried.');
  process.exit(0);
}

const script = `
import json, sys, duckdb
analysis = json.load(open(sys.argv[1]))
pack = sys.argv[2]
con = duckdb.connect()
def cell(v):
    if isinstance(v, float) or type(v).__name__ == 'Decimal':
        return round(float(v), 1)
    return int(v) if isinstance(v, int) else v
def rows(sql):
    sql = sql.replace("PACK", pack)
    return [[cell(c) for c in r] for r in con.sql(sql).fetchall()]
for q in analysis["questions"]:
    got = rows(q["sql"])
    if got != q["rows"]:
        raise SystemExit(f"Q{q['id']} SQL drifted: {got} != {q['rows']}")
    if "types_sql" in q and rows(q["types_sql"]) != q["types_rows"]:
        raise SystemExit(f"Q{q['id']} type SQL drifted")
print("OFFLINE: re-ran the recorded SQL on fixture-100")
`;
const ran = spawnSync(
  'python3',
  [
    '-c',
    script,
    join(here, 'fixtures', 'replay', 'analysis.json'),
    join(here, '..', '_shared', 'data-packs', 'synthea-analytics', 'fixture-100'),
  ],
  {
    encoding: 'utf8',
  }
);
if (ran.status !== 0) {
  console.error(ran.stdout);
  console.error(ran.stderr);
  process.exit(1);
}
console.log(ran.stdout.trim());
