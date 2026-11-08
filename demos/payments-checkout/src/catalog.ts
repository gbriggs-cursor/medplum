// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { PromoRule, PromoRulesClient } from './promo-rules';
import { PromoTimeoutError } from './promo-rules';

export type PromoResolution =
  { readonly ok: true; readonly rule: PromoRule } | { readonly ok: false; readonly reason: 'unknown' | 'unavailable' };

interface CacheEntry {
  readonly rule: PromoRule;
  readonly freshUntil: number;
}

/**
 * A cached code is returned after its TTL so a slow refresh cannot hold checkout open until the gateway times out.
 */
export class PromoCatalog {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly client: PromoRulesClient;
  private readonly ttlMs: number;
  private readonly now: () => number;
  private refreshing: Promise<void> | undefined;

  constructor(client: PromoRulesClient, ttlMs: number, now: () => number) {
    this.client = client;
    this.ttlMs = ttlMs;
    this.now = now;
  }

  async refresh(timeoutMs: number): Promise<void> {
    const rules = await this.client.list(timeoutMs);
    const freshUntil = this.now() + this.ttlMs;
    for (const rule of rules) {
      this.entries.set(rule.code, { rule, freshUntil });
    }
  }

  async resolve(code: string, budgetMs: number): Promise<PromoResolution> {
    const cached = this.entries.get(code);
    if (cached) {
      if (this.now() >= cached.freshUntil) {
        this.revalidate(budgetMs);
      }
      return { ok: true, rule: cached.rule };
    }
    try {
      const rule = await this.client.lookup(code, budgetMs);
      if (!rule) {
        return { ok: false, reason: 'unknown' };
      }
      this.entries.set(code, { rule, freshUntil: this.now() + this.ttlMs });
      return { ok: true, rule };
    } catch (err) {
      if (err instanceof PromoTimeoutError) {
        return { ok: false, reason: 'unavailable' };
      }
      throw err;
    }
  }

  private revalidate(timeoutMs: number): void {
    if (this.refreshing) {
      return;
    }
    this.refreshing = this.refresh(timeoutMs).then(
      () => {
        this.refreshing = undefined;
      },
      () => {
        this.refreshing = undefined;
      }
    );
  }
}
