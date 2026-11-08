// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

/** Configured promo-rules deadline in payments-service v2.14.0. */
export const PROMO_CALL_TIMEOUT_MS = 3_000;

/** Gateway drops an unanswered checkout after this long. The client then sees HTTP 502. */
export const GATEWAY_TIMEOUT_MS = 10_000;

/** Shorter than the 3s promo-rules timeout and the gateway deadline, so a miss cannot become a 502. */
export const CHECKOUT_PROMO_BUDGET_MS = 800;

export interface PromoRule {
  readonly code: string;
  readonly percentOff: number;
  readonly synthetic: true;
}

/** Fictional catalog. Not a live promotion. */
export const SYNTHETIC_PROMOS: readonly PromoRule[] = [{ code: 'FALL20', percentOff: 20, synthetic: true }];

export class PromoTimeoutError extends Error {
  readonly code: string;
  readonly timeoutMs: number;

  constructor(code: string, timeoutMs: number) {
    super(`promo-rules timed out after ${timeoutMs}ms for ${code}`);
    this.name = 'PromoTimeoutError';
    this.code = code;
    this.timeoutMs = timeoutMs;
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export interface PromoRulesClient {
  lookup(code: string, timeoutMs: number): Promise<PromoRule | undefined>;
  list(timeoutMs: number): Promise<readonly PromoRule[]>;
}

export class SyntheticPromoRules implements PromoRulesClient {
  callCount = 0;
  latencyMs: number;
  private readonly rules: readonly PromoRule[];

  constructor(latencyMs: number, rules: readonly PromoRule[] = SYNTHETIC_PROMOS) {
    this.latencyMs = latencyMs;
    this.rules = rules;
  }

  lookup(code: string, timeoutMs: number): Promise<PromoRule | undefined> {
    return this.timed(timeoutMs, code, () => this.rules.find((rule) => rule.code === code));
  }

  list(timeoutMs: number): Promise<readonly PromoRule[]> {
    return this.timed(timeoutMs, '*', () => this.rules);
  }

  private timed<T>(timeoutMs: number, code: string, read: () => T): Promise<T> {
    this.callCount += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return delay(this.latencyMs, controller.signal).then(
      () => {
        clearTimeout(timer);
        return read();
      },
      (err: unknown) => {
        clearTimeout(timer);
        if (controller.signal.aborted) {
          throw new PromoTimeoutError(code, timeoutMs);
        }
        throw err;
      }
    );
  }
}
