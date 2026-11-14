// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { expandSampledData } from '@medplum/core';
import type { Observation } from '@medplum/fhirtypes';
import { parseEcgSummary } from './ecg-summary-parser';

const SAMPLES = [0.1, -0.4, 0.8, 0.2];

function ecgObservation(): Observation {
  return {
    resourceType: 'Observation',
    status: 'final',
    code: { text: 'ECG summary' },
    component: [
      {
        code: { coding: [{ display: 'MDC_ECG_ELEC_POTL_I' }] },
        valueSampledData: {
          origin: { value: 0, unit: 'mV' },
          period: 8,
          dimensions: 1,
          data: SAMPLES.join(' '),
        },
      },
    ],
  };
}

test('parseEcgSummary reads component valueSampledData', () => {
  const summary = parseEcgSummary(ecgObservation());
  const samples = expandSampledData(ecgObservation().component?.[0].valueSampledData as never);

  expect(summary).toStrictEqual({
    sampleCount: 4,
    min: Math.min(...samples),
    max: Math.max(...samples),
    mean: samples.reduce((sum, value) => sum + value, 0) / samples.length,
    periodMs: 8,
    durationMs: 32,
    unit: 'mV',
    lead: 'MDC_ECG_ELEC_POTL_I',
  });
});

test('parseEcgSummary throws when sampled data is missing', () => {
  expect(() =>
    parseEcgSummary({
      resourceType: 'Observation',
      status: 'final',
      code: { text: 'ECG summary' },
    })
  ).toThrow('Observation has no valueSampledData');
});
