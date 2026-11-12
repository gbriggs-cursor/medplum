#!/usr/bin/env bash
# Idempotent. Checks the fixture index. Never calls Jira. Writes nothing.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$here/seed/trace-index.yaml" ]; then
  echo "audit-qa: missing seed/trace-index.yaml" >&2
  exit 1
fi

if [ -d "$here/run" ]; then
  rm -rf "$here/run"
  echo "audit-qa: removed demos/audit-qa/run/"
else
  echo "audit-qa: already clean"
fi

echo "audit-qa: trace index is in place. This script does not call Jira."
