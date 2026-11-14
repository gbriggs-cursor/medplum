Mode: OFFLINE (no key). Reference remediator, not an agent. The plant, both test runs, the guard, and the trace are real.
Requirement: REQ-004: A 30-day trend shows every reading in the window, including the first and last day. REQ-005: A search filtered by project returns the same results in MockClient and on the server.
Change: OFFLINE (no key) reference remediator (reversed the planted patch; not an agent) changed packages/core/src/search/match.ts; the result matches the base commit (no net diff)
Test: node demos/verify-loop/ci.mjs (npx vitest run src/search/match.test.ts (in packages/core))
Result: pass (54 passed, 0 failed)
Synthetic: true
Commit: 4193d4408f41dfe0089695082a98512d1a72e13e
Trace: REQ-004, RISK-003, REQ-005, RISK-004

Loop: run-1 on the planted regression had 3 failed; run-2 after remediation had 0 failed. Guard: accepted (source only, no test changes).

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| REQ-004 | 26 traced tests in packages/core/src/search/match.test.ts | run-1 (planted regression), 2026-11-12 | fail |
| REQ-004 | 26 traced tests in packages/core/src/search/match.test.ts | run-2 (after remediation (OFFLINE reference remediator)), 2026-11-12 | pass |
| REQ-005 | 5 traced tests in packages/core/src/search/match.test.ts | run-1 (planted regression), 2026-11-12 | pass |
| REQ-005 | 5 traced tests in packages/core/src/search/match.test.ts | run-2 (after remediation (OFFLINE reference remediator)), 2026-11-12 | pass |

## Test log

```

 RUN  v4.1.12 /agent/repos/medplum/packages/core

 ✓ |@medplum/core| src/search/match.test.ts (54 tests) 464ms

 Test Files  1 passed (1)
      Tests  54 passed (54)
   Start at  21:04:47
   Duration  1.25s (transform 192ms, setup 205ms, import 36ms, tests 464ms, environment 446ms)

JSON report written to /agent/repos/medplum/demos/verify-loop/self-test/evidence/run-2.vitest.json
EXIT:0
```
