#!/usr/bin/env bash
# Idempotent. Removes local run output. Never calls Jira.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for f in seed/complaint.md seed/sop.md seed/id-register.yaml; do
  if [ ! -f "$here/$f" ]; then
    echo "complaint-capa: missing $f" >&2
    exit 1
  fi
done

if [ -d "$here/run" ]; then
  rm -rf "$here/run"
  echo "complaint-capa: removed demos/complaint-capa/run/"
else
  echo "complaint-capa: already clean"
fi

echo "complaint-capa: seed is in place. This script does not create or edit GIO tickets."
echo "Labels for tickets the bot creates:"
echo "  demo, medplum, story:complaint-capa, track:ls, stage:post-market"
echo "Do not add automatable, agent-safe, or maintenance."
