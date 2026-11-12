// Selects live vs key-free for a demo story command.
// Key-free never calls Jira or a model. Live mode does not run from here:
// the story prompt stays the live path, and this file does not call a bot.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const JIRA_TOKEN_ALIASES = ['JIRA_API_TOKEN', 'JIRA_API_KEY'];

export function prospectName() {
  const name = String(process.env.PROSPECT ?? '').trim();
  return name || 'Acme Cardio';
}

export function fillProspect(text, prospect) {
  return String(text).replaceAll('{prospect}', prospect);
}

function isSet(name) {
  return String(process.env[name] ?? '').trim() !== '';
}

export function missingKeys(required) {
  const missing = [];
  for (const name of required) {
    if (name === 'JIRA_API_TOKEN') {
      if (!JIRA_TOKEN_ALIASES.some(isSet)) {
        missing.push('JIRA_API_TOKEN');
      }
    } else if (!isSet(name)) {
      missing.push(name);
    }
  }
  return missing;
}

export function selectMode({ requiredKeys, command }) {
  const requested = String(process.env.DEMO_MODE ?? '').trim();
  const missing = missingKeys(requiredKeys);
  if (requested === 'live') {
    if (missing.length) {
      console.log(
        `BLOCKED: live mode needs ${missing.join(', ')}. Unset DEMO_MODE (or set DEMO_MODE=replay) to run REPLAY (no key) mode: ${command}`
      );
      return { mode: 'blocked' };
    }
    return { mode: 'live' };
  }
  if (requested && requested !== 'replay' && requested !== 'offline') {
    console.log(`BLOCKED: DEMO_MODE=${requested} is not replay, offline, or live.`);
    return { mode: 'blocked' };
  }
  if (requested === 'replay' || requested === 'offline') {
    return { mode: 'keyfree' };
  }
  if (missing.length === 0) {
    return { mode: 'live' };
  }
  return { mode: 'keyfree' };
}

export function announceLive(promptPath) {
  console.log(
    `LIVE: required keys are set. Unchanged live path: ${promptPath}. This runner does not call the bot or Jira.`
  );
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function writeText(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

export function resolveDemoMode(liveKeys, keyFreeCommand) {
  const requested = process.env.DEMO_MODE;
  const missing = liveKeys.filter((key) => !process.env[key]);
  if (requested === 'live') {
    if (missing.length) {
      console.log(
        `BLOCKED: live mode needs ${missing.join(', ')}. Unset DEMO_MODE (or set DEMO_MODE=replay) to run REPLAY (no key) mode: ${keyFreeCommand}`
      );
      process.exit(3);
    }
    return 'live';
  }
  if (requested === 'replay' || requested === 'offline') {
    return 'keyfree';
  }
  if (requested) {
    console.log(`BLOCKED: unknown DEMO_MODE=${requested}. Use replay, offline, or live.`);
    process.exit(3);
  }
  return missing.length === 0 ? 'live' : 'keyfree';
}
