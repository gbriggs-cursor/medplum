#!/usr/bin/env bash
# Idempotent. Nothing is seeded locally; prints dependency status and the caller scripts.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
prospect="${PROSPECT:-Foo Medical}"

node "$here/../_shared/scripts/catalog.mjs" --preflight front-office-voice
echo
sed "s/{prospect}/${prospect}/g" "$here/seed/calls.md"
