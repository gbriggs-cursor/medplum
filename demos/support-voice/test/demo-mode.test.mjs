import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockedMessage, resolveDemoMode } from '../../_shared/demo-mode.mjs';

const command = 'node demos/support-voice/scripts/offline.mjs';
const keys = {
  XAI_API_KEY: 'x',
  CURSOR_API_KEY: 'c',
  JIRA_BASE_URL: 'https://example.test',
  JIRA_EMAIL: 'a@example.test',
  JIRA_API_KEY: 'j',
};

test('missing keys select key-free, and a full set selects live', () => {
  assert.equal(
    resolveDemoMode({ needs: ['XAI_API_KEY', 'CURSOR_API_KEY', 'JIRA'], offlineCommand: command, env: {} }).mode,
    'key-free'
  );
  assert.equal(
    resolveDemoMode({ needs: ['XAI_API_KEY', 'CURSOR_API_KEY', 'JIRA'], offlineCommand: command, env: keys }).mode,
    'live'
  );
});

test('DEMO_MODE=replay forces key-free even when the keys are set', () => {
  const result = resolveDemoMode({
    needs: ['XAI_API_KEY'],
    offlineCommand: command,
    env: { ...keys, DEMO_MODE: 'replay' },
  });
  assert.equal(result.mode, 'key-free');
});

test('DEMO_MODE=live without keys is BLOCKED and names the key-free command', () => {
  const result = resolveDemoMode({
    needs: ['XAI_API_KEY', 'CURSOR_API_KEY', 'JIRA'],
    offlineCommand: command,
    env: { DEMO_MODE: 'live' },
  });
  assert.equal(result.mode, 'blocked');
  assert.equal(
    result.message,
    blockedMessage({
      missing: ['XAI_API_KEY', 'CURSOR_API_KEY', 'JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_KEY'],
      offlineCommand: command,
    })
  );
  assert.match(result.message, /^BLOCKED: live mode needs /);
  assert.match(result.message, /REPLAY \(no key\) mode: node demos\/support-voice\/scripts\/offline\.mjs$/);
});
