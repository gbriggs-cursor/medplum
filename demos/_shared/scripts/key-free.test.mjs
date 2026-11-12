import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blockedLiveMessage, labelEvidenceDir, resolveDemoMode } from './key-free.mjs';

test('auto without a Cursor key is key-free', () => {
  const mode = resolveDemoMode({}, { missingKey: 'CURSOR_API_KEY', keyFreeMode: 'replay', command: 'node demo.mjs' });
  assert.equal(mode.live, false);
});

test('auto with CURSOR_API_KEY is live', () => {
  const mode = resolveDemoMode(
    { CURSOR_API_KEY: 'present' },
    { missingKey: 'CURSOR_API_KEY', keyFreeMode: 'replay', command: 'node demo.mjs' }
  );
  assert.equal(mode.live, true);
});

test('DEMO_MODE=live without a key is blocked and names the key-free command', () => {
  const mode = resolveDemoMode(
    { DEMO_MODE: 'live' },
    { missingKey: 'CURSOR_API_KEY', keyFreeMode: 'offline', command: 'node demos/mcp-bot/scripts/offline.mjs' }
  );
  assert.match(mode.blocked, /^BLOCKED: live mode needs CURSOR_API_KEY\./);
  assert.match(mode.blocked, /DEMO_MODE=offline/);
  assert.match(mode.blocked, /node demos\/mcp-bot\/scripts\/offline\.mjs/);
  assert.equal(
    blockedLiveMessage({ missingKey: 'CURSOR_API_KEY', keyFreeMode: 'replay', command: 'node demos/batch-evidence/src/demo.mjs' }),
    'BLOCKED: live mode needs CURSOR_API_KEY. Unset DEMO_MODE (or set DEMO_MODE=replay) to run REPLAY (no key) mode: node demos/batch-evidence/src/demo.mjs'
  );
});

test('DEMO_MODE=replay stays key-free even when a key is present', () => {
  const mode = resolveDemoMode(
    { DEMO_MODE: 'replay', CURSOR_API_KEY: 'present' },
    { missingKey: 'CURSOR_API_KEY', keyFreeMode: 'replay', command: 'node demo.mjs' }
  );
  assert.equal(mode.live, false);
});

test('labelEvidenceDir marks the evidence files with the mode', () => {
  const dir = mkdtempSync(join(tmpdir(), 'key-free-'));
  try {
    writeFileSync(join(dir, 'EVIDENCE.md'), 'Requirement: x\n');
    writeFileSync(join(dir, 'DHF-INDEX.md'), '# index\n');
    writeFileSync(join(dir, 'trace.json'), `${JSON.stringify({ schema: 'evidence-v2/trace', version: 2 }, null, 2)}\n`);
    labelEvidenceDir(dir, 'REPLAY (no key)');
    assert.equal(readFileSync(join(dir, 'EVIDENCE.md'), 'utf8').split('\n')[0], 'REPLAY (no key)');
    assert.equal(readFileSync(join(dir, 'DHF-INDEX.md'), 'utf8').split('\n')[0], 'REPLAY (no key)');
    assert.equal(JSON.parse(readFileSync(join(dir, 'trace.json'), 'utf8')).mode, 'REPLAY (no key)');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
