// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Patient } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import {
  SYNTHETIC_DEVICE_IDENTIFIER_SYSTEM,
  buildSyntheticDeviceReadiness,
  loadSyntheticDeviceReadiness,
} from './syntheticDevices';

const NOW = new Date('2026-11-08T15:00:00.000Z');
const PATIENT: Patient = { resourceType: 'Patient', id: 'patient-1' };

describe('synthetic device fixtures', () => {
  test('labels every sample device as synthetic', () => {
    const plans = buildSyntheticDeviceReadiness({ reference: 'Patient/patient-1' }, NOW);

    expect(plans.map((plan) => plan.device.deviceName?.[0]?.name)).toEqual([
      'Synthetic — Home blood pressure cuff',
      'Synthetic — Glucose sensor',
      'Synthetic — Pulse oximeter',
      'Synthetic — Weight scale',
    ]);
    expect(plans.every((plan) => plan.device.manufacturer === 'Synthetic Demo')).toBe(true);
    expect(plans.every((plan) => plan.device.note?.[0]?.text?.includes('Not a real device'))).toBe(true);
    expect(plans.map((plan) => plan.device.identifier?.[0])).toEqual(
      plans.map((plan) => ({ system: SYNTHETIC_DEVICE_IDENTIFIER_SYSTEM, value: plan.key }))
    );
  });

  test('loading the sample twice does not duplicate it', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource(PATIENT);

    await loadSyntheticDeviceReadiness(medplum, patient, NOW);
    const second = await loadSyntheticDeviceReadiness(medplum, patient, NOW);

    expect(second).toEqual({ createdDevices: 0, createdMetrics: 0 });
    const devices = await medplum.searchResources('Device', { patient: `Patient/${patient.id}` });
    const sourced = await Promise.all(
      devices.map((device) => medplum.searchOne('DeviceMetric', { source: `Device/${device.id}` }))
    );
    expect(devices).toHaveLength(4);
    expect(sourced.filter((metric) => metric)).toHaveLength(3);
  });
});
