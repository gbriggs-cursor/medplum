#!/usr/bin/env node
// End-to-end check over HTTP: draft -> read-back -> confirm -> redact -> triage -> GIO ticket (dry-run).
//   node scripts/verify.mjs --kb-gap | --bug | --answered | --urgent   (default --kb-gap)

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const storyDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const { cases } = JSON.parse(readFileSync(join(storyDir, 'evals', 'cases.json'), 'utf8'));
const FLOWS = {
  '--kb-gap': 'gap-airport',
  '--bug': 'bug-appointments-blank',
  '--answered': 'phi-in-description',
  '--urgent': 'urgent-chest-pain',
};
const flag = Object.keys(FLOWS).find((f) => process.argv.includes(f)) ?? '--kb-gap';
const c = cases.find((x) => x.id === FLOWS[flag]);
const port = 8800 + Math.floor(Math.random() * 100);

const server = spawn(process.execPath, [join(storyDir, 'server.mjs'), '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((resolve) => server.stdout.once('data', resolve));
const base = `http://127.0.0.1:${port}`;
const post = async (path, body) => {
  const res = await fetch(base + path, { method: 'POST', body: JSON.stringify(body) });
  return { status: res.status, json: await res.json() };
};

const checks = [];
const check = (name, ok, detail = '') => checks.push({ name, ok, detail });
try {
  const draft = await post('/api/intake/draft', { ...c, channel: 'voice' });
  check('draft read back', draft.status === 200 && draft.json.readback.includes(c.caller_name));
  const forged = await post('/api/intake/confirm', { id: draft.json.id, confirmToken: 'forged', confirmed: true });
  check('forged confirm refused', forged.status === 409, `HTTP ${forged.status}`);
  const done = await post('/api/intake/confirm', {
    id: draft.json.id,
    confirmToken: draft.json.confirmToken,
    confirmed: true,
  });
  check('confirmed and submitted', done.status === 200 && done.json.state === 'submitted', `HTTP ${done.status}`);
  check(`triage = ${c.expect.category}`, done.json.category === c.expect.category, done.json.category);
  const ticket = JSON.parse(readFileSync(join(storyDir, done.json.ticket.file), 'utf8'));
  const text = JSON.stringify(ticket);
  const leaks = [
    c.caller_name,
    ...c.caller_name.split(' '),
    c.dob,
    c.callback,
    ...(c.expect.must_not_contain ?? []),
  ].filter((s) => s && text.includes(s));
  check('ticket has no caller identity', leaks.length === 0, leaks.join(', '));
  check(
    'ticket is GIO with support labels, never automatable',
    ticket.fields.project.key === 'GIO' &&
      ticket.fields.labels.includes('support') &&
      !ticket.fields.labels.includes('automatable')
  );
  const replay = await post('/api/intake/confirm', {
    id: draft.json.id,
    confirmToken: draft.json.confirmToken,
    confirmed: true,
  });
  check('replayed confirm refused', replay.status === 409, `HTTP ${replay.status}`);
  console.log(`flow ${flag} (${c.id}) -> ${done.json.ticket.file}`);
  console.log(`summary: ${ticket.fields.summary}`);
} finally {
  server.kill();
}

for (const x of checks) {
  console.log(`${x.ok ? 'pass' : 'FAIL'}  ${x.name}${x.detail ? ` (${x.detail})` : ''}`);
}
const failed = checks.filter((x) => !x.ok).length;
console.log(failed ? `FAIL: ${failed} check(s) failed` : `PASS: ${checks.length}/${checks.length} checks`);
process.exit(failed ? 1 : 0);
