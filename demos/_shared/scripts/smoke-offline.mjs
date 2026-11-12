#!/usr/bin/env node
// Runs every story's `offline` command with API keys unset.
//
//   node demos/_shared/scripts/smoke-offline.mjs
//
// Exit 0 when every story prints REPLAY (no key) or OFFLINE (no key) and exits 0.
// Commands come from each story.yaml. catalog.yaml on the framework branch does not copy them.

import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const demosDir = join(repoRoot, 'demos');
const STORY_TIMEOUT_MS = 180000;

function storyCards() {
  return readdirSync(demosDir)
    .filter((name) => !name.startsWith('_') && !name.startsWith('.'))
    .filter((name) => statSync(join(demosDir, name)).isDirectory())
    .filter((name) => existsSync(join(demosDir, name, 'story.yaml')))
    .map((name) => YAML.parse(readFileSync(join(demosDir, name, 'story.yaml'), 'utf8')))
    .filter((card) => card && typeof card === 'object')
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

const stories = storyCards();

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
  return out.includes('REPLAY (no key)') || out.includes('OFFLINE (no key)');
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
      line: `FAIL  ${code} ${id}  exit 0 missing REPLAY (no key) or OFFLINE (no key)`,
    });
    continue;
  }
  const mode = run.out.includes('REPLAY (no key)') ? 'REPLAY (no key)' : 'OFFLINE (no key)';
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
