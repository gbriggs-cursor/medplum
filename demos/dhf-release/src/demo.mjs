#!/usr/bin/env node
// Key-free L7 run. Replays the checked-in model turn, then executes assemble-dhf.

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { callAgentTool, labelEvidenceDir, replayModelTurn, resolveDemoMode, runAgentLive } from '../../_shared/scripts/key-free.mjs';

const storyDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(storyDir, '..', '..');
const command = 'node demos/dhf-release/src/demo.mjs';
const runner = join(storyDir, 'runner');
const message = 'Build the design history index for the synthetic release records.';
const evidenceDir = join(storyDir, 'evidence');

const mode = resolveDemoMode(process.env, { missingKey: 'CURSOR_API_KEY', keyFreeMode: 'replay', command });
if (mode.blocked) {
  console.log(mode.blocked);
  process.exit(3);
}

if (mode.live) {
  process.exit(runAgentLive({ dir: runner, message, stateRoot: '/tmp/dhf-release-live' }));
}

console.log('REPLAY (no key)');
replayModelTurn(join(storyDir, 'fixtures/replay/turn.ndjson'));
const reset = spawnSync('bash', [join(storyDir, 'reset.sh')], { cwd: repoRoot, stdio: 'inherit' });
if (reset.status !== 0) {
  process.exit(reset.status ?? 1);
}
callAgentTool({
  dir: runner,
  name: 'assemble-dhf',
  input: {},
  stateRoot: '/tmp/dhf-release-replay',
});
labelEvidenceDir(evidenceDir, 'REPLAY (no key)');
const evidence = readFileSync(join(evidenceDir, 'EVIDENCE.md'), 'utf8').split('\n')[0];
const index = readFileSync(join(evidenceDir, 'DHF-INDEX.md'), 'utf8').split('\n')[0];
const trace = JSON.parse(readFileSync(join(evidenceDir, 'trace.json'), 'utf8'));
const failed = trace.rows.filter((row) => row.result === 'fail').length;
console.log(
  `REPLAY (no key) evidence=${evidence} index=${index} trace.mode=${trace.mode} passed=${trace.runs[0].passed} failed=${failed}`
);
if (evidence !== 'REPLAY (no key)' || index !== 'REPLAY (no key)' || trace.mode !== 'REPLAY (no key)' || failed !== 0) {
  process.exit(1);
}
