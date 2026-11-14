#!/usr/bin/env node
// Key-free path for G8. Replays the recorded fix in a temp copy and writes an OFFLINE ticket.
//   node demos/phi-safe-dev/run.mjs

import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { redact } from '../_shared/phi/redact.mjs';
import { resolveDemoMode } from '../_shared/scripts/demo-mode.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..');
const command = 'node demos/phi-safe-dev/run.mjs';
const mode = resolveDemoMode(['CURSOR_API_KEY'], command);

if (mode === 'live') {
  console.log('LIVE: prompt.md is unchanged. A cloud agent runs it. This command does not call the Cursor API.');
  process.exit(0);
}

console.log('REPLAY (no key)');
const turns = readFileSync(join(here, 'fixtures', 'replay', 'turns.md'), 'utf8');
if (!turns.startsWith('REPLAY (no key)')) {
  console.error('replay fixture is missing its label');
  process.exit(1);
}
console.log(turns.trim().split('\n').slice(0, 6).join('\n'));

const work = mkdtempSync(join(tmpdir(), 'phi-safe-dev-'));
try {
  cpSync(join(here, 'app'), work, { recursive: true });
  cpSync(join(here, 'fixtures', 'replay', 'month-end.test.mjs'), join(work, 'month-end.test.mjs'));
  const before = spawnSync(process.execPath, ['--test', join(work, 'month-end.test.mjs')], { encoding: 'utf8' });
  if (before.status === 0) {
    console.error('OFFLINE: the planted bug did not fail the replayed test');
    process.exit(1);
  }
  if (!before.stdout.includes("actual: '2027-03-03'") && !before.stderr.includes("actual: '2027-03-03'")) {
    console.error(before.stdout);
    console.error(before.stderr);
    console.error('OFFLINE: expected the replayed test to show 2027-03-03');
    process.exit(1);
  }
  console.log('OFFLINE: replayed test failed before the fix (due date rolled to 2027-03-03)');

  cpSync(join(here, 'fixtures', 'replay', 'recall.fixed.mjs'), join(work, 'recall.mjs'));
  const after = spawnSync(process.execPath, ['--test'], { cwd: work, encoding: 'utf8' });
  if (after.status !== 0) {
    console.error(after.stdout);
    console.error(after.stderr);
    process.exit(1);
  }
  console.log('OFFLINE: replayed fix passed the temp copy. Story source was not changed.');

  const checker = spawnSync(
    process.execPath,
    [join(here, 'check-no-phi.mjs'), join(work, 'recall.mjs'), join(work, 'month-end.test.mjs')],
    {
      encoding: 'utf8',
    }
  );
  if (checker.status !== 0) {
    console.error(checker.stdout);
    console.error(checker.stderr);
    process.exit(1);
  }
  console.log(checker.stdout.trim());
} finally {
  rmSync(work, { recursive: true, force: true });
}

const known = JSON.parse(readFileSync(join(here, 'seed', 'identifiers.json'), 'utf8')).identifiers;
const redacted = redact(readFileSync(join(here, 'seed', 'ticket.md'), 'utf8'), { known });
const ticket = {
  label: 'OFFLINE',
  mode: 'OFFLINE',
  project: 'GIO',
  action: 'dry-run',
  summary: 'Hygiene recall drops end-of-month visits',
  description: redacted.text,
  redaction: redacted.counts,
};
const outDir = join(here, 'run');
mkdirSync(outDir, { recursive: true });
const ticketPath = join(outDir, 'jira.json');
writeFileSync(ticketPath, JSON.stringify(ticket, null, 2) + '\n');
const screen = spawnSync(process.execPath, [join(here, 'check-no-phi.mjs'), ticketPath], { encoding: 'utf8' });
if (screen.status !== 0) {
  console.error(screen.stdout);
  console.error(screen.stderr);
  process.exit(1);
}
console.log(`OFFLINE: dry-run ticket ${ticketPath}`);
console.log(screen.stdout.trim());
