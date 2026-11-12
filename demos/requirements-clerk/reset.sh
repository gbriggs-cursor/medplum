#!/usr/bin/env bash
# Idempotent. Removes local run output. Never calls Jira.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for f in seed/meeting-notes.md seed/id-register.yaml; do
  if [ ! -f "$here/$f" ]; then
    echo "requirements-clerk: missing $f" >&2
    exit 1
  fi
done

if [ -d "$here/run" ]; then
  rm -rf "$here/run"
  echo "requirements-clerk: removed demos/requirements-clerk/run/"
else
  echo "requirements-clerk: already clean"
fi

echo "requirements-clerk: seed is in place. This script does not create or edit GIO tickets."
echo "Labels for tickets the bot creates:"
echo "  demo, medplum, story:requirements-clerk, track:ls, stage:01"
echo "Do not add automatable, agent-safe, or maintenance."
