#!/usr/bin/env bash
# Idempotent. Prints the ticket Demo Setup should create. Never calls Jira.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
prospect="${PROSPECT:-Acme Cardio}"

echo "ticket-to-pr: nothing to clean locally."
echo "Create one GIO ticket with labels:"
echo "  demo, medplum, story:ticket-to-pr, track:generic, automatable, agent-safe, maintenance"
echo
sed "s/{prospect}/${prospect}/g" "$here/seed/ticket.md"
