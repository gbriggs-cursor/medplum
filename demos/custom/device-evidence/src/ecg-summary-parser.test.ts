// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Observation, SampledData } from '@medplum/fhirtypes';
import { isEcgObservation, parseEcgSummary, parseSampledData } from './ecg-summary-parser';
import { ingestBundle } from './ingest';

describe('ECG summary parser', () => {
  test('parses SampledData including special tokens', () => {
    const sampled: SampledData = {
      origin: { value: 0, unit: 'mV' },
      period: 4,
      dimensions: 1,
      data: '0.1 0.2 E L U -0.3',
    };
    const parsed = parseSampledData(sampled);
    expect(parsed?.samples).toHaveLength(6);
    expect(parsed?.samples[0]).toBe(0.1);
    expect(parsed?.samples[2]).toBeNaN();
    expect(parsed?.periodMs).toBe(4);
  });

  test('rejects invalid SampledData tokens', () => {
    expect(() =>
      parseSampledData({
        origin: { value: 0, unit: 'mV' },
        period: 4,
        dimensions: 1,
        data: '0.1 not-a-number',
      })
    ).toThrow(/Invalid SampledData token/);
  });

  test('loads the synthetic bundle and parses every ECG observation', async () => {
    const medplum = await ingestBundle();
    const observations = await medplum.searchResources('Observation', { code: '11524-6', _count: '50' });
    expect(observations).toHaveLength(20);

    for (const obs of observations) {
      expect(isEcgObservation(obs)).toBe(true);
      const summary = parseEcgSummary(obs);
      expect(summary.synthetic).toBe(true);
      expect(summary.patientRef).toMatch(/^Patient\/acme-cardio-patient-\d{2}$/);
      expect(summary.deviceRef).toMatch(/^Device\/acme-cardio-device-\d{2}$/);
      expect(summary.heartRate).toBeGreaterThan(50);
      expect(summary.prIntervalMs).toBeGreaterThan(100);
      expect(summary.sampled?.samples.length).toBe(250);
      expect(summary.componentSampled?.samples.length).toBe(250);
      expect(summary.interpretation).toBeTruthy();
    }
  });

  test('rejects non-ECG observations', () => {
    const bp: Observation = {
      resourceType: 'Observation',
      id: 'not-ecg',
      status: 'final',
      code: { coding: [{ code: '85354-9' }] },
    };
    expect(isEcgObservation(bp)).toBe(false);
    expect(() => parseEcgSummary(bp)).toThrow(/not an EKG study/);
  });
});
