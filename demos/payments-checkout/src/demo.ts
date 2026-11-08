// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { PromoCatalog } from './catalog';
import { checkout, withGatewayDeadline } from './checkout';
import { checkoutV214 } from './legacy-checkout';
import { GATEWAY_TIMEOUT_MS, PROMO_CALL_TIMEOUT_MS, SyntheticPromoRules } from './promo-rules';

const request = {
  sku: 'MUG-SYN',
  unitPriceCents: 2500,
  quantity: 2,
  promoCode: 'FALL20',
} as const;

function elapsedMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

const slow = new SyntheticPromoRules(GATEWAY_TIMEOUT_MS + 2_000);

console.log('Synthetic checkout (GIO-26). No real payment processor.');
console.log(
  `promo-rules latency ${slow.latencyMs}ms; v2.14 timeout ${PROMO_CALL_TIMEOUT_MS}ms; gateway ${GATEWAY_TIMEOUT_MS}ms`
);
console.log('v2.14 leaves checkout unanswered after the 3s promo timeout. Waiting for the gateway deadline.');
console.log('');

const legacyStarted = performance.now();
const legacy = await withGatewayDeadline(checkoutV214(request, slow));
const legacyMs = elapsedMs(legacyStarted);
console.log('POST /api/checkout  promo=FALL20  payments-service v2.14.0');
console.log(`  status ${legacy.status}  ${legacyMs}ms`);
console.log(`  body ${JSON.stringify(legacy.body)}`);
console.log('');

const primingClient = new SyntheticPromoRules(20);
const catalog = new PromoCatalog(primingClient, 60_000, () => Date.now());
await catalog.refresh(15_000);
primingClient.latencyMs = GATEWAY_TIMEOUT_MS + 2_000;
const callsBefore = primingClient.callCount;

const fixedStarted = performance.now();
const fixed = await withGatewayDeadline(checkout(request, catalog));
const fixedMs = elapsedMs(fixedStarted);
console.log('POST /api/checkout  promo=FALL20  cached catalog');
console.log(`  status ${fixed.status}  ${fixedMs}ms`);
console.log(`  body ${JSON.stringify(fixed.body)}`);
console.log(`  promo-rules calls during checkout: ${primingClient.callCount - callsBefore}`);
console.log('');

const plain = await withGatewayDeadline(
  checkout({ sku: request.sku, unitPriceCents: request.unitPriceCents, quantity: request.quantity }, catalog)
);
console.log('POST /api/checkout  no promo');
console.log(`  status ${plain.status}`);
console.log(`  body ${JSON.stringify(plain.body)}`);

if (legacy.status !== 502) {
  throw new Error(`expected v2.14 to return 502, got ${legacy.status}`);
}
if (fixed.status !== 200 || !('discountCents' in fixed.body) || fixed.body.discountCents !== 1000) {
  throw new Error(`expected cached checkout to discount 1000 cents, got ${JSON.stringify(fixed)}`);
}
if (fixedMs >= PROMO_CALL_TIMEOUT_MS) {
  throw new Error(`cached checkout took ${fixedMs}ms`);
}
if (plain.status !== 200 || !('discountCents' in plain.body) || plain.body.discountCents !== 0) {
  throw new Error(`expected full price without a promo, got ${JSON.stringify(plain)}`);
}
