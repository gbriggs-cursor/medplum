Requirement: A synthetic checkout with promo code FALL20 places the order with the discount applied when promo-rules is slower than its 3 second timeout.
Change: demos/payments-checkout — promo catalog so FALL20 checkout does not wait on promo-rules.
Test: npx vitest run --config demos/payments-checkout/vitest.config.ts --reporter=verbose --no-color
Result: pass (7 passed, 0 failed)
Synthetic: true
Commit: 671d9878d8673960b4d440a97d998c4ecc5724b4

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| A synthetic checkout with promo code FALL20 places the order with the discount applied when promo-rules is slower than its 3 second timeout. | places the discounted order when promo-rules is slower than 3 seconds | npx vitest run --config demos/payments-checkout/vitest.config.ts --reporter=verbose --no-color, 2026-11-08 | pass |
| A synthetic checkout with no promo code places the order and does not call promo-rules. | places a full-price order without calling promo-rules | npx vitest run --config demos/payments-checkout/vitest.config.ts --reporter=verbose --no-color, 2026-11-08 | pass |
| An uncached promo-rules call that exceeds the checkout budget returns HTTP 503 instead of HTTP 502. | returns 503 when an uncached promo-rules call exceeds the checkout budget | npx vitest run --config demos/payments-checkout/vitest.config.ts --reporter=verbose --no-color, 2026-11-08 | pass |

## Test log

```text

 RUN  v4.1.12 /agent/repos/medplum/demos/payments-checkout

 ✓ |payments-checkout| src/checkout.test.ts > checkout promo validation > places the discounted order when promo-rules is slower than 3 seconds 4ms
 ✓ |payments-checkout| src/checkout.test.ts > checkout promo validation > places the discounted order when a cache miss returns within the budget 1ms
 ✓ |payments-checkout| src/checkout.test.ts > checkout promo validation > places a full-price order without calling promo-rules 1ms
 ✓ |payments-checkout| src/checkout.test.ts > checkout promo validation > returns 503 when an uncached promo-rules call exceeds the checkout budget 1ms
 ✓ |payments-checkout| src/checkout.test.ts > checkout promo validation > applies a stale cached promo while promo-rules is slow 1ms
 ✓ |payments-checkout| src/checkout.test.ts > checkout promo validation > returns 400 for an unknown promo code 1ms
 ✓ |payments-checkout| src/checkout.test.ts > checkout promo validation > v2.14 sync validation returns 502 when promo-rules exceeds 3 seconds 1ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  16:42:00
   Duration  152ms (transform 39ms, setup 0ms, import 51ms, tests 10ms, environment 0ms)

EXIT:0
```
