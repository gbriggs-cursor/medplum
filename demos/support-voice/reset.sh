#!/usr/bin/env bash
# Clears dry-run tickets and eval artifacts. Safe to re-run. Never touches Jira.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf run agents/triage/.agent-serve
mkdir -p run/outbox
echo "support-voice reset: run/outbox is empty"
