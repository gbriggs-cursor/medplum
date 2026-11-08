// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { CheckoutRequest, CheckoutResponse } from './checkout';
import type { PromoRulesClient } from './promo-rules';
import { PROMO_CALL_TIMEOUT_MS, PromoTimeoutError } from './promo-rules';

function subtotalCents(request: CheckoutRequest): number {
  return request.unitPriceCents * request.quantity;
}

/**
 * payments-service v2.14.0 checkout.
 * After the 3s promo-rules abort this promise never settles, so the caller must apply the gateway deadline.
 * @param request - Cart lines and an optional promo code.
 * @param rules - promo-rules client.
 * @returns The order, or a promise that does not settle when promo-rules times out.
 */
export async function checkoutV214(request: CheckoutRequest, rules: PromoRulesClient): Promise<CheckoutResponse> {
  const amount = subtotalCents(request);
  if (!request.promoCode) {
    return {
      status: 200,
      body: { orderId: 'synthetic-order-legacy', totalCents: amount, discountCents: 0, synthetic: true },
    };
  }

  try {
    const rule = await rules.lookup(request.promoCode, PROMO_CALL_TIMEOUT_MS);
    if (!rule) {
      return { status: 400, body: { error: 'unknown_promo', synthetic: true } };
    }
    const discountCents = Math.round((amount * rule.percentOff) / 100);
    return {
      status: 200,
      body: {
        orderId: 'synthetic-order-legacy',
        totalCents: amount - discountCents,
        discountCents,
        promoCode: rule.code,
        synthetic: true,
      },
    };
  } catch (err) {
    if (err instanceof PromoTimeoutError) {
      return new Promise(() => {});
    }
    throw err;
  }
}
