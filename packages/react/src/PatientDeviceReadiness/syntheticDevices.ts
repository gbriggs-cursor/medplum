// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { MedplumClient } from '@medplum/core';
import type { Device, DeviceMetric, Patient, Reference } from '@medplum/fhirtypes';

// Identifier values are the fixture keys.
export const SYNTHETIC_DEVICE_IDENTIFIER_SYSTEM = 'https://example.com/medplum-synthetic-device-readiness';

export const SYNTHETIC_DEVICE_KEYS = ['bp-cuff', 'glucose-sensor', 'pulse-oximeter', 'weight-scale'] as const;

const SYNTHETIC_NOTE = 'Synthetic fixture for device readiness. Not a real device or measurement.';

export interface SyntheticLoadResult {
  readonly createdDevices: number;
  readonly createdMetrics: number;
}

interface SyntheticDevicePlan {
  readonly key: (typeof SYNTHETIC_DEVICE_KEYS)[number];
  readonly device: Device;
  readonly metric?: DeviceMetric;
}

export function buildSyntheticDeviceReadiness(patient: Reference<Patient>, now: Date): SyntheticDevicePlan[] {
  const note = { authorString: 'Synthetic fixture', text: SYNTHETIC_NOTE, time: now.toISOString() };
  const device = (
    key: SyntheticDevicePlan['key'],
    body: Omit<Device, 'resourceType' | 'identifier' | 'patient' | 'note' | 'manufacturer'>
  ): Device => ({
    resourceType: 'Device',
    manufacturer: 'Synthetic Demo',
    identifier: [{ system: SYNTHETIC_DEVICE_IDENTIFIER_SYSTEM, value: key }],
    patient,
    note: [note],
    ...body,
  });

  return [
    {
      key: 'bp-cuff',
      device: device('bp-cuff', {
        status: 'active',
        modelNumber: 'BP-100',
        serialNumber: 'SYN-BP-100',
        expirationDate: utcDate(now, 400),
        deviceName: [{ name: 'Synthetic — Home blood pressure cuff', type: 'user-friendly-name' }],
        type: { text: 'Blood pressure cuff' },
      }),
      metric: metric('bp-cuff', 'on'),
    },
    {
      key: 'glucose-sensor',
      device: device('glucose-sensor', {
        status: 'active',
        modelNumber: 'GLU-10',
        serialNumber: 'SYN-GLU-10',
        expirationDate: utcDate(now, 10),
        deviceName: [{ name: 'Synthetic — Glucose sensor', type: 'user-friendly-name' }],
        type: { text: 'Glucose sensor' },
      }),
      metric: metric('glucose-sensor', 'on'),
    },
    {
      key: 'pulse-oximeter',
      device: device('pulse-oximeter', {
        status: 'active',
        modelNumber: 'POX-2',
        serialNumber: 'SYN-POX-2',
        expirationDate: utcDate(now, 400),
        deviceName: [{ name: 'Synthetic — Pulse oximeter', type: 'user-friendly-name' }],
        type: { text: 'Pulse oximeter' },
      }),
      metric: metric('pulse-oximeter', 'off'),
    },
    {
      key: 'weight-scale',
      device: device('weight-scale', {
        status: 'unknown',
        modelNumber: 'SCL-1',
        serialNumber: 'SYN-SCL-1',
        deviceName: [{ name: 'Synthetic — Weight scale', type: 'user-friendly-name' }],
        type: { text: 'Weight scale' },
      }),
    },
  ];
}

export async function loadSyntheticDeviceReadiness(
  medplum: MedplumClient,
  patient: Patient,
  now: Date = new Date()
): Promise<SyntheticLoadResult> {
  if (!patient.id) {
    throw new Error('Patient id is required');
  }
  const patientRef: Reference<Patient> = { reference: `Patient/${patient.id}` };
  let createdDevices = 0;
  let createdMetrics = 0;

  for (const plan of buildSyntheticDeviceReadiness(patientRef, now)) {
    const identifier = `${SYNTHETIC_DEVICE_IDENTIFIER_SYSTEM}|${plan.key}`;
    let deviceId = (
      await medplum.searchOne('Device', {
        patient: patientRef.reference,
        identifier,
      })
    )?.id;
    if (!deviceId) {
      deviceId = (await medplum.createResource(plan.device)).id;
      createdDevices++;
    }
    if (!plan.metric || !deviceId) {
      continue;
    }
    const source = `Device/${deviceId}`;
    const existingMetric = await medplum.searchOne('DeviceMetric', { source, identifier });
    if (!existingMetric) {
      await medplum.createResource<DeviceMetric>({ ...plan.metric, source: { reference: source } });
      createdMetrics++;
    }
  }

  return { createdDevices, createdMetrics };
}

export function syntheticSampleComplete(devices: Device[]): boolean {
  const values = new Set(
    devices.flatMap((device) =>
      (device.identifier ?? [])
        .filter((identifier) => identifier.system === SYNTHETIC_DEVICE_IDENTIFIER_SYSTEM)
        .map((identifier) => identifier.value)
    )
  );
  return SYNTHETIC_DEVICE_KEYS.every((key) => values.has(key));
}

export function isSyntheticDevice(device: Device): boolean {
  return device.identifier?.some((identifier) => identifier.system === SYNTHETIC_DEVICE_IDENTIFIER_SYSTEM) === true;
}

export function syntheticLoadMessage(result: SyntheticLoadResult): string {
  if (result.createdDevices === 0 && result.createdMetrics === 0) {
    return 'Synthetic sample is already on this patient.';
  }
  if (result.createdDevices === 0) {
    return 'Loaded synthetic connection records.';
  }
  const noun = result.createdDevices === 1 ? 'device' : 'devices';
  return `Loaded ${result.createdDevices} synthetic ${noun}.`;
}

function metric(key: string, operationalStatus: DeviceMetric['operationalStatus']): DeviceMetric {
  return {
    resourceType: 'DeviceMetric',
    identifier: [{ system: SYNTHETIC_DEVICE_IDENTIFIER_SYSTEM, value: key }],
    type: { text: 'Synthetic connection' },
    category: 'setting',
    operationalStatus,
  };
}

function utcDate(now: Date, dayOffset: number): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dayOffset))
    .toISOString()
    .slice(0, 10);
}
