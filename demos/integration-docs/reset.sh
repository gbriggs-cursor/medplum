#!/usr/bin/env bash
# Idempotent. Nothing is seeded; checks every source anchor still holds, then prints the partner questions.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/../.." && pwd)"
prospect="${PROSPECT:-Foo Medical}"

stale=0
while read -r question path text; do
  [[ -z "$question" || "$question" == \#* ]] && continue
  if [[ ! -f "$root/$path" ]]; then
    echo "STALE  Q$question $path (missing)"; stale=1
  elif [[ -n "$text" ]] && ! grep -qF -- "$text" "$root/$path"; then
    echo "STALE  Q$question $path (no \"$text\")"; stale=1
  else
    echo "ok     Q$question $path${text:+ ($text)}"
  fi
done < "$here/anchors.txt"
if [[ $stale -ne 0 ]]; then
  echo "FAIL: update demos/integration-docs/anchors.txt and the prompt before running this story" >&2
  exit 1
fi
echo
sed "s/{prospect}/${prospect}/g" "$here/seed/partner-questions.md"
