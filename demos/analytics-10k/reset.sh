#!/usr/bin/env bash
# Idempotent. Removes the agent's run output; the data pack itself is read-only and never touched.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "$here/run" ]; then
  rm -rf "$here/run"
  echo "analytics-10k: removed demos/analytics-10k/run/"
else
  echo "analytics-10k: already clean"
fi
