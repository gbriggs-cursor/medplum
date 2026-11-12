#!/usr/bin/env bash
# Idempotent. Removes local run output; the cohort is regenerated from the seed on each run.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "$here/run" ]; then
  rm -rf "$here/run"
  echo "device-evidence: removed demos/device-evidence/run/"
else
  echo "device-evidence: already clean"
fi
