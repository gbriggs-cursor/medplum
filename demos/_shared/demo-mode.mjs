// DEMO_MODE selects live vs key-free for a story command.
//   unset: live when every key the live path needs is set, otherwise key-free
//   replay | offline: key-free even when the keys are set
//   live: live, or BLOCKED (exit 3) naming the missing keys and the key-free command

const KEYS = {
  CURSOR_API_KEY: ['CURSOR_API_KEY'],
  XAI_API_KEY: ['XAI_API_KEY'],
  JIRA: ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_KEY'],
};

export function missingKeys(needs, env = process.env) {
  const names = [];
  for (const need of needs) {
    for (const key of KEYS[need] ?? [need]) {
      if (!names.includes(key)) {
        names.push(key);
      }
    }
  }
  return names.filter((key) => !String(env[key] ?? '').trim());
}

export function blockedMessage({ missing, offlineCommand, kind = 'REPLAY (no key)' }) {
  return `BLOCKED: live mode needs ${missing.join(', ')}. Unset DEMO_MODE (or set DEMO_MODE=replay) to run ${kind} mode: ${offlineCommand}`;
}

/**
 * @returns {{ mode: 'live' | 'key-free' | 'blocked', missing: string[], message?: string }}
 */
export function resolveDemoMode({ needs, offlineCommand, kind = 'REPLAY (no key)', env = process.env }) {
  const requested = String(env.DEMO_MODE ?? '').trim();
  const missing = missingKeys(needs, env);
  if (requested === 'live') {
    if (missing.length) {
      return { mode: 'blocked', missing, message: blockedMessage({ missing, offlineCommand, kind }) };
    }
    return { mode: 'live', missing };
  }
  if (requested === 'replay' || requested === 'offline') {
    return { mode: 'key-free', missing };
  }
  if (requested) {
    return {
      mode: 'blocked',
      missing,
      message: `BLOCKED: DEMO_MODE=${requested} is not replay, offline, or live. Unset DEMO_MODE (or set DEMO_MODE=replay) to run ${kind} mode: ${offlineCommand}`,
    };
  }
  return missing.length === 0 ? { mode: 'live', missing } : { mode: 'key-free', missing };
}

export function applyDemoMode(options) {
  const result = resolveDemoMode(options);
  if (result.mode === 'blocked') {
    console.error(result.message);
    process.exit(3);
  }
  return result.mode;
}
