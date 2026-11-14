#!/usr/bin/env bash
# Verify loop: plant a regression, CI goes red, a remediation agent fixes source only,
# CI goes green, and the trace matrix records both runs.
#
#   demos/verify-loop/run.sh                     # auto: live when a Cursor key is present, else OFFLINE
#   DEMO_MODE=offline demos/verify-loop/run.sh   # OFFLINE (no key): reference remediator reverses the patch
#   DEMO_MODE=live demos/verify-loop/run.sh      # Agent SDK remediator; exits 3 when the key is missing
#
# Every mode plants the regression and runs the real tests. Only the remediation step differs.
#
# Exit codes: 0 green after remediation, 1 still red, 2 usage, 3 blocked (live mode without a key),
# 4 guard rejected a test or non-source change, 5 the planted regression was not detected.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
out="${VERIFY_LOOP_OUT:-$here/evidence}"
ws="${VERIFY_LOOP_WORKSPACE:-${TMPDIR:-/tmp}/verify-loop-workspace}"
patch="$here/regression.patch"
sdk='@grok/agent-sdk@0.6.0'

offline_cmd='DEMO_MODE=offline demos/verify-loop/run.sh'
has_key() { [ -n "${CURSOR_API_KEY:-}${CURSOR_API_KEY_FILE:-}${CURSOR_SERVICE_ACCOUNT_KEY:-}" ]; }

case "${DEMO_MODE:-}" in
  live)
    if ! has_key; then
      echo "BLOCKED: live mode needs CURSOR_API_KEY (or CURSOR_API_KEY_FILE / CURSOR_SERVICE_ACCOUNT_KEY). Unset DEMO_MODE (or set DEMO_MODE=offline) to run OFFLINE (no key) mode: $offline_cmd" >&2
      exit 3
    fi
    mode=live
    ;;
  offline) mode=offline ;;
  replay)
    echo "verify-loop: no checked-in agent replay exists for this story (no key was ever available to record one); running OFFLINE (no key)"
    mode=offline
    ;;
  "")
    if [ "${REMEDIATOR:-}" = reference ] || ! has_key; then mode=offline; else mode=live; fi
    ;;
  *)
    echo "verify-loop: unknown DEMO_MODE=$DEMO_MODE (use live, offline, or replay)" >&2
    exit 2
    ;;
esac

if [ "$mode" = live ]; then
  echo "== MODE: live. The Agent SDK remediator (demos/verify-loop/remediator) fixes the regression"
  label="after remediation (agent)"
else
  echo "== MODE: OFFLINE (no key). The reference remediator reverses the planted patch; the plant, both CI runs, the guard, and the trace matrix are real"
  label="after remediation (OFFLINE reference remediator)"
fi

cd "$repo"
"$here/reset.sh"
mkdir -p "$out"

echo "== 1. Plant the regression"
git apply "$patch"
git diff --stat -- packages/core

echo "== 2. CI on the planted tree (expect red)"
if node "$here/ci.mjs" --root "$repo" --label "planted regression" --mode "$mode" --out "$out"; then
  echo "verify-loop: CI stayed green on the planted regression" >&2
  exit 5
fi

echo "== 3. Build the remediation workspace at $ws"
mkdir -p "$ws/packages"
cp -a packages/core "$ws/packages/core"
rm -rf "$ws/packages/core/node_modules" "$ws/packages/core/dist"
for p in packages/*; do
  [ "$p" = packages/core ] || ln -sfn "$repo/$p" "$ws/$p"
done
ln -sfn "$repo/node_modules" "$ws/node_modules"
cp package.json tsconfig.json vitest.config.ts "$ws/"

failing="$(cat "$out/run-1.failing.txt")"
message="CI failed on packages/core. Failing tests:
$failing

Last lines of the CI log:
$(tail -n 40 "$out/run-1.log.txt")

Fix the source so these tests pass. Follow your rules."

echo "== 4. Remediate ($mode)"
case "$mode" in
  live)
    VERIFY_LOOP_WORKSPACE="$ws" npx --yes "$sdk" run --dir "$here/remediator" --message "$message" --json \
      --trace "$out/remediator.trace.ndjson" > "$out/remediator.stdout.txt"
    # --json still prints log lines before the document. Keep the document only.
    node -e '
      const fs = require("node:fs");
      const raw = fs.readFileSync(process.argv[1], "utf8");
      const at = raw.indexOf("\n{");
      const value = JSON.parse(at === -1 ? raw.trim() : raw.slice(at + 1));
      fs.writeFileSync(process.argv[2], JSON.stringify(value, null, 2) + "\n");
      console.log(`remediator: ok=${value.ok} session=${value.sessionId}`);
    ' "$out/remediator.stdout.txt" "$out/remediator.json"
    ;;
  offline)
    (cd "$ws" && git apply -R "$patch")
    echo "OFFLINE (no key): reference remediator reversed the planted patch (not an agent)"
    ;;
esac

echo "== 5. Guard: copy back source changes only"
node "$here/guard.mjs" --workspace "$ws/packages/core" --repo "$repo/packages/core" --out "$out/guard.json" || exit 4

echo "== 6. CI on the remediated tree (expect green)"
status=0
node "$here/ci.mjs" --root "$repo" --label "$label" --mode "$mode" --out "$out" || status=$?

node "$here/evidence.mjs" --out "$out" --mode "$mode"
echo "verify-loop: evidence in ${out#"$repo"/}/ (EVIDENCE.md, trace.json, TRACE.md)"
if [ "$status" -eq 0 ]; then
  if [ "$mode" = live ]; then echo "PASS: live L5 verify loop. Red, then green after the agent fix"
  else echo "PASS: OFFLINE (no key) L5 verify loop. Red, then green after the reference remediator; tests, guard, and trace are real"; fi
fi
exit "$status"
