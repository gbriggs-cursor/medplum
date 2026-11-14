#!/usr/bin/env node
// Key-free L14 run. Replays the checked-in model turn, then executes refresh-evidence.

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { callAgentTool, labelEvidenceDir, replayModelTurn, resolveDemoMode, runAgentLive } from '../../_shared/scripts/key-free.mjs';

const storyDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(storyDir, '..', '..');
const command = 'node demos/batch-evidence/src/demo.mjs';
const runner = join(storyDir, 'runner');
const message = 'Refresh the synthetic device-change evidence batch.';
const evidenceDir = join(storyDir, 'evidence');

const mode = resolveDemoMode(process.env, { missingKey: 'CURSOR_API_KEY', keyFreeMode: 'replay', command });
if (mode.blocked) {
  console.log(mode.blocked);
  process.exit(3);
}

if (mode.live) {
  process.exit(runAgentLive({ dir: runner, message, stateRoot: '/tmp/batch-evidence-live' }));
}

console.log('REPLAY (no key)');
replayModelTurn(join(storyDir, 'fixtures/replay/turn.ndjson'));
const reset = spawnSync('bash', [join(storyDir, 'reset.sh')], { cwd: repoRoot, stdio: 'inherit' });
if (reset.status !== 0) {
  process.exit(reset.status ?? 1);
}
callAgentTool({
  dir: runner,
  name: 'refresh-evidence',
  input: {},
  stateRoot: '/tmp/batch-evidence-replay',
});
labelEvidenceDir(evidenceDir, 'REPLAY (no key)');
const first = readFileSync(join(evidenceDir, 'EVIDENCE.md'), 'utf8').split('\n')[0];
const trace = JSON.parse(readFileSync(join(evidenceDir, 'trace.json'), 'utf8'));
const failed = trace.rows.filter((row) => row.result === 'fail').length;
console.log(`REPLAY (no key) evidence=${first} trace.mode=${trace.mode} passed=${trace.runs[0].passed} failed=${failed}`);
if (first !== 'REPLAY (no key)' || trace.mode !== 'REPLAY (no key)' || failed !== 0) {
  process.exit(1);
}
