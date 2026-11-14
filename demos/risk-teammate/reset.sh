#!/usr/bin/env bash
# Idempotent. Removes local run output. Never calls Jira.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for f in seed/intended-use.md seed/hazard-log.yaml seed/unassessed.yaml; do
  if [ ! -f "$here/$f" ]; then
    echo "risk-teammate: missing $f" >&2
    exit 1
  fi
done

if [ -d "$here/run" ]; then
  rm -rf "$here/run"
  echo "risk-teammate: removed demos/risk-teammate/run/"
else
  echo "risk-teammate: already clean"
fi

echo "risk-teammate: seed is in place. This script does not create or edit GIO tickets."
echo "Labels for the ticket the bot creates:"
echo "  demo, medplum, story:risk-teammate, track:ls, stage:02"
echo "Do not add automatable, agent-safe, or maintenance."
