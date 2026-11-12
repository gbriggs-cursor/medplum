Requirement: Synthetic CMP-001 is assessed as CMP-SOP-3 with reportability no and CAPA open, the disputed unpaired 90/50 mmHg sample is not confirmed, and a later paired sample still can be.
Change: demos/complaint-capa/src/display.ts and demos/complaint-capa/src/sop.ts withhold an unpaired or disputed pressure and assess CMP-001 as CMP-SOP-3.
Test: node --experimental-strip-types --test demos/complaint-capa/src/sop.test.ts demos/complaint-capa/src/display.test.ts
Result: pass (9 passed, 0 failed)
Synthetic: true
Commit: 6dcfe82bf9d9e76ea3ef1221d8d9dad52db390db

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| CMP-001 (SP-014, three pairing failures, disputed 90/50 mmHg, no injury) is assessed as CMP-SOP-3 with reportability no, CAPA open, and submittedExternally false. | CMP-001 is CMP-SOP-3, not reportable, with CAPA open | node --experimental-strip-types --test demos/complaint-capa/src/sop.test.ts demos/complaint-capa/src/display.test.ts, 2026-11-12 | pass |
| The disputed 90/50 mmHg sample taken while unpaired is not the confirmed display. | CMP-001 does not confirm 90/50 mmHg taken after pairing failed | node --experimental-strip-types --test demos/complaint-capa/src/sop.test.ts demos/complaint-capa/src/display.test.ts, 2026-11-12 | pass |
| A later paired sample in that sitting remains the confirmed display. | a later paired reading remains the confirmed display | node --experimental-strip-types --test demos/complaint-capa/src/sop.test.ts demos/complaint-capa/src/display.test.ts, 2026-11-12 | pass |

## Test log

```text
TAP version 13
# Subtest: CMP-001 does not confirm 90/50 mmHg taken after pairing failed
ok 1 - CMP-001 does not confirm 90/50 mmHg taken after pairing failed
  ---
  duration_ms: 0.542323
  type: 'test'
  ...
# Subtest: a later paired reading remains the confirmed display
ok 2 - a later paired reading remains the confirmed display
  ---
  duration_ms: 0.250902
  type: 'test'
  ...
# Subtest: an unpaired sample is withheld when the subject did not dispute it
ok 3 - an unpaired sample is withheld when the subject did not dispute it
  ---
  duration_ms: 0.08111
  type: 'test'
  ...
# Subtest: a paired sample is withheld when the subject disputed it
ok 4 - a paired sample is withheld when the subject disputed it
  ---
  duration_ms: 0.077078
  type: 'test'
  ...
# Subtest: CMP-001 is CMP-SOP-3, not reportable, with CAPA open
ok 5 - CMP-001 is CMP-SOP-3, not reportable, with CAPA open
  ---
  duration_ms: 1.123003
  type: 'test'
  ...
# Subtest: a pairing-only complaint stays on CMP-SOP-4 and does not open a CAPA
ok 6 - a pairing-only complaint stays on CMP-SOP-4 and does not open a CAPA
  ---
  duration_ms: 0.131103
  type: 'test'
  ...
# Subtest: a death allegation matches CMP-SOP-1 before a disputed measurement
ok 7 - a death allegation matches CMP-SOP-1 before a disputed measurement
  ---
  duration_ms: 0.0868
  type: 'test'
  ...
# Subtest: a serious injury matches CMP-SOP-2 when no death is alleged
ok 8 - a serious injury matches CMP-SOP-2 when no death is alleged
  ---
  duration_ms: 0.078264
  type: 'test'
  ...
# Subtest: a disputed measurement with no malfunction matches no section
ok 9 - a disputed measurement with no malfunction matches no section
  ---
  duration_ms: 0.27233
  type: 'test'
  ...
1..9
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 77.064745
EXIT:0
```
