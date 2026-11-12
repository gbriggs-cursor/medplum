#!/usr/bin/env node
// Probe the local Medplum MCP endpoint as the seeded demo admin.
// Prints statuses and error text. Does not print the access token.

import { createHash, randomBytes } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const base = (process.env.MEDPLUM_BASE_URL ?? 'http://127.0.0.1:8103').replace(/\/$/, '');
const email = 'admin@example.com';
const password = 'medplum_admin';

function base64url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

async function readChunk(response, ms) {
  const reader = response.body?.getReader();
  if (!reader) {
    return '';
  }
  let timer;
  try {
    const result = await Promise.race([
      reader.read(),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve({ timedOut: true }), ms);
      }),
    ]);
    if (result.timedOut) {
      return '(stream still open)';
    }
    return result.value ? new TextDecoder().decode(result.value) : '';
  } finally {
    clearTimeout(timer);
    await reader.cancel().catch(() => {});
  }
}

async function hit(path, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`${base}${path}`, { headers, signal: controller.signal });
    clearTimeout(timer);
    console.log(`GET ${path} -> ${response.status}`);
    const body = await readChunk(response, 1500);
    console.log(body.replace(/\s+/g, ' ').slice(0, 300));
  } catch (error) {
    clearTimeout(timer);
    const message = error instanceof Error ? error.message : String(error);
    console.log(`GET ${path} -> ERROR ${message}`);
  }
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
    const issue = startedBody.issue?.[0]?.details?.text ?? startedBody.issue?.[0]?.diagnostics ?? 'no code';
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
  console.log(`LOGIN: ok email=${email}`);
  return tokenBody.access_token;
}

await hit('/healthcheck');

let token;
try {
  token = await login();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`LOGIN: fail ${message}`);
  process.exitCode = 1;
}

if (token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json, text/event-stream',
  };
  await hit('/mcp/stream', headers);
  await hit('/mcp/sse', headers);
  await hit('/api/mcp/stream', headers);

  const client = new Client({ name: 'mcp-bot-probe', version: '0.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(`${base}/mcp/stream`), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  });
  let timer;
  try {
    const connectPromise = (async () => {
      await client.connect(transport);
      const tools = await client.listTools();
      console.log(`MCP_CONNECT: ok tools=${tools.tools.map((tool) => tool.name).join(',')}`);
    })();
    await Promise.race([
      connectPromise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timed out after 20s')), 20000);
      }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : '';
    console.log(`MCP_CONNECT: fail ${message}${cause ? ` cause=${cause}` : ''}`);
    process.exitCode = 1;
  } finally {
    clearTimeout(timer);
    await client.close().catch(() => {});
  }
}
