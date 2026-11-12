#!/usr/bin/env node
// Key-free path for G11. Replays the recorded guide and checks every anchor against the source.
//   node demos/integration-docs/run.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDemoMode } from '../_shared/scripts/demo-mode.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..');
const command = 'node demos/integration-docs/run.mjs';
const mode = resolveDemoMode(['CURSOR_API_KEY'], command);

if (mode === 'live') {
  console.log(
    'LIVE: prompt.md is unchanged. A cloud agent writes the guide. This command does not call the Cursor API.'
  );
  process.exit(0);
}

const guide = readFileSync(join(here, 'fixtures', 'replay', 'guide.md'), 'utf8');
if (!guide.startsWith('REPLAY (no key)')) {
  console.error('replayed guide is missing its label');
  process.exit(1);
}
console.log('REPLAY (no key)');
console.log('REPLAY (no key): recorded guide demos/integration-docs/fixtures/replay/guide.md');

const anchors = readFileSync(join(here, 'anchors.txt'), 'utf8').split('\n');
let checked = 0;
for (const line of anchors) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    continue;
  }
  const [question, path, text] = trimmed.split(/\s+/);
  const abs = join(repo, path);
  let body;
  try {
    body = readFileSync(abs, 'utf8');
  } catch {
    console.error(`OFFLINE: missing anchor ${path}`);
    process.exit(1);
  }
  if (text && !body.includes(text)) {
    console.error(`OFFLINE: ${path} no longer contains ${text}`);
    process.exit(1);
  }
  if (!guide.includes(path)) {
    console.error(`REPLAY (no key): guide does not cite ${path}`);
    process.exit(1);
  }
  console.log(`OFFLINE: Q${question} ${path}${text ? ` (${text})` : ''}`);
  checked += 1;
}
if (checked !== 7) {
  console.error(`expected 7 anchors, checked ${checked}`);
  process.exit(1);
}
console.log('OFFLINE: no Jira ticket. This story does not write to Jira.');
