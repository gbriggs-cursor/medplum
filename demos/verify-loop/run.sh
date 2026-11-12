#!/usr/bin/env bash
# Verify loop: plant a regression, CI goes red, a remediation agent fixes source only,
# CI goes green, and the trace matrix records both runs.
#
#   demos/verify-loop/run.sh                       # remediation by the Agent SDK agent (needs CURSOR_API_KEY)
#   REMEDIATOR=reference demos/verify-loop/run.sh  # pipeline self-test: reverses the patch, no model
#
# Exit codes: 0 green after remediation, 1 still red, 3 blocked (missing credential),
# 4 guard rejected a test or non-source change, 5 the planted regression was not detected.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
out="${VERIFY_LOOP_OUT:-$here/evidence}"
ws="${VERIFY_LOOP_WORKSPACE:-${TMPDIR:-/tmp}/verify-loop-workspace}"
remediator="${REMEDIATOR:-agent}"
patch="$here/regression.patch"
sdk='@grok/agent-sdk@0.6.0'

if [ "$remediator" = agent ] && [ -z "${CURSOR_API_KEY:-}${CURSOR_API_KEY_FILE:-}${CURSOR_SERVICE_ACCOUNT_KEY:-}" ]; then
  echo "verify-loop: BLOCKED. The remediation agent needs CURSOR_API_KEY (or CURSOR_API_KEY_FILE / CURSOR_SERVICE_ACCOUNT_KEY) in environment 67842161." >&2
  echo "verify-loop: run REMEDIATOR=reference for the pipeline self-test, or show the fallback." >&2
  exit 3
fi

cd "$repo"
"$here/reset.sh"
mkdir -p "$out"

echo "== 1. Plant the regression"
git apply "$patch"
git diff --stat -- packages/core

echo "== 2. CI on the planted tree (expect red)"
if node "$here/ci.mjs" --root "$repo" --label "planted regression" --out "$out"; then
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

echo "== 4. Remediate ($remediator)"
case "$remediator" in
  agent)
    VERIFY_LOOP_WORKSPACE="$ws" npx --yes "$sdk" run --dir "$here/remediator" --message "$message" --json \
      --trace "$out/remediator.trace.ndjson" > "$out/remediator.json"
    node -e 'const r=require(process.argv[1]); console.log(`remediator: ok=${r.ok} session=${r.sessionId}`)' "$out/remediator.json"
    ;;
  reference)
    (cd "$ws" && git apply -R "$patch")
    echo "reference remediator: reversed the planted patch (pipeline self-test, not an agent)"
    ;;
  *)
    echo "verify-loop: unknown REMEDIATOR=$remediator" >&2
    exit 2
    ;;
esac

echo "== 5. Guard: copy back source changes only"
node "$here/guard.mjs" --workspace "$ws/packages/core" --repo "$repo/packages/core" --out "$out/guard.json" || exit 4

echo "== 6. CI on the remediated tree (expect green)"
status=0
node "$here/ci.mjs" --root "$repo" --label "after remediation ($remediator)" --out "$out" || status=$?

node "$here/evidence.mjs" --out "$out" --remediator "$remediator"
echo "verify-loop: evidence in ${out#"$repo"/}/ (EVIDENCE.md, trace.json, TRACE.md)"
exit "$status"
