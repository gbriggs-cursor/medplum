# Prompt: L6 Design review gate

Variables: `{prospect}` (default `Acme Cardio`), `{signer}` (default `Dana Reviewer`), `{role}` (default `Design review lead`). On stage, use the real approver's name and role.

These prompts are live mode, and no keys are needed. The key-free default without a cloud agent is `demos/approval-gate/offline.sh`.

## 1. Build the evidence (never waits for approval)

```
We're at {prospect}'s design review, stage 06 Approve. Run demos/approval-gate/reset.sh, then
node demos/approval-gate/gate.mjs build from the repository root. Show the first eight lines of
demos/approval-gate/evidence/EVIDENCE.md and the whole APPROVAL-CARD.md. Commit the evidence folder
with git add -f demos/approval-gate/evidence and open a draft PR against the default branch titled
"Design review evidence: REQ-001 (Approval pending)". Do not record a decision.
```

Grok Bot posts `APPROVAL-CARD.md` as the approval card.

## 2. Record the human decision (sent only after the approver says so on stage)

```
{signer}, {role}, approves the design review for REQ-001. Run
node demos/approval-gate/gate.mjs approve --signer "{signer}" --role "{role}" --channel grok-bot
then node demos/approval-gate/gate.mjs verify. Show approval.json and the Approval line in
EVIDENCE.md. Commit with git add -f demos/approval-gate/evidence, push to the same PR, and change the
PR title to end in "(Approved)".
```

## 3. Optional: tamper check (do not push)

```
Change the Result line in demos/approval-gate/evidence/EVIDENCE.md to say 5 passed, run
node demos/approval-gate/gate.mjs verify, show the output, then discard the edit with
git restore demos/approval-gate/evidence/EVIDENCE.md.
```

Expected: `INVALID. Changed after the decision: EVIDENCE.md`.
