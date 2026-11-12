import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

const script = new URL('../scripts/run.mjs', import.meta.url).pathname;

test('DEMO_MODE=live without XAI_API_KEY prints BLOCKED and exits 3', () => {
  let status = 0;
  let output = '';
  try {
    output = execFileSync(process.execPath, [script], {
      encoding: 'utf8',
      env: { ...process.env, DEMO_MODE: 'live', XAI_API_KEY: '' },
    });
  } catch (error) {
    status = error.status ?? 1;
    output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
  }
  assert.equal(status, 3, output);
  assert.match(output, /BLOCKED: live mode needs XAI_API_KEY/);
  assert.match(output, /REPLAY \(no key\) mode: node demos\/speech-to-fhir\/scripts\/run\.mjs/);
});
