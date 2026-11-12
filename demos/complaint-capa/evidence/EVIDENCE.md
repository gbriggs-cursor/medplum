Requirement: CMP-SOP-3 opens synthetic CAPA-001 for complaint CMP-001 as ready-for-review, with reportability no and no external submission.
Change: demos/complaint-capa — CMP-SOP-3 opens CAPA-001 from the synthetic CMP-001 seed.
Test: npm test --prefix demos/complaint-capa
Result: pass (7 passed, 0 failed)
Synthetic: true
Commit: c87a6ca36ba5f569dc894f0533df52dee58f49b4

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| CMP-SOP-3 opens synthetic CAPA-001 for complaint CMP-001 as ready-for-review, with reportability no and no external submission. | opens CAPA-001 for CMP-001 under CMP-SOP-3 without waiting or submitting | npm test --prefix demos/complaint-capa, 2026-11-12 | pass |
| A pairing-failure-only complaint does not open a CAPA. | does not open a CAPA when the complaint is a pairing failure only | npm test --prefix demos/complaint-capa, 2026-11-12 | pass |
| A death allegation matches CMP-SOP-1 and does not open this CAPA. | matches CMP-SOP-1 before CMP-SOP-3 when a death is alleged | npm test --prefix demos/complaint-capa, 2026-11-12 | pass |
| A serious-injury allegation matches CMP-SOP-2 and does not open this CAPA. | matches CMP-SOP-2 before CMP-SOP-3 when a serious injury is alleged | npm test --prefix demos/complaint-capa, 2026-11-12 | pass |
| A disputed measurement with no malfunction alleged does not match CMP-SOP-3. | does not apply CMP-SOP-3 when no malfunction is alleged | npm test --prefix demos/complaint-capa, 2026-11-12 | pass |
| A complaint that is not synthetic is refused. | refuses a complaint that is not synthetic htest data ({ synthetic: false, htest: true }) | npm test --prefix demos/complaint-capa, 2026-11-12 | pass |
| A complaint that is not htest data is refused. | refuses a complaint that is not synthetic htest data ({ synthetic: true, htest: false }) | npm test --prefix demos/complaint-capa, 2026-11-12 | pass |

## Test log

```text

> @medplum/complaint-capa-demo@5.2.14 test
> vitest run


 RUN  v4.1.12 /agent/repos/medplum/demos/complaint-capa


 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  16:36:19
   Duration  141ms (transform 39ms, setup 0ms, import 52ms, tests 6ms, environment 0ms)

EXIT:0
```
