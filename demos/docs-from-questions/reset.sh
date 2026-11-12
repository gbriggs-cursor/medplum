#!/usr/bin/env bash
# Idempotent. The seed is static; this prints it with the prospect filled in.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
prospect="${PROSPECT:-Foo Medical}"

echo "docs-from-questions: nothing to clean locally. Seeded questions:"
echo
sed "s/{prospect}/${prospect}/g" "$here/seed/questions.md"
