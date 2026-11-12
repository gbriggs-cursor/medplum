#!/usr/bin/env bash
# Clears dry-run tickets and any P3 patients on the local Medplum server. Safe to re-run. Never touches Jira.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf run
mkdir -p run/outbox
node scripts/reset.mjs
echo "phi-tripwire reset: run/outbox is empty"
