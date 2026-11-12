#!/usr/bin/env node
// Fails if any synthetic identifier from seed/ticket.md appears in a change.
//
//   git diff origin/HEAD...HEAD | node demos/phi-safe-dev/check-no-phi.mjs
//   node demos/phi-safe-dev/check-no-phi.mjs pr-body.md commit-msg.txt
//
// Unified diffs are checked on added lines only, skipping this story's seed/ folder (which holds the raw
// ticket on purpose). Any other input is checked line by line.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const { identifiers } = JSON.parse(readFileSync(join(here, 'seed', 'identifiers.json'), 'utf8'));
const needles = identifiers.map((s) => s.toLowerCase());

const inputs = process.argv.slice(2).length
  ? process.argv.slice(2).map((f) => ({ name: f, text: readFileSync(f, 'utf8') }))
  : [{ name: 'stdin', text: readFileSync(0, 'utf8') }];

const hits = [];
for (const { name, text } of inputs) {
  const isDiff = /^diff --git /m.test(text);
  let file = name;
  text.split('\n').forEach((line, i) => {
    if (isDiff) {
      if (line.startsWith('+++ ')) {
        file = line.replace(/^\+\+\+ (b\/)?/, '');
        return;
      }
      if (!line.startsWith('+') || file.startsWith('demos/phi-safe-dev/seed/')) {
        return;
      }
    }
    const lower = line.toLowerCase();
    for (const [j, needle] of needles.entries()) {
      if (lower.includes(needle)) {
        hits.push(`${file}${isDiff ? '' : `:${i + 1}`}: contains "${identifiers[j]}"`);
      }
    }
  });
}

if (hits.length) {
  console.error(`FAIL: ${hits.length} identifier(s) from the raw ticket leaked into the change`);
  for (const h of hits) {
    console.error(`  - ${h}`);
  }
  process.exit(1);
}
console.log(`PASS: none of ${identifiers.length} ticket identifiers found in ${inputs.map((i) => i.name).join(', ')}`);
