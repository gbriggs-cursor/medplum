#!/usr/bin/env bash
# Key-free end-to-end run of the L6 design review gate, labeled OFFLINE (no key).
# Real: the cohort tests, trace.json, the sha256 record, approve, verify, and tamper detection.
# Local instead of live: the approval card prints here instead of being posted by Grok Bot,
# and the decision is recorded by this script for APPROVER_NAME / APPROVER_ROLE.
#
#   demos/approval-gate/offline.sh
#   APPROVER_NAME="Pat Example" APPROVER_ROLE="QA lead" demos/approval-gate/offline.sh
#
# DEMO_MODE=live builds with Mode: live and stops at Approval: pending for the Grok Bot decision.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
out="${APPROVAL_GATE_OUT:-$here/evidence}"
gate=(node "$here/gate.mjs")
signer="${APPROVER_NAME:-Dana Reviewer}"
role="${APPROVER_ROLE:-Design review lead}"
cd "$repo"

if [ "${DEMO_MODE:-}" = live ]; then
  echo "== MODE: live. Build only; Grok Bot posts the card and the decision is recorded with --channel grok-bot"
  "$here/reset.sh"
  "${gate[@]}" build --mode live
  echo "approval-gate: live build done. Record the decision with prompt.md part 2"
  exit 0
fi

echo "== MODE: OFFLINE (no key). The card shows here instead of Grok Bot; tests, trace, sha256 binding, approve, and verify are real"
"$here/reset.sh"

echo "== 1. Build evidence (never waits)"
"${gate[@]}" build --mode offline

echo "== 2. Approval card (OFFLINE (no key): shown locally, not posted by Grok Bot)"
sed 's/^/  | /' "$out/APPROVAL-CARD.md"

echo "== 3. Verify before any decision (expect: no decision recorded)"
if "${gate[@]}" verify; then
  echo "approval-gate: verify passed with no decision" >&2
  exit 1
fi

echo "== 4. Record the decision for $signer ($role)"
"${gate[@]}" approve --signer "$signer" --role "$role" --channel offline-cli \
  --meaning "Design review passed for REQ-001 (OFFLINE (no key) run)"

echo "== 5. Verify (expect VALID)"
"${gate[@]}" verify

echo "== 6. Tamper check on EVIDENCE.md (expect INVALID), then restore"
cp "$out/EVIDENCE.md" "$out/EVIDENCE.md.orig"
sed -i 's/^Result: pass (\([0-9]*\) passed/Result: pass (9\1 passed/' "$out/EVIDENCE.md"
if "${gate[@]}" verify; then
  mv "$out/EVIDENCE.md.orig" "$out/EVIDENCE.md"
  echo "approval-gate: tamper edit was not detected" >&2
  exit 1
fi
mv "$out/EVIDENCE.md.orig" "$out/EVIDENCE.md"
"${gate[@]}" verify

echo "PASS: OFFLINE (no key) L6 design review gate. Evidence in ${out#"$repo"/}/ (EVIDENCE.md, trace.json, approval.json)"
