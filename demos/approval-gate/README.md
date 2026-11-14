# L6 Design review gate

**Setup line:** "The build is green and the trace is complete. In {prospect}'s process, it isn't released until a named person signs the design review."

**Wow line:** "{signer} approved, and approval.json now holds who, what the signature means, when, and a hash of the exact evidence. Change one character in the evidence and the approval no longer verifies."

## Run it (default: OFFLINE (no key))

```bash
demos/approval-gate/offline.sh
```

It needs no keys. It resets, builds the evidence, prints the approval card here instead of having Grok Bot post it, and records the decision for `APPROVER_NAME` and `APPROVER_ROLE` (defaults `Dana Reviewer`, `Design review lead`) on channel `offline-cli`. Then it runs verify (VALID), edits `EVIDENCE.md` (INVALID), and restores it (VALID). The tests, `trace.json`, the sha256 record and verify are the same code as in live mode. Every file is labeled: `EVIDENCE.md` and `APPROVAL-CARD.md` start with `Mode: OFFLINE (no key)`, and `trace.json` and `approval.json` have `"mode": "offline"`. It exits 0 and ends with a `PASS: OFFLINE (no key)` line.

To show the decision live on stage, have the approver say the words and run `approve` yourself instead of the script's step 4. The commands are on the card.

## Live mode

No env key is needed. The only thing live mode adds is the Grok Bot card post, which hasn't been run yet. `DEMO_MODE=live demos/approval-gate/offline.sh` builds with `Mode: live` and stops at `Approval: pending`.

1. Start a cloud agent in environment `67842161` from the default branch and paste part 1 of `prompt.md`. It builds the evidence and opens a draft PR with `Approval: pending`. Nothing waits.
2. Show `APPROVAL-CARD.md`, which Grok Bot posts as the approval card.
3. When the approver says approve, paste part 2. Show `approval.json` and `verify: VALID`.
4. Optionally paste part 3 to show tamper detection (`INVALID`), then discard the edit.

## Files

| File | When |
| --- | --- |
| `evidence/EVIDENCE.md` | build. The six v1 lines plus `Trace:` and `Approval:` |
| `evidence/trace.json` | build. Evidence v2 trace rows (REQ, RISK, TEST, RUN, RESULT, COMMIT) |
| `evidence/APPROVAL-CARD.md` | build. The record digest and the approve and reject commands |
| `evidence/approval.json` | approve. Signer, meaning, time, channel, and sha256 record |

Shapes are in `demos/_shared/evidence-v2/README.md`. Approvals stay in the evidence package and the Grok Bot chat. Nothing is written back to Medplum.

## Data

P1 device cohort, `demos/_shared/data-packs/p1-device-cohort/`. It's PR #11's generator, parser, tests, and bundle, moved to a shared location. Seed `20261104`, and every resource is tagged synthetic and HTEST. `npx tsx src/generate.ts` in that folder regenerates the same bundle; the only difference is JSON formatting.

## Fallback

[PR #11](https://github.com/gbriggs-cursor/medplum/pull/11) has the same cohort's v1 evidence, without an approval.

## Reset

`demos/approval-gate/reset.sh` deletes `evidence/`, including any decision. It's safe to re-run.
