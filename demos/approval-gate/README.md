# L6 Design review gate

**Setup line:** "The build is green and the trace is complete. In {prospect}'s process, it isn't released until a named person signs the design review."

**Wow line:** "{signer} approved, and approval.json now holds who, what the signature means, when, and a hash of the exact evidence. Change one character in the evidence and the approval no longer verifies."

## Run it

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
