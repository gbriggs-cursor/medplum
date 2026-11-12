#!/usr/bin/env bash
# Idempotent. Removes the evidence package and any recorded decision from the last run.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
out="${APPROVAL_GATE_OUT:-$here/evidence}"

if [ -d "$out" ]; then
  rm -rf "$out"
  echo "approval-gate: removed ${out#"$here"/}"
else
  echo "approval-gate: already clean"
fi
