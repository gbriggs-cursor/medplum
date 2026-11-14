import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const script = new URL('../scripts/offline.mjs', import.meta.url).pathname;
const cleared = Object.fromEntries(
  ['XAI_API_KEY', 'CURSOR_API_KEY', 'JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_KEY', 'DEMO_MODE'].map((key) => [key, ''])
);

function run(extra = {}) {
  let stdout = '';
  let status = 0;
  try {
    stdout = execFileSync(process.execPath, [script], {
      encoding: 'utf8',
      env: { ...process.env, ...cleared, ...extra },
    });
  } catch (error) {
    status = error.status ?? 1;
    stdout = `${error.stdout ?? ''}${error.stderr ?? ''}`;
  }
  return { status, stdout };
}

test('key-free run replays the call and writes an OFFLINE ticket with no identity', () => {
  const { status, stdout } = run();
  assert.equal(status, 0, stdout);
  assert.match(stdout, /REPLAY \(no key\)/);
  assert.match(stdout, /^OFFLINE$/m);
  assert.match(stdout, /identity in ticket: none/);
  const file = stdout.match(/OFFLINE: GIO ticket (demos\/support-voice\/\S+)/)[1];
  const ticket = JSON.parse(readFileSync(new URL(`../../../${file}`, import.meta.url), 'utf8'));
  assert.equal(ticket.mode, 'OFFLINE');
  assert.equal(ticket.fields.project.key, 'GIO');
  const text = JSON.stringify(ticket);
  for (const secret of ['Dana', 'Whitfield', '1958-07-02', '555-0100']) {
    assert.equal(text.includes(secret), false, secret);
  }
});

test('DEMO_MODE=replay stays key-free when placeholder keys are set', () => {
  const { status, stdout } = run({
    DEMO_MODE: 'replay',
    XAI_API_KEY: 'present',
    CURSOR_API_KEY: 'present',
    JIRA_BASE_URL: 'https://example.test',
    JIRA_EMAIL: 'a@example.test',
    JIRA_API_KEY: 'present',
  });
  assert.equal(status, 0, stdout);
  assert.match(stdout, /REPLAY \(no key\)/);
  assert.match(stdout, /^OFFLINE$/m);
});

test('DEMO_MODE=live with no keys prints BLOCKED and exits 3', () => {
  const { status, stdout } = run({ DEMO_MODE: 'live' });
  assert.equal(status, 3, stdout);
  assert.match(stdout, /BLOCKED: live mode needs XAI_API_KEY, CURSOR_API_KEY, JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_KEY/);
  assert.match(stdout, /node demos\/support-voice\/scripts\/offline\.mjs/);
});
