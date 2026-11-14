#!/usr/bin/env node
// Key-free path for L4. Bugbot is not enabled on this repository, so:
//   1. OFFLINE: the regulatory seed cross-reference check runs for real.
//   2. OFFLINE: a local evaluator applies the IEC 62304 rules from .cursor/BUGBOT.md to each
//      fixture round, using the real seed (software-items.md, requirements.md, hazards.md).
//   3. REPLAY (no key): the checked-in Bugbot-style review for each round is printed, and the
//      evaluator's findings must match the findings that review claims.
//
//   node demos/bugbot-62304/offline.mjs     (DEMO_MODE=live exits 3: live needs Bugbot enabled)

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const seedDir = join(repoRoot, 'demos/_shared/regulatory');
const replayDir = join(here, 'fixtures/replay');

if (process.env.DEMO_MODE === 'live') {
  console.error(
    'BLOCKED: live mode needs Bugbot enabled on gbriggs-cursor/medplum (a repository setting; no env key enables it). ' +
      'Unset DEMO_MODE (or set DEMO_MODE=replay) to run REPLAY (no key) mode: node demos/bugbot-62304/offline.mjs'
  );
  process.exit(3);
}

console.log('== MODE: REPLAY (no key) for the Bugbot review, OFFLINE for the seed check and rule evaluation');

console.log('== 1. OFFLINE: regulatory seed cross-reference check');
const check = spawnSync('node', [join(seedDir, 'check.mjs')], { encoding: 'utf8' });
console.log(check.stdout.trim().split('\n').pop());
if (check.status !== 0) {
  process.stdout.write(check.stdout + check.stderr);
  process.exit(1);
}

const tableRows = (file) =>
  readFileSync(join(seedDir, file), 'utf8')
    .split('\n')
    .filter((l) => /^\| (SI|REQ|RISK)-\d+/.test(l))
    .map((l) => l.split('|').map((c) => c.trim()));
const globToRegex = (g) =>
  new RegExp(
    `^${g
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*\//g, '(?:.*/)?')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')}$`
  );
const items = tableRows('software-items.md')
  .filter((r) => ['A', 'B', 'C'].includes(r[3]))
  .map((r) => ({
    id: r[1].split(' ')[0],
    cls: r[3],
    patterns: [...r[2].matchAll(/`([^`]+)`/g)].map((m) => globToRegex(m[1])),
  }));
const knownIds = new Set([...tableRows('requirements.md'), ...tableRows('hazards.md')].map((r) => r[1]));
const RANK = { A: 0, B: 1, C: 2 };
const DOC =
  /(\.mdx?$|^packages\/docs\/|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|npm-shrinkwrap\.json|bun\.lockb?)$|(^|\/)(dist|build|coverage|\.next|storybook-static)\/)/;
const SOUP_MANIFEST = /^(packages\/react|packages\/core|examples\/foomedical)\/package\.json$|^demos\/.*package\.json$/;

function classOf(path) {
  if (DOC.test(path)) {
    return 'A';
  }
  return items
    .filter((i) => i.patterns.some((p) => p.test(path)))
    .reduce((best, i) => (RANK[i.cls] > RANK[best] ? i.cls : best), 'A');
}

function evaluate(round) {
  const findings = [];
  const classes = round.files.map((f) => ({ path: f.path, cls: classOf(f.path) }));
  const prClass = classes.reduce((best, f) => (RANK[f.cls] > RANK[best] ? f.cls : best), 'A');
  const level = prClass === 'C' ? 'high' : 'medium';
  const trace = round.evidence.split('\n').find((l) => l.startsWith('Trace:'));
  if (prClass !== 'A') {
    if (!trace) {
      const subject = classes
        .filter((f) => f.cls === prClass)
        .map((f) => f.path)
        .join(', ');
      findings.push({ level, rule: 'trace-missing', subject });
    } else {
      const ids = [...trace.matchAll(/\b(REQ|RISK)-\d{3}\b/g)].map((m) => m[0]);
      for (const kind of ['REQ', 'RISK']) {
        if (!ids.some((id) => id.startsWith(`${kind}-`))) {
          findings.push({ level, rule: 'trace-incomplete', subject: kind });
        }
      }
      for (const id of ids.filter((x) => !knownIds.has(x))) {
        findings.push({ level, rule: 'trace-unknown-id', subject: id });
      }
    }
  }
  for (const d of round.dependencyChanges) {
    if (SOUP_MANIFEST.test(d.manifest) && !round.soupDiff.includes(d.package)) {
      findings.push({ level: 'high', rule: 'soup-missing', subject: d.package });
    }
  }
  return { prClass, findings };
}

const fixture = JSON.parse(readFileSync(join(replayDir, 'rounds.json'), 'utf8'));
console.log(`== 2. OFFLINE rule evaluation vs ${fixture.label} review fixtures`);
console.log(`   Fixture source: ${fixture.source}`);
let mismatches = 0;
for (const round of fixture.rounds) {
  const { prClass, findings } = evaluate(round);
  const same = JSON.stringify(findings) === JSON.stringify(round.expected);
  mismatches += same ? 0 : 1;
  console.log(`\n-- Round ${round.id}: ${round.step}`);
  console.log(`   OFFLINE evaluator: PR class ${prClass}; ${findings.length} finding(s)`);
  for (const f of findings) {
    console.log(`     ${f.level} ${f.rule}: ${f.subject}`);
  }
  console.log(`   ${same ? 'MATCH' : 'MISMATCH'} with the REPLAY (no key) review`);
  if (!same) {
    console.log(`     replay expects: ${JSON.stringify(round.expected)}`);
  }
  console.log(
    readFileSync(join(replayDir, round.review), 'utf8')
      .trimEnd()
      .split('\n')
      .map((l) => `   | ${l}`)
      .join('\n')
  );
}

const total = fixture.rounds.length;
console.log(
  `\n${mismatches ? 'FAIL' : 'PASS'}: REPLAY (no key) L4 Bugbot story. Seed check passed; ${total - mismatches} of ${total} rounds match the replayed review.`
);
process.exit(mismatches ? 1 : 0);
