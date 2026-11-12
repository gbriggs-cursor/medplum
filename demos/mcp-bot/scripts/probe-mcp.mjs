#!/usr/bin/env node
// Probe the local Medplum MCP endpoint. Prints statuses and error text. Does not print tokens.

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const base = (process.env.MEDPLUM_BASE_URL ?? 'http://127.0.0.1:8103').replace(/\/$/, '');

async function hit(path, headers) {
  try {
    const response = await fetch(`${base}${path}`, { headers });
    const body = await response.text();
    console.log(`GET ${path} -> ${response.status}`);
    console.log(body.replace(/\s+/g, ' ').slice(0, 300));
  } catch (error) {
    console.log(`GET ${path} -> ERROR ${error instanceof Error ? error.message : String(error)}`);
  }
}

await hit('/healthcheck');
await hit('/mcp/stream');
await hit('/mcp/sse');
await hit('/api/mcp/stream');
await hit('/mcp/stream', { Authorization: 'Bearer invalid' });

const client = new Client({ name: 'mcp-bot-probe', version: '0.0.0' });
const transport = new StreamableHTTPClientTransport(new URL(`${base}/mcp/stream`));
try {
  await client.connect(transport);
  const tools = await client.listTools();
  console.log(`MCP_CONNECT: ok tools=${tools.tools.map((tool) => tool.name).join(',')}`);
  await client.close();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : '';
  console.log(`MCP_CONNECT: fail ${message}${cause ? ` cause=${cause}` : ''}`);
}
