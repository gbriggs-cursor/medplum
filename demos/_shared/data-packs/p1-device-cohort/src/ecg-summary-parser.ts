// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { expandSampledData } from '@medplum/core';
import type { Observation, SampledData } from '@medplum/fhirtypes';

export interface EcgSummary {
  sampleCount: number;
  min: number;
  max: number;
  mean: number;
  periodMs: number;
  durationMs: number;
  unit?: string;
  lead?: string;
}

export function parseEcgSummary(obs: Observation): EcgSummary {
  const sampled = findSampledData(obs);
  if (!sampled?.data) {
    throw new Error('Observation has no valueSampledData');
  }

  const samples = expandSampledData(sampled);
  if (samples.length === 0 || samples.some((value) => Number.isNaN(value))) {
    throw new Error('Observation has no valueSampledData');
  }

  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const periodMs = sampled.period ?? 0;

  return {
    sampleCount: samples.length,
    min,
    max,
    mean,
    periodMs,
    durationMs: periodMs * samples.length,
    unit: sampled.origin?.unit,
    lead: obs.component?.find((component) => component.valueSampledData)?.code?.coding?.[0]?.display,
  };
}

function findSampledData(obs: Observation): SampledData | undefined {
  if (obs.valueSampledData?.data) {
    return obs.valueSampledData;
  }
  return obs.component?.find((component) => component.valueSampledData?.data)?.valueSampledData;
}
