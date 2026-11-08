# Synthetic checkout promo timeout

Demo for Jira **GIO-26**. Fictional Northwind Retail checkout. No real card data, customer, or payment processor.

`payments-service` v2.14.0 validates a promo by calling `promo-rules` on the checkout request. The call is aborted at 3 seconds and the handler does not answer. The gateway drops the open request at 10 seconds, so `POST /api/checkout` with `FALL20` returns **502 Bad Gateway**. Checkout without a promo code is unchanged.

The fixed checkout reads a promo catalog. A code that has already been loaded (including a stale entry) is applied without waiting on `promo-rules`. A cache miss waits at most 800ms and returns **503** `promo_unavailable` instead of hanging into a gateway **502**.

`FALL20` is a fabricated 20% rule (`synthetic: true`).

From the repository root:

```bash
npx vitest run --config demos/payments-checkout/vitest.config.ts
npx tsx demos/payments-checkout/src/demo.ts
```

The demo uses the real 10 second gateway deadline, so the v2.14 path takes about 10 seconds. The cached path returns immediately.
