// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { createReference } from '@medplum/core';
import type { Device, Patient } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { act, renderAppRoutes, screen } from '../test-utils/render';

const SYNTHETIC_TAG = {
  system: 'https://medplum.com/fhir/CodeSystem/synthetic',
  code: 'synthetic',
  display: 'Synthetic',
};

describe('DevicesPage', () => {
  async function setup(url: string, medplum = new MockClient()): Promise<void> {
    await act(async () => {
      renderAppRoutes(medplum, url);
    });
  }

  test('Patient shows the Devices tab and empty state', async () => {
    await setup('/Patient/123/devices');
    expect(await screen.findByRole('tab', { name: 'Devices' })).toBeInTheDocument();
    expect(await screen.findByText('No devices connected for this patient')).toBeInTheDocument();
  });

  test('Patient lists a connected device', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      meta: { tag: [SYNTHETIC_TAG] },
      name: [{ given: ['Taylor'], family: 'Demo' }],
    });
    await medplum.createResource<Device>({
      resourceType: 'Device',
      meta: { tag: [SYNTHETIC_TAG] },
      status: 'active',
      deviceName: [{ name: 'Omron 5 Series Upper Arm', type: 'user-friendly-name' }],
      type: { text: 'Home blood pressure monitor' },
      patient: createReference(patient),
    });

    await setup(`/Patient/${patient.id}/devices`, medplum);
    expect(await screen.findByText('Omron 5 Series Upper Arm')).toBeInTheDocument();
    expect(screen.getByText('Home blood pressure monitor')).toBeInTheDocument();
  });

  test('Unsupported resource type', async () => {
    await setup('/Practitioner/124/devices');
    expect(await screen.findByText('Unsupported resource type')).toBeInTheDocument();
  });
});
