#!/usr/bin/env node
// Key-free L15 run. The checked-in model turn is replayed. The MCP probe and
// the pairing Task hit the local server.

import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MedplumClient } from '@medplum/core';
import { handler } from '../bot/pairing-task.ts';
import { replayModelTurn, resolveDemoMode } from '../../_shared/scripts/key-free.mjs';

const storyDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(storyDir, '..', '..');
const command = 'node demos/mcp-bot/scripts/offline.mjs';
const base = (process.env.MEDPLUM_BASE_URL ?? 'http://127.0.0.1:8103').replace(/\/$/, '');
const email = 'admin@example.com';
const password = 'medplum_admin';

const mode = resolveDemoMode(process.env, { missingKey: 'CURSOR_API_KEY', keyFreeMode: 'offline', command });
if (mode.blocked) {
  console.log(mode.blocked);
  process.exit(3);
}

if (!mode.live) {
  console.log('REPLAY (no key)');
  replayModelTurn(join(storyDir, 'fixtures/replay/turn.ndjson'));
  console.log('OFFLINE');
}

const probe = spawnSync(process.execPath, [join(storyDir, 'scripts/probe-mcp.mjs')], {
  cwd: repoRoot,
  stdio: 'inherit',
});
if (probe.status !== 0) {
  process.exit(probe.status ?? 1);
}

const token = await login();
const medplum = new MedplumClient({ baseUrl: `${base}/` });
medplum.setAccessToken(token);
const seed = JSON.parse(readFileSync(join(storyDir, 'seed/pairing-observation.json'), 'utf8'));
const observation = await medplum.createResource(seed);
const task = await handler(medplum, {
  bot: { reference: 'Bot/pairing-task' },
  contentType: 'application/fhir+json',
  secrets: {},
  input: observation,
});
const line = `task=${task.resourceType}/${task.id} status=${task.status} focus=${task.focus?.reference}`;
console.log(mode.live ? line : `OFFLINE ${line}`);

function base64url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

async function login() {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  const started = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      scope: 'openid',
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
    }),
  });
  const startedBody = await started.json();
  if (!started.ok || !startedBody.code) {
    const issue = startedBody.issue?.[0]?.details?.text ?? 'no code';
    throw new Error(`auth/login ${started.status} ${issue}`);
  }
  const tokenResponse = await fetch(`${base}/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: startedBody.code,
      code_verifier: verifier,
      client_id: '',
      redirect_uri: '',
    }),
  });
  const tokenBody = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenBody.access_token) {
    const detail = tokenBody.error_description ?? tokenBody.error ?? 'no access_token';
    throw new Error(`oauth2/token ${tokenResponse.status} ${detail}`);
  }
  return tokenBody.access_token;
}
