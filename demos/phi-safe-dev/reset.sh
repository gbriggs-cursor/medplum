#!/usr/bin/env bash
# Idempotent. Nothing is seeded outside this folder; this checks the baseline and prints the raw ticket.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
prospect="${PROSPECT:-Foo Medical}"

node "$here/../_shared/scripts/catalog.mjs" --preflight phi-safe-dev || echo "(stub mode: the agent skips the Jira write)"
echo
node --test "$here"/app/*.test.mjs
echo
sed "s/{prospect}/${prospect}/g" "$here/seed/ticket.md"
