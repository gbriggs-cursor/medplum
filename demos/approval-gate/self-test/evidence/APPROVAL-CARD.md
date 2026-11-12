# Approval card: design review

Story: approval-gate (stage 06 Approve). Synthetic: true.

| Field | Value |
| --- | --- |
| Requirement | REQ-001: Medplum ingests and displays Acme Cardio patch v2 blood-pressure panels and ECG summaries. |
| Trace | REQ-001, RISK-002, RISK-001 |
| Result | pass (4 passed, 0 failed) |
| Data | 20 synthetic patients, 20 devices, seed 20261104 |
| Commit | `6fbbd73020941d69d469b6515f0e44608b400dba` |
| Record digest | `dafb8e8049627a1a72669ed416f0bce97c46d4fb6c183ceb03d16a21c0c59e91` |

Approving means: the evidence above shows the design input is met. The decision is bound to this digest; any later edit to EVIDENCE.md or trace.json invalidates it.

Approve:

```
node demos/approval-gate/gate.mjs approve --signer "<name>" --role "<role>" --channel grok-bot
```

Reject:

```
node demos/approval-gate/gate.mjs approve --decision rejected --signer "<name>" --role "<role>" --channel grok-bot
```
