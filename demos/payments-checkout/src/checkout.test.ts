// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { PromoCatalog } from './catalog';
import { checkout, resetOrderSequence, withGatewayDeadline } from './checkout';
import { checkoutV214 } from './legacy-checkout';
import {
  CHECKOUT_PROMO_BUDGET_MS,
  GATEWAY_TIMEOUT_MS,
  PROMO_CALL_TIMEOUT_MS,
  SyntheticPromoRules,
} from './promo-rules';

const MUG = { sku: 'MUG-SYN', unitPriceCents: 2500, quantity: 2 } as const;
const TTL_MS = 60_000;
const PRIME_LATENCY_MS = 10;
const LOAD_LATENCY_MS = 12_000;

describe('checkout promo validation', () => {
  beforeEach(() => {
    resetOrderSequence();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-08T16:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('places the discounted order when promo-rules is slower than 3 seconds', async () => {
    const rules = new SyntheticPromoRules(PRIME_LATENCY_MS);
    const catalog = new PromoCatalog(rules, TTL_MS, () => Date.now());
    const priming = catalog.refresh(15_000);
    await vi.advanceTimersByTimeAsync(PRIME_LATENCY_MS);
    await priming;

    rules.latencyMs = LOAD_LATENCY_MS;
    const callsAfterPrime = rules.callCount;
    const result = await withGatewayDeadline(checkout({ ...MUG, promoCode: 'FALL20' }, catalog));

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      totalCents: 4000,
      discountCents: 1000,
      promoCode: 'FALL20',
      synthetic: true,
    });
    expect(rules.callCount).toBe(callsAfterPrime);
    expect(vi.getTimerCount()).toBe(0);
  });

  test('places the discounted order when a cache miss returns within the budget', async () => {
    const rules = new SyntheticPromoRules(PRIME_LATENCY_MS);
    const catalog = new PromoCatalog(rules, TTL_MS, () => Date.now());
    const pending = withGatewayDeadline(checkout({ ...MUG, promoCode: 'FALL20' }, catalog));

    await vi.advanceTimersByTimeAsync(PRIME_LATENCY_MS);
    const result = await pending;

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ totalCents: 4000, discountCents: 1000, promoCode: 'FALL20' });
    expect(rules.callCount).toBe(1);
  });

  test('places a full-price order without calling promo-rules', async () => {
    const rules = new SyntheticPromoRules(LOAD_LATENCY_MS);
    const catalog = new PromoCatalog(rules, TTL_MS, () => Date.now());

    const result = await withGatewayDeadline(checkout(MUG, catalog));

    expect(result).toEqual({
      status: 200,
      body: {
        orderId: 'synthetic-order-1',
        totalCents: 5000,
        discountCents: 0,
        synthetic: true,
      },
    });
    expect(rules.callCount).toBe(0);
  });

  test('returns 503 when an uncached promo-rules call exceeds the checkout budget', async () => {
    const rules = new SyntheticPromoRules(LOAD_LATENCY_MS);
    const catalog = new PromoCatalog(rules, TTL_MS, () => Date.now());
    const pending = withGatewayDeadline(checkout({ ...MUG, promoCode: 'FALL20' }, catalog));

    await vi.advanceTimersByTimeAsync(CHECKOUT_PROMO_BUDGET_MS);
    const result = await pending;

    expect(result).toEqual({
      status: 503,
      body: { error: 'promo_unavailable', synthetic: true },
    });
  });

  test('applies a stale cached promo while promo-rules is slow', async () => {
    const rules = new SyntheticPromoRules(PRIME_LATENCY_MS);
    const catalog = new PromoCatalog(rules, TTL_MS, () => Date.now());
    const priming = catalog.refresh(15_000);
    await vi.advanceTimersByTimeAsync(PRIME_LATENCY_MS);
    await priming;

    rules.latencyMs = LOAD_LATENCY_MS;
    vi.setSystemTime(Date.now() + TTL_MS);
    const result = await withGatewayDeadline(checkout({ ...MUG, promoCode: 'FALL20' }, catalog));

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ discountCents: 1000, promoCode: 'FALL20' });
    await vi.advanceTimersByTimeAsync(CHECKOUT_PROMO_BUDGET_MS);
  });

  test('returns 400 for an unknown promo code', async () => {
    const rules = new SyntheticPromoRules(PRIME_LATENCY_MS);
    const catalog = new PromoCatalog(rules, TTL_MS, () => Date.now());
    const pending = withGatewayDeadline(checkout({ ...MUG, promoCode: 'NOT-A-CODE' }, catalog));

    await vi.advanceTimersByTimeAsync(PRIME_LATENCY_MS);
    const result = await pending;

    expect(result).toEqual({
      status: 400,
      body: { error: 'unknown_promo', synthetic: true },
    });
  });

  test('v2.14 sync validation returns 502 when promo-rules exceeds 3 seconds', async () => {
    const rules = new SyntheticPromoRules(LOAD_LATENCY_MS);
    let settled = false;
    const pending = withGatewayDeadline(checkoutV214({ ...MUG, promoCode: 'FALL20' }, rules)).then((value) => {
      settled = true;
      return value;
    });

    await vi.advanceTimersByTimeAsync(PROMO_CALL_TIMEOUT_MS);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(GATEWAY_TIMEOUT_MS - PROMO_CALL_TIMEOUT_MS);
    const result = await pending;

    expect(settled).toBe(true);
    expect(result).toEqual({
      status: 502,
      body: { error: 'Bad Gateway', synthetic: true },
    });
  });
});
