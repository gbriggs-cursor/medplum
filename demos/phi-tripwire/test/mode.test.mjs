import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { loadPack } from '../lib/tripwire.mjs';

const script = new URL('../scripts/tripwire.mjs', import.meta.url).pathname;
const cleared = Object.fromEntries(
  ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_KEY', 'DEMO_MODE', 'XAI_API_KEY', 'CURSOR_API_KEY'].map((key) => [key, ''])
);

function run(args, extra = {}) {
  let status = 0;
  let output = '';
  try {
    output = execFileSync(process.execPath, [script, ...args], {
      encoding: 'utf8',
      env: { ...process.env, ...cleared, ...extra },
    });
  } catch (error) {
    status = error.status ?? 1;
    output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
  }
  return { status, output };
}

test('key-free run writes an OFFLINE ticket and keeps the planted identifiers out', () => {
  const { status, output } = run(['--note', 'P3-N-001']);
  assert.equal(status, 0, output);
  assert.match(output, /^OFFLINE \(no key\)$/m);
  const note = loadPack().notes.find((n) => n.id === 'P3-N-001');
  const raw = readFileSync(new URL('../run/outbox/P3-N-001.json', import.meta.url), 'utf8');
  assert.equal(raw.split('\n')[0], 'OFFLINE (no key)');
  const ticket = JSON.parse(raw.slice(raw.indexOf('\n') + 1));
  assert.equal(ticket.mode, 'OFFLINE (no key)');
  assert.equal(ticket.fields.project.key, 'GIO');
  const text = JSON.stringify(ticket);
  for (const span of note.spans) {
    assert.equal(text.includes(span.value), false, span.value);
  }
});

test('DEMO_MODE=offline stays a labeled dry-run when Jira keys are set', () => {
  const { status, output } = run(['--note', 'P3-N-001'], {
    DEMO_MODE: 'offline',
    JIRA_BASE_URL: 'https://example.test',
    JIRA_EMAIL: 'a@example.test',
    JIRA_API_KEY: 'present',
  });
  assert.equal(status, 0, output);
  assert.match(output, /^OFFLINE$/m);
  const ticket = JSON.parse(readFileSync(new URL('../run/outbox/P3-N-001.json', import.meta.url), 'utf8'));
  assert.equal(ticket.mode, 'OFFLINE');
});

test('DEMO_MODE=live with no Jira keys prints BLOCKED and exits 3', () => {
  const { status, output } = run(['--note', 'P3-N-001'], { DEMO_MODE: 'live' });
  assert.equal(status, 3, output);
  assert.match(output, /BLOCKED: live mode needs JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_KEY/);
  assert.match(output, /OFFLINE mode: node demos\/phi-tripwire\/scripts\/tripwire\.mjs --note P3-N-001/);
});
