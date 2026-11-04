// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { createReference } from '@medplum/core';
import type { Device, Observation } from '@medplum/fhirtypes';
import {
  LOINC_DIASTOLIC,
  LOINC_SYSTOLIC,
  buildBloodPressureSeries,
  getComponentValue,
  getThirtyDayDateParam,
  isWithinLastThirtyDays,
  observationsForDevice,
} from './Devices.utils';

const device: Device = { resourceType: 'Device', id: 'cuff-1' };
const otherDevice: Device = { resourceType: 'Device', id: 'scale-1' };

function bpObservation(overrides: Partial<Observation> = {}): Observation {
  return {
    resourceType: 'Observation',
    id: 'obs-1',
    status: 'final',
    code: { text: 'Blood Pressure' },
    device: createReference(device),
    effectiveDateTime: '2026-11-02T08:00:00Z',
    component: [
      {
        code: { coding: [{ system: 'http://loinc.org', code: LOINC_DIASTOLIC }] },
        valueQuantity: { value: 78, unit: 'mm[Hg]' },
      },
      {
        code: { coding: [{ system: 'http://loinc.org', code: LOINC_SYSTOLIC }] },
        valueQuantity: { value: 122, unit: 'mm[Hg]' },
      },
    ],
    ...overrides,
  };
}

describe('Devices.utils', () => {
  test('reads systolic and diastolic by LOINC, not component order', () => {
    const observation = bpObservation();
    expect(getComponentValue(observation, LOINC_SYSTOLIC)).toBe(122);
    expect(getComponentValue(observation, LOINC_DIASTOLIC)).toBe(78);
  });

  test('keeps only observations linked through Observation.device', () => {
    const linked = bpObservation({ id: 'linked' });
    const unlinked = bpObservation({ id: 'unlinked', device: createReference(otherDevice) });
    expect(observationsForDevice([linked, unlinked], device).map((item) => item.id)).toEqual(['linked']);
  });

  test('30-day window is inclusive of the cutoff and excludes older readings', () => {
    const now = new Date('2026-11-04T12:00:00Z');
    expect(getThirtyDayDateParam(now)).toBe('2026-10-05');
    expect(isWithinLastThirtyDays('2026-10-05T12:00:00Z', now)).toBe(true);
    expect(isWithinLastThirtyDays('2026-10-05T11:59:59Z', now)).toBe(false);
    expect(isWithinLastThirtyDays(undefined, now)).toBe(false);
  });

  test('builds chart series from matching blood pressure components', () => {
    const series = buildBloodPressureSeries([
      bpObservation({
        effectiveDateTime: '2026-11-01T08:00:00Z',
        component: [
          {
            code: { coding: [{ code: LOINC_SYSTOLIC }] },
            valueQuantity: { value: 130 },
          },
          {
            code: { coding: [{ code: LOINC_DIASTOLIC }] },
            valueQuantity: { value: 85 },
          },
        ],
      }),
    ]);
    expect(series.systolic).toEqual([130]);
    expect(series.diastolic).toEqual([85]);
    expect(series.labels).toHaveLength(1);
  });
});
