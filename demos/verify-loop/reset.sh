#!/usr/bin/env bash
# Idempotent. Removes the planted regression, the evidence of the last run, and the
# remediation workspace.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
ws="${VERIFY_LOOP_WORKSPACE:-${TMPDIR:-/tmp}/verify-loop-workspace}"

if ! git -C "$repo" diff --quiet -- packages/core/src/search/match.ts; then
  git -C "$repo" restore -- packages/core/src/search/match.ts
  echo "verify-loop: restored packages/core/src/search/match.ts"
fi
rm -rf "${VERIFY_LOOP_OUT:-$here/evidence}" "$ws"
echo "verify-loop: clean"
