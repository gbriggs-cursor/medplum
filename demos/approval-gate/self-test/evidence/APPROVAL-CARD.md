Mode: OFFLINE (no key). The approval card is shown locally instead of by Grok Bot. Tests, trace, and the sha256 binding are real.

# Approval card: design review

Story: approval-gate (stage 06 Approve). Synthetic: true.

| Field | Value |
| --- | --- |
| Requirement | REQ-001: Medplum ingests and displays Acme Cardio patch v2 blood-pressure panels and ECG summaries. |
| Trace | REQ-001, RISK-002, RISK-001 |
| Result | pass (4 passed, 0 failed) |
| Data | 20 synthetic patients, 20 devices, seed 20261104 |
| Commit | `3aa9dd53d8ee74dd6050fccafcc4c230b7b1782a` |
| Record digest | `4e0a0a669870374082b351b07e8f68e720b83f7264aad31f0a65a0309a1ccf4d` |

Approving means: the evidence above shows the design input is met. The decision is bound to this digest; any later edit to EVIDENCE.md or trace.json invalidates it.

Approve:

```
node demos/approval-gate/gate.mjs approve --signer "<name>" --role "<role>" --channel offline-cli
```

Reject:

```
node demos/approval-gate/gate.mjs approve --decision rejected --signer "<name>" --role "<role>" --channel offline-cli
```
