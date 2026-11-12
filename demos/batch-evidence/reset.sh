#!/usr/bin/env bash
# Idempotent. Removes generated evidence. The cohort index and change list stay.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "$here/evidence" ]; then
  rm -rf "$here/evidence"
  echo "batch-evidence: removed demos/batch-evidence/evidence/"
else
  echo "batch-evidence: already clean"
fi
