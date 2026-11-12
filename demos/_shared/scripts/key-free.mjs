// DEMO_MODE selection for story commands. Key-free output is labeled by the caller.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CURSOR_KEYS = ['CURSOR_API_KEY', 'CURSOR_API_KEY_FILE', 'CURSOR_SERVICE_ACCOUNT_KEY'];

export function cursorCredentialPresent(env = process.env) {
  return CURSOR_KEYS.some((name) => typeof env[name] === 'string' && env[name].trim() !== '');
}

export function blockedLiveMessage({ missingKey, keyFreeMode, command }) {
  const flag = keyFreeMode === 'offline' ? 'offline' : 'replay';
  const label = keyFreeMode === 'offline' ? 'OFFLINE' : 'REPLAY (no key)';
  return `BLOCKED: live mode needs ${missingKey}. Unset DEMO_MODE (or set DEMO_MODE=${flag}) to run ${label} mode: ${command}`;
}

export function resolveDemoMode(env, options) {
  const requested = env.DEMO_MODE ?? '';
  const known = requested === '' || requested === 'auto' || requested === 'live' || requested === 'replay' || requested === 'offline';
  if (!known) {
    return { blocked: `BLOCKED: DEMO_MODE=${requested} is not auto, live, replay, or offline.` };
  }
  const live = requested === 'live' || ((requested === '' || requested === 'auto') && cursorCredentialPresent(env));
  if (live && !cursorCredentialPresent(env)) {
    return { blocked: blockedLiveMessage(options) };
  }
  return { live };
}

export function labelEvidenceDir(dir, mode) {
  for (const name of ['EVIDENCE.md', 'DHF-INDEX.md']) {
    const file = join(dir, name);
    if (!existsSync(file)) {
      continue;
    }
    const text = readFileSync(file, 'utf8');
    if (!text.startsWith(`${mode}\n`)) {
      writeFileSync(file, `${mode}\n${text}`);
    }
  }
  const tracePath = join(dir, 'trace.json');
  if (!existsSync(tracePath)) {
    return;
  }
  const trace = JSON.parse(readFileSync(tracePath, 'utf8'));
  delete trace.mode;
  writeFileSync(tracePath, `${JSON.stringify({ mode, ...trace }, null, 2)}\n`);
}

export function replayModelTurn(fixturePath) {
  const result = spawnSync('npx', ['--yes', '@grok/agent-sdk@0.6.0', 'session', 'get', '--file', fixturePath], {
    encoding: 'utf8',
  });
  if (result.stdout) {
    process.stdout.write(result.stdout.endsWith('\n') ? result.stdout : `${result.stdout}\n`);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  if (result.status !== 0) {
    throw new Error(`agent-sdk session get exited ${result.status ?? 'unknown'}`);
  }
}

export function ensureRunnerInstalled(runnerDir) {
  if (existsSync(join(runnerDir, 'node_modules/@grok/agent-sdk/package.json'))) {
    return;
  }
  const result = spawnSync('npm', ['ci', '--ignore-scripts'], { cwd: runnerDir, encoding: 'utf8' });
  if (result.stdout) {
    process.stderr.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  if (result.status !== 0) {
    throw new Error(`npm ci failed in ${runnerDir}`);
  }
}

export function callAgentTool({ dir, name, input, stateRoot }) {
  ensureRunnerInstalled(dir);
  const result = spawnSync(
    'npx',
    [
      '--yes',
      '@grok/agent-sdk@0.6.0',
      'tool',
      'call',
      name,
      '--dir',
      dir,
      '--input',
      JSON.stringify(input),
      '--state-root',
      stateRoot,
      '--json',
    ],
    { encoding: 'utf8' }
  );
  if (result.stdout) {
    process.stdout.write(result.stdout.endsWith('\n') ? result.stdout : `${result.stdout}\n`);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  if (result.status !== 0) {
    throw new Error(`agent-sdk tool call ${name} exited ${result.status ?? 'unknown'}`);
  }
  return result.stdout;
}

export function runAgentLive({ dir, message, stateRoot }) {
  ensureRunnerInstalled(dir);
  const result = spawnSync(
    'npx',
    ['--yes', '@grok/agent-sdk@0.6.0', 'run', '--dir', dir, '--message', message, '--no-stream', '--state-root', stateRoot],
    { stdio: 'inherit' }
  );
  return result.status ?? 1;
}
