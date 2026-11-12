Requirement: REQ-004: A 30-day trend shows every reading in the window, including the first and last day. REQ-005: A search filtered by project returns the same results in MockClient and on the server.
Change: reference remediator (reversed the planted patch; pipeline self-test, not an agent) changed packages/core/src/search/match.ts; the result matches the base commit (no net diff)
Test: node demos/verify-loop/ci.mjs (npx vitest run src/search/match.test.ts (in packages/core))
Result: pass (54 passed, 0 failed)
Synthetic: true
Commit: 0b6ad2a430d63c5767e809e342fab5b074385bbd
Trace: REQ-004, RISK-003, REQ-005, RISK-004

Loop: run-1 on the planted regression had 3 failed; run-2 after remediation had 0 failed. Guard: accepted (source only, no test changes).

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| REQ-004 | 26 traced tests in packages/core/src/search/match.test.ts | run-1 (planted regression), 2026-11-12 | fail |
| REQ-004 | 26 traced tests in packages/core/src/search/match.test.ts | run-2 (after remediation (reference)), 2026-11-12 | pass |
| REQ-005 | 5 traced tests in packages/core/src/search/match.test.ts | run-1 (planted regression), 2026-11-12 | pass |
| REQ-005 | 5 traced tests in packages/core/src/search/match.test.ts | run-2 (after remediation (reference)), 2026-11-12 | pass |

## Test log

```

 RUN  v4.1.12 /agent/repos/medplum/packages/core

 ✓ |@medplum/core| src/search/match.test.ts (54 tests) 464ms

 Test Files  1 passed (1)
      Tests  54 passed (54)
   Start at  16:06:10
   Duration  1.18s (transform 212ms, setup 224ms, import 33ms, tests 464ms, environment 375ms)

JSON report written to /agent/repos/medplum/demos/verify-loop/self-test/evidence/run-2.vitest.json
EXIT:0
```
