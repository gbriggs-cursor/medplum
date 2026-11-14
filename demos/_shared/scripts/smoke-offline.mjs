#!/usr/bin/env node
// Runs every story's `offline` command with API keys unset.
//
//   node demos/_shared/scripts/smoke-offline.mjs
//
// Exit 0 when every story prints REPLAY (no key) or OFFLINE and exits 0.

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const catalogPath = join(repoRoot, 'demos', 'catalog.yaml');
const STORY_TIMEOUT_MS = 180000;

const catalog = YAML.parse(readFileSync(catalogPath, 'utf8'));
const stories = Array.isArray(catalog?.stories) ? catalog.stories : [];

function childEnv() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (
      key === 'CURSOR_API_KEY' ||
      key === 'CURSOR_API_KEY_FILE' ||
      key === 'CURSOR_SERVICE_ACCOUNT_KEY' ||
      key === 'XAI_API_KEY' ||
      key.startsWith('JIRA_')
    ) {
      delete env[key];
    }
  }
  return env;
}

function runOffline(command) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      shell: true,
      cwd: repoRoot,
      env: childEnv(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', (chunk) => {
      out += chunk;
    });
    child.stderr.on('data', (chunk) => {
      out += chunk;
    });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
    }, STORY_TIMEOUT_MS);
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ code: 1, out: out + error.message, timedOut: false });
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, out, timedOut: signal === 'SIGKILL' });
    });
  });
}

function labeled(out) {
  return out.includes('REPLAY (no key)') || out.includes('OFFLINE');
}

const results = [];
for (const story of stories) {
  const code = String(story.code ?? '').padEnd(4);
  const id = String(story.id ?? '(missing id)');
  const command = typeof story.offline === 'string' ? story.offline.trim() : '';
  if (!command) {
    results.push({ ok: false, line: `FAIL  ${code} ${id}  no offline command` });
    continue;
  }
  const run = await runOffline(command);
  if (run.timedOut) {
    results.push({ ok: false, line: `FAIL  ${code} ${id}  timed out after ${STORY_TIMEOUT_MS}ms` });
    continue;
  }
  if (run.code !== 0) {
    const tail = run.out.trim().split('\n').slice(-3).join(' | ');
    results.push({
      ok: false,
      line: `FAIL  ${code} ${id}  exit ${run.code}${tail ? `: ${tail}` : ''}`,
    });
    continue;
  }
  if (!labeled(run.out)) {
    results.push({
      ok: false,
      line: `FAIL  ${code} ${id}  exit 0 missing REPLAY (no key) or OFFLINE label`,
    });
    continue;
  }
  const mode = run.out.includes('REPLAY (no key)') ? 'REPLAY (no key)' : 'OFFLINE';
  results.push({ ok: true, line: `PASS  ${code} ${id}  ${mode}` });
}

for (const result of results) {
  console.log(result.line);
}
const passed = results.filter((result) => result.ok).length;
const failed = results.length - passed;
console.log(
  `${failed ? 'FAIL' : 'PASS'}: ${results.length} stories (${passed} passed, ${failed} failed)`
);
process.exit(failed ? 1 : 0);
