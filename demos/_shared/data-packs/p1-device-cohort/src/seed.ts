// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Coding, Meta } from '@medplum/fhirtypes';

export const GENERATOR_SEED = 20261104;

export const SYNTHETIC_TAG_SYSTEM = 'https://medplum.com/fhir/CodeSystem/synthetic';

export const SYNTHETIC_TAG: Coding = {
  system: SYNTHETIC_TAG_SYSTEM,
  code: 'synthetic',
  display: 'Synthetic',
};

export const HTEST_SECURITY: Coding = {
  system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
  code: 'HTEST',
  display: 'test health data',
};

export function syntheticMeta(): Meta {
  return {
    tag: [SYNTHETIC_TAG],
    security: [HTEST_SECURITY],
  };
}

export function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
