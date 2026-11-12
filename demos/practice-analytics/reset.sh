#!/usr/bin/env bash
# Idempotent. Clears run output, then prints dependency status and the questions.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
prospect="${PROSPECT:-Foo Medical}"
month="${MONTH:-March 2026}"

rm -rf "$here/run"
node "$here/../_shared/scripts/catalog.mjs" --preflight practice-analytics
echo
sed "s/{prospect}/${prospect}/g; s/{month}/${month}/g" "$here/seed/questions.md"
