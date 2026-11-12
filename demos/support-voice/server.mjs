#!/usr/bin/env node
// Foo Medical patient support: serves site/ and the intake API on 127.0.0.1. No outside domains.
//   node server.mjs [--port 8787] [--live-jira]

import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createIntakeStore, IntakeError } from './lib/intake.mjs';
import { searchKb } from './lib/kb.mjs';
import { submit } from './lib/pipeline.mjs';

const storyDir = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const port = Number(arg('--port', process.env.PORT ?? 8787));
const liveJira = process.argv.includes('--live-jira');
const prospect = JSON.parse(readFileSync(join(storyDir, 'prospects', 'foomedical.json'), 'utf8'));
const store = createIntakeStore();

const SPOKEN = {
  answered: (d) => `Here is what should help, from article ${d.article}. I've logged this call for the team.`,
  kb_gap: () => "I don't have an article for that yet. I've opened a ticket and the team will add one and follow up.",
  bug: () =>
    "That sounds like a problem on our side. I've opened a ticket for engineering and the team will follow up.",
  urgent_clinical: () =>
    'This line cannot help with symptoms. Please hang up and call 911 now. I have flagged your call for the care team.',
};

async function readJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 64 * 1024) {
      throw new IntakeError('too_large', 'Request body over 64 KB');
    }
  }
  return body ? JSON.parse(body) : {};
}

function send(res, status, data) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(readFileSync(join(storyDir, 'site', 'index.html')));
    }
    if (req.method === 'GET' && url.pathname === '/api/prospect') {
      return send(res, 200, prospect);
    }
    if (req.method === 'GET' && url.pathname === '/api/kb/search') {
      return send(res, 200, searchKb(url.searchParams.get('q') ?? '', { audience: 'patient', limit: 3 }));
    }
    if (req.method === 'POST' && url.pathname === '/api/intake/draft') {
      return send(res, 200, store.draft(await readJson(req)));
    }
    if (req.method === 'POST' && url.pathname === '/api/intake/confirm') {
      const { id, confirmToken, confirmed } = await readJson(req);
      const result = store.confirm(id, confirmToken, { confirmed });
      if (result.state !== 'confirmed') {
        return send(res, 200, { id, state: result.state });
      }
      const out = await submit(result.intake, { intakeId: id, live: liveJira });
      return send(res, 200, {
        id,
        state: 'submitted',
        category: out.decision.category,
        article: out.decision.article,
        spoken: SPOKEN[out.decision.category](out.decision),
        ticket: out.written,
        redaction: out.redaction,
      });
    }
    if (req.method === 'POST' && url.pathname === '/api/voice/session') {
      if (!process.env.XAI_API_KEY) {
        return send(res, 503, { error: 'voice_unavailable', message: 'XAI_API_KEY is not set. Use the form path.' });
      }
      return send(res, 501, {
        error: 'voice_not_wired',
        message: 'The Grok Voice client was not imported (source repo unreachable). Use the form path.',
      });
    }
    send(res, 404, { error: 'not_found' });
  } catch (e) {
    const status =
      e instanceof IntakeError
        ? e.code === 'not_found'
          ? 404
          : e.code === 'missing_fields'
            ? 400
            : 409
        : e.code === 'phi_tripwire'
          ? 422
          : 500;
    send(res, status, { error: e.code ?? 'error', message: e.message });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(
    `Foo Medical support on http://127.0.0.1:${port} (Jira: ${liveJira ? 'live' : 'dry-run to run/outbox/'})`
  );
});
