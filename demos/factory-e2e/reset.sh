#!/usr/bin/env bash
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "$here/run" ]; then
  rm -rf "$here/run"
  echo "factory-e2e: removed demos/factory-e2e/run/"
else
  echo "factory-e2e: already clean"
fi
