// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Observation } from '@medplum/fhirtypes';
import { CODES, RHYTHMS } from './cohort';
import type { EcgSummary } from './ecg';
import { decodeSampledData, detectRPeaks, formatEcgSummary, parseEcgSummary } from './ecg';
import { bundleResources, readBundle } from './load';

function ecgObservations(): Observation[] {
  return bundleResources(readBundle()).filter(
    (r): r is Observation => r.resourceType === 'Observation' && r.code?.coding?.[0]?.code === CODES.ecg.code
  );
}

describe('REQ-001 ECG summary parser', () => {
  test('summarizes every synthetic ECG, with waveform-derived heart rate matching the reported rate', () => {
    const ecgs = ecgObservations();
    expect(ecgs).toHaveLength(20);

    for (const obs of ecgs) {
      const summary = parseEcgSummary(obs);
      const label = `Observation/${obs.id}`;
      const af = summary.rhythm === RHYTHMS.atrialFibrillation.display;

      expect(summary.waveform?.samplingRateHz, label).toBe(250);
      expect(summary.waveform?.durationSeconds, label).toBe(10);
      expect(summary.waveform?.validSampleCount, label).toBe(2500);
      expect(summary.waveform?.maxMv, label).toBeGreaterThan(0.9);
      expect(
        Math.abs((summary.waveform?.derivedHeartRate as number) - (summary.heartRate as number)),
        label
      ).toBeLessThanOrEqual(3);
      expect(summary.flags, label).not.toContain('heart-rate-mismatch');
      expect(summary.flags.includes('irregular-rhythm'), label).toBe(af);
      expect(summary.prInterval === undefined, label).toBe(af);
      expect(summary.flags.includes('tachycardia'), label).toBe((summary.heartRate as number) > 100);
      expect(summary.flags.includes('prolonged-qtc'), label).toBe((summary.qtcInterval as number) > 460);
    }
    const summaries = ecgs.map(parseEcgSummary);
    expect(summaries.filter((s) => s.flags.includes('irregular-rhythm')).length).toBeGreaterThan(0);
    const normal = summaries.find((s) => s.rhythm === RHYTHMS.sinus.display && s.flags.length === 0);
    expect(formatEcgSummary(normal as EcgSummary)).toBe(
      `HR ${normal?.heartRate} /min, PR ${normal?.prInterval} ms, QRS ${normal?.qrsDuration} ms, QTc ${normal?.qtcInterval} ms, Normal sinus rhythm`
    );
  });

  test('decodes SampledData edge cases and detects R peaks on a hand-built trace', () => {
    expect(
      decodeSampledData({ origin: { value: 1 }, period: 4, dimensions: 1, factor: 0.5, data: ' 2 E -4  L U 0 ' })
    ).toEqual([2, undefined, -1, undefined, undefined, 1]);
    expect(decodeSampledData({ origin: { value: 0 }, period: 4, dimensions: 2, data: '1 10 2 20 3 30' }, 1)).toEqual([
      10, 20, 30,
    ]);
    expect(decodeSampledData({ origin: { value: 0 }, period: 4, dimensions: 1 })).toEqual([]);
    expect(() => decodeSampledData({ origin: { value: 0 }, period: 4, dimensions: 1, data: '1 x' })).toThrow(
      'Invalid SampledData token'
    );
    expect(() => decodeSampledData({ origin: { value: 0 }, period: 4, dimensions: 0 })).toThrow('dimensions');
    expect(() => decodeSampledData({ origin: { value: 0 }, period: 4, dimensions: 1 }, 1)).toThrow('out of range');

    // Peaks at samples 10, 110, 210 (4 ms period: 400 ms RR), a T-wave bump, and a refractory double-hit.
    const trace: (number | undefined)[] = Array.from({ length: 260 }, () => 0);
    for (const p of [10, 110, 210]) {
      trace[p - 1] = 0.6;
      trace[p] = 1.2;
      trace[p + 1] = 0.6;
      trace[p + 40] = 0.3;
    }
    trace[115] = 0.9;
    trace[150] = undefined;
    expect(detectRPeaks(trace, 4)).toEqual([10, 110, 210]);
    trace[218] = 1.3;
    expect(detectRPeaks(trace, 4)).toEqual([10, 110, 218]);
    expect(detectRPeaks([], 4)).toEqual([]);
    expect(detectRPeaks([0.1, 0.1, 0.1], 4)).toEqual([]);
  });

  test('handles a minimal ECG without waveform, flags abnormal values, and rejects non-ECG input', () => {
    const minimal: Observation = {
      resourceType: 'Observation',
      id: 'synthetic-minimal',
      status: 'final',
      code: { coding: [CODES.ecg] },
      component: [
        { code: { coding: [CODES.heartRate] }, valueQuantity: { value: 48, unit: '/min' } },
        { code: { coding: [CODES.qtcInterval] }, valueQuantity: { value: 480, unit: 'ms' } },
        { code: { coding: [CODES.rhythm] }, valueCodeableConcept: { coding: [RHYTHMS.sinusBradycardia] } },
      ],
    };
    const summary = parseEcgSummary(minimal);
    expect(summary.waveform).toBeUndefined();
    expect(summary.flags).toEqual(['bradycardia', 'prolonged-qtc', 'no-waveform']);
    expect(formatEcgSummary(summary)).toBe(
      'HR 48 /min, QTc 480 ms, Sinus bradycardia, flags: bradycardia, prolonged-qtc, no-waveform'
    );

    const mismatched = ecgObservations()[0];
    const tampered: Observation = {
      ...mismatched,
      component: mismatched.component?.map((c) =>
        c.code.coding?.[0]?.code === CODES.heartRate.code ? { ...c, valueQuantity: { value: 200, unit: '/min' } } : c
      ),
    };
    expect(parseEcgSummary(tampered).flags).toContain('heart-rate-mismatch');

    expect(() =>
      parseEcgSummary({ resourceType: 'Observation', status: 'final', code: { coding: [CODES.bpPanel] } })
    ).toThrow('Not an ECG Observation');
    expect(() =>
      parseEcgSummary({
        ...minimal,
        component: [
          { code: { coding: [CODES.leadI] }, valueSampledData: { origin: { value: 0 }, period: 0, dimensions: 1 } },
        ],
      })
    ).toThrow('Invalid SampledData period');
  });
});
