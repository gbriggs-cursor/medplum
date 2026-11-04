// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { createReference } from '@medplum/core';
import type { Device, Observation, Patient } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react-hooks';
import { act, render, screen } from '../test-utils/render';
import { PatientDevices } from './PatientDevices';
import { LOINC_DIASTOLIC, LOINC_SYSTOLIC } from './PatientDevices.utils';

const SYNTHETIC_TAG = {
  system: 'https://medplum.com/fhir/CodeSystem/synthetic',
  code: 'synthetic',
  display: 'Synthetic',
};

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function bloodPressure(
  device: Device,
  patient: Patient,
  effectiveDateTime: string,
  systolic: number,
  diastolic: number
): Observation {
  return {
    resourceType: 'Observation',
    meta: { tag: [SYNTHETIC_TAG] },
    status: 'final',
    code: {
      coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }],
      text: 'Blood pressure',
    },
    subject: createReference(patient),
    effectiveDateTime,
    device: createReference(device),
    component: [
      {
        code: { coding: [{ system: 'http://loinc.org', code: LOINC_SYSTOLIC, display: 'Systolic blood pressure' }] },
        valueQuantity: { value: systolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
      },
      {
        code: { coding: [{ system: 'http://loinc.org', code: LOINC_DIASTOLIC, display: 'Diastolic blood pressure' }] },
        valueQuantity: { value: diastolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
      },
    ],
  };
}

describe('PatientDevices', () => {
  async function setup(patient: Patient, medplum = new MockClient()): Promise<MockClient> {
    await act(async () => {
      render(
        <MedplumProvider medplum={medplum}>
          <PatientDevices patient={patient} />
        </MedplumProvider>
      );
    });
    return medplum;
  }

  test('Empty state when the patient has no devices', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      meta: { tag: [SYNTHETIC_TAG] },
      name: [{ given: ['Taylor'], family: 'Demo' }],
    });

    await setup(patient, medplum);
    expect(await screen.findByText('No devices connected for this patient')).toBeInTheDocument();
  });

  test('Lists a blood pressure cuff and charts 30-day systolic and diastolic readings', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      meta: { tag: [SYNTHETIC_TAG] },
      name: [{ given: ['Taylor'], family: 'Demo' }],
    });
    const device = await medplum.createResource<Device>({
      resourceType: 'Device',
      meta: { tag: [SYNTHETIC_TAG] },
      status: 'active',
      deviceName: [{ name: 'Omron 5 Series Upper Arm', type: 'user-friendly-name' }],
      type: { text: 'Home blood pressure monitor' },
      patient: createReference(patient),
    });
    await medplum.createResource(bloodPressure(device, patient, daysAgo(10), 128, 82));
    await medplum.createResource(bloodPressure(device, patient, daysAgo(2), 118, 76));

    await setup(patient, medplum);

    expect(await screen.findByText('Omron 5 Series Upper Arm')).toBeInTheDocument();
    expect(screen.getByText('Home blood pressure monitor')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('118 / 76 mmHg')).toBeInTheDocument();
    expect(screen.getByText('Systolic')).toBeInTheDocument();
    expect(screen.getByText('Diastolic')).toBeInTheDocument();
    expect(screen.queryByText('160 / 100 mmHg')).not.toBeInTheDocument();
  });

  test('Device without recent readings shows an empty chart message', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      meta: { tag: [SYNTHETIC_TAG] },
      name: [{ given: ['Taylor'], family: 'Demo' }],
    });
    const device = await medplum.createResource<Device>({
      resourceType: 'Device',
      meta: { tag: [SYNTHETIC_TAG] },
      status: 'inactive',
      deviceName: [{ name: 'Unused cuff', type: 'user-friendly-name' }],
      type: { text: 'Home blood pressure monitor' },
      patient: createReference(patient),
    });
    await medplum.createResource(bloodPressure(device, patient, daysAgo(40), 160, 100));

    await setup(patient, medplum);
    expect(await screen.findByText('Unused cuff')).toBeInTheDocument();
    expect(screen.getByText('No readings in the last 30 days')).toBeInTheDocument();
    expect(screen.queryByText('160 / 100 mmHg')).not.toBeInTheDocument();
  });
});
