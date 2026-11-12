#!/usr/bin/env node
// Offline eval: scores the deterministic triage + redaction + GIO payload against evals/cases.json.
// No network, no API key. The model-backed eval lives in agents/triage/evals.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GIO_LABELS } from '../lib/jira.mjs';
import { prepare } from '../lib/pipeline.mjs';

const storyDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const { cases } = JSON.parse(readFileSync(join(storyDir, 'evals', 'cases.json'), 'utf8'));
const json = process.argv.includes('--json');

const results = cases.map((c) => {
  const failures = [];
  let t = { category: 'error' };
  let payload;
  try {
    ({ decision: t, payload } = prepare(c, { intakeId: `INTAKE-eval-${c.id}` }));
  } catch (e) {
    failures.push(`pipeline failed: ${e.message}`);
  }
  if (t.category !== c.expect.category) {
    failures.push(`category ${t.category}, expected ${c.expect.category} (${t.reason})`);
  }
  if (c.expect.article && t.article !== c.expect.article) {
    failures.push(`article ${t.article ?? 'none'}, expected ${c.expect.article}`);
  }
  if (payload) {
    const text = `${payload.fields.summary}\n${payload.fields.description}`;
    for (const s of [c.caller_name, c.dob, c.callback, ...(c.expect.must_not_contain ?? [])].filter(Boolean)) {
      if (text.includes(s)) {
        failures.push(`ticket contains identifier "${s}"`);
      }
    }
    if (JSON.stringify(payload.fields.labels) !== JSON.stringify(GIO_LABELS)) {
      failures.push(`labels ${payload.fields.labels.join(',')}`);
    }
  }
  return {
    id: c.id,
    expected: c.expect.category,
    got: t.category,
    article: t.article,
    pass: failures.length === 0,
    failures,
  };
});

const passed = results.filter((r) => r.pass).length;
if (json) {
  console.log(JSON.stringify({ passed, total: results.length, results }, null, 2));
} else {
  for (const r of results) {
    console.log(
      `${r.pass ? 'pass' : 'FAIL'}  ${r.id.padEnd(24)} ${r.got.padEnd(16)}${r.article ?? ''}${r.pass ? '' : '\n      ' + r.failures.join('\n      ')}`
    );
  }
  console.log(`${passed === results.length ? 'PASS' : 'FAIL'}: ${passed}/${results.length} cases`);
}
process.exit(passed === results.length ? 0 : 1);
