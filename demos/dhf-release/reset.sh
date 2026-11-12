#!/usr/bin/env bash
# Idempotent. Removes generated evidence. The release records stay.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "$here/evidence" ]; then
  rm -rf "$here/evidence"
  echo "dhf-release: removed demos/dhf-release/evidence/"
else
  echo "dhf-release: already clean"
fi
