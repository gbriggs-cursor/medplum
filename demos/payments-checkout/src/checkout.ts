// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { PromoCatalog } from './catalog';
import { CHECKOUT_PROMO_BUDGET_MS, GATEWAY_TIMEOUT_MS } from './promo-rules';

export interface CheckoutRequest {
  readonly sku: string;
  readonly unitPriceCents: number;
  readonly quantity: number;
  readonly promoCode?: string;
}

export interface CheckoutSuccessBody {
  readonly orderId: string;
  readonly totalCents: number;
  readonly discountCents: number;
  readonly promoCode?: string;
  readonly synthetic: true;
}

export interface CheckoutErrorBody {
  readonly error: 'unknown_promo' | 'promo_unavailable' | 'Bad Gateway';
  readonly synthetic: true;
}

export type CheckoutResponse =
  | { readonly status: 200; readonly body: CheckoutSuccessBody }
  | { readonly status: 400 | 502 | 503; readonly body: CheckoutErrorBody };

let orderSequence = 0;

export function resetOrderSequence(): void {
  orderSequence = 0;
}

function subtotalCents(request: CheckoutRequest): number {
  return request.unitPriceCents * request.quantity;
}

function nextOrderId(): string {
  orderSequence += 1;
  return `synthetic-order-${orderSequence}`;
}

/**
 * Places an order from the promo catalog.
 * A cache miss waits at most {@link CHECKOUT_PROMO_BUDGET_MS}.
 * @param request - Cart lines and an optional promo code.
 * @param catalog - Promo rules already loaded for checkout.
 * @returns The priced order, 400 for an unknown code, or 503 when promo-rules misses the budget.
 */
export async function checkout(request: CheckoutRequest, catalog: PromoCatalog): Promise<CheckoutResponse> {
  const amount = subtotalCents(request);
  if (!request.promoCode) {
    return {
      status: 200,
      body: {
        orderId: nextOrderId(),
        totalCents: amount,
        discountCents: 0,
        synthetic: true,
      },
    };
  }

  const resolved = await catalog.resolve(request.promoCode, CHECKOUT_PROMO_BUDGET_MS);
  if (!resolved.ok) {
    return {
      status: resolved.reason === 'unknown' ? 400 : 503,
      body: {
        error: resolved.reason === 'unknown' ? 'unknown_promo' : 'promo_unavailable',
        synthetic: true,
      },
    };
  }

  const discountCents = Math.round((amount * resolved.rule.percentOff) / 100);
  return {
    status: 200,
    body: {
      orderId: nextOrderId(),
      totalCents: amount - discountCents,
      discountCents,
      promoCode: resolved.rule.code,
      synthetic: true,
    },
  };
}

/**
 * Returns the handler response, or HTTP 502 when it is still pending at {@link GATEWAY_TIMEOUT_MS}.
 * @param response - Payments-service checkout response.
 * @returns The handler response, or 502 when the gateway deadline wins.
 */
export function withGatewayDeadline(response: Promise<CheckoutResponse>): Promise<CheckoutResponse> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ status: 502, body: { error: 'Bad Gateway', synthetic: true } });
    }, GATEWAY_TIMEOUT_MS);
    response.then(
      (body) => {
        clearTimeout(timer);
        resolve(body);
      },
      () => {
        clearTimeout(timer);
        resolve({ status: 502, body: { error: 'Bad Gateway', synthetic: true } });
      }
    );
  });
}
