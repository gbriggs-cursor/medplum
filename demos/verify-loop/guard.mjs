#!/usr/bin/env node
// Copies the remediation agent's changes from its workspace back into packages/core,
// accepting only non-test source files under src/. Any other change fails the run.
//
//   node demos/verify-loop/guard.mjs --workspace <ws>/packages/core --repo <repo>/packages/core --out guard.json

import { copyFileSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const arg = (name) => process.argv[process.argv.indexOf(`--${name}`) + 1];
const ws = arg('workspace');
const repo = arg('repo');
const out = arg('out');
const SKIP = new Set(['node_modules', 'dist', 'coverage', '.vite']);
const TEST = /(\.test\.[cm]?[jt]sx?$|\.snap$|test\.setup\.|vitest\.config|vite\.config|__snapshots__)/;

const walk = (dir, base = dir, acc = new Set()) => {
  if (!existsSync(dir)) {
    return acc;
  }
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) {
      continue;
    }
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p, base, acc);
    } else {
      acc.add(relative(base, p));
    }
  }
  return acc;
};

const wsFiles = walk(ws);
const repoFiles = walk(repo);
const changed = [];
for (const f of new Set([...wsFiles, ...repoFiles])) {
  const a = wsFiles.has(f) ? readFileSync(join(ws, f)) : undefined;
  const b = repoFiles.has(f) ? readFileSync(join(repo, f)) : undefined;
  if (!a || !b || !a.equals(b)) {
    changed.push({ file: `packages/core/${f}`, kind: !b ? 'added' : !a ? 'deleted' : 'modified' });
  }
}

const rejected = changed.filter(
  (c) => TEST.test(c.file) || !c.file.startsWith('packages/core/src/') || c.kind !== 'modified'
);
const result = { accepted: rejected.length === 0, changed, rejected };
writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);

if (changed.length === 0) {
  console.error('guard: the remediation changed nothing');
  process.exit(1);
}
if (rejected.length) {
  console.error('guard: REJECTED. Only existing non-test source under packages/core/src/ may change:');
  for (const r of rejected) {
    console.error(`  ${r.kind} ${r.file}`);
  }
  process.exit(1);
}
for (const c of changed) {
  copyFileSync(join(ws, c.file.slice('packages/core/'.length)), join(repo, c.file.slice('packages/core/'.length)));
  console.log(`guard: accepted ${c.kind} ${c.file}`);
}
