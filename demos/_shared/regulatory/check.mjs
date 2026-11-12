#!/usr/bin/env node
// Checks that the synthetic regulatory seed is internally consistent, because Bugbot's
// IEC 62304 rules resolve Trace IDs against it.
//
//   node demos/_shared/regulatory/check.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const rows = (file) =>
  readFileSync(join(dir, file), 'utf8')
    .split('\n')
    .filter((l) => /^\| (SI|REQ|RISK)-\d+/.test(l))
    .map((l) => l.split('|').map((c) => c.trim()));
const ids = (text, prefix) => [...text.matchAll(new RegExp(`${prefix}-\\d{2,3}`, 'g'))].map((m) => m[0]);

const items = new Map(rows('software-items.md').map((r) => [r[1].split(' ')[0], r[3]]));
const reqs = new Map(rows('requirements.md').map((r) => [r[1], r]));
const risks = new Map(rows('hazards.md').map((r) => [r[1], r]));

const checks = [];
const check = (name, ok) => checks.push({ name, ok });

for (const [id, cls] of items) {
  check(`${id} has class A, B, or C`, ['A', 'B', 'C'].includes(cls));
}
for (const [id, r] of reqs) {
  check(`${id} has a 3-digit ID`, /^REQ-\d{3}$/.test(id));
  check(`${id} items exist`, ids(r[3], 'SI').length > 0 && ids(r[3], 'SI').every((i) => items.has(i)));
  check(`${id} risks exist`, ids(r[4], 'RISK').length > 0 && ids(r[4], 'RISK').every((i) => risks.has(i)));
}
for (const [id, r] of risks) {
  check(`${id} has a 3-digit ID`, /^RISK-\d{3}$/.test(id));
  check(`${id} controls exist`, ids(r[5], 'REQ').length > 0 && ids(r[5], 'REQ').every((i) => reqs.has(i)));
}
const soup = readFileSync(join(dir, 'SOUP.md'), 'utf8');
for (const i of ids(soup, 'SI')) {
  check(`SOUP.md item ${i} exists`, items.has(i));
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}`);
}
console.log(`${failed.length ? 'FAIL' : 'PASS'}: ${checks.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
