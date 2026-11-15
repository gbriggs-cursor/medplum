// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Observation } from '@medplum/fhirtypes';
import { describe, expect, test } from 'vitest';
import { latestBloodPressureDatesByDevice } from './deviceBloodPressure';

describe('latestBloodPressureDatesByDevice', () => {
  test('uses the latest blood-pressure date on that device', () => {
    const observations: Observation[] = [
      bloodPressure('cuff-a', { effectiveDateTime: '2026-01-01', issued: '2026-12-01' }),
      {
        resourceType: 'Observation',
        status: 'final',
        code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
        device: { reference: 'Device/cuff-a' },
        effectiveDateTime: '2026-07-01',
      },
      {
        resourceType: 'Observation',
        status: 'final',
        code: { coding: [{ system: 'http://loinc.org', code: '85354-9' }] },
        device: { reference: 'DeviceMetric/cuff-a' },
        effectiveDateTime: '2026-05-01',
      },
      {
        resourceType: 'Observation',
        status: 'final',
        code: { coding: [{ system: 'http://example.org/codes', code: '85354-9' }] },
        device: { reference: 'Device/cuff-a' },
        effectiveDateTime: '2026-08-01',
      },
      {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Blood pressure' },
        component: [
          { code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] } },
          { code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] } },
        ],
        device: { reference: 'Device/cuff-a' },
        effectivePeriod: { start: '2026-03-01', end: '2026-03-02' },
      },
      bloodPressure('cuff-b', { effectiveInstant: '2026-09-01T12:00:00.000Z' }),
      bloodPressure('cuff-d', { issued: '2024-11-14' }),
    ];

    const dates = latestBloodPressureDatesByDevice(observations);

    expect(dates.get('cuff-a')).toBe('2026-03-02');
    expect(dates.get('cuff-b')).toBe('2026-09-01T12:00:00.000Z');
    expect(dates.get('cuff-d')).toBe('2024-11-14');
  });
});

function bloodPressure(
  deviceId: string,
  when: Pick<Observation, 'effectiveDateTime' | 'effectiveInstant' | 'issued'>
): Observation {
  return {
    resourceType: 'Observation',
    status: 'final',
    code: {
      coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }],
    },
    device: { reference: `Device/${deviceId}` },
    ...when,
  };
}
