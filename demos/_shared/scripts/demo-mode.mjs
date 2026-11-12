// Picks live vs key-free for a demo story. See internal key-free contract.
// DEMO_MODE unset: live only when every live key is set, otherwise key-free.
// DEMO_MODE=replay or offline: key-free even if keys are set.
// DEMO_MODE=live: live, or BLOCKED (exit 3) naming the missing keys.

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
