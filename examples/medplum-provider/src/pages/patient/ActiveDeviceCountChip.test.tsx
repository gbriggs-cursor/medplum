// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import { getReferenceString } from '@medplum/core';
import type { Device, Patient } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import type { MockInstance } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ActiveDeviceCountChip } from './ActiveDeviceCountChip';

describe('ActiveDeviceCountChip', () => {
  let medplum: MockClient;

  beforeEach(() => {
    medplum = new MockClient();
  });

  async function createPatient(given: string, family: string): Promise<Patient> {
    return medplum.createResource<Patient>({
      resourceType: 'Patient',
      name: [{ given: [given], family }],
    });
  }

  async function createDevice(patient: Patient, status: Device['status'], manufacturer = 'Acme Cardio'): Promise<void> {
    await medplum.createResource<Device>({
      resourceType: 'Device',
      status,
      manufacturer,
      patient: { reference: getReferenceString(patient) },
    });
  }

  function renderChip(patient: Patient): MockInstance {
    const search = vi.spyOn(medplum, 'search');
    render(
      <MedplumProvider medplum={medplum}>
        <MantineProvider>
          <ActiveDeviceCountChip patient={patient} />
        </MantineProvider>
      </MedplumProvider>
    );
    return search;
  }

  async function settle(search: MockInstance): Promise<void> {
    await waitFor(() => expect(search).toHaveBeenCalled());
    await act(async () => {
      await Promise.all(search.mock.results.map((result) => result.value as Promise<unknown>));
    });
  }

  test('shows no chip when the patient has zero active Acme Cardio devices', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    const someoneElse = await createPatient('Other', 'Patient');
    await createDevice(someoneElse, 'active');

    const search = renderChip(patient);
    await settle(search);

    expect(screen.queryByTitle('Active Acme Cardio devices')).not.toBeInTheDocument();
  });

  test('shows a chip for one active Acme Cardio device', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    await createDevice(patient, 'active');

    renderChip(patient);

    expect(await screen.findByText('1 device')).toBeInTheDocument();
    expect(screen.getByTitle('Active Acme Cardio devices')).toHaveTextContent('1 device');
  });

  test('shows the count when the patient has many active Acme Cardio devices', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    await createDevice(patient, 'active');
    await createDevice(patient, 'active');
    await createDevice(patient, 'active');

    renderChip(patient);

    expect(await screen.findByText('3 devices')).toBeInTheDocument();
  });

  test('hides the chip when the device search fails', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    const search = vi.spyOn(medplum, 'search').mockRejectedValue(new Error('network'));

    render(
      <MedplumProvider medplum={medplum}>
        <MantineProvider>
          <ActiveDeviceCountChip patient={patient} />
        </MantineProvider>
      </MedplumProvider>
    );

    await waitFor(() => expect(search).toHaveBeenCalled());
    await act(async () => {
      await Promise.all(search.mock.results.map((result) => Promise.resolve(result.value).catch(() => undefined)));
    });

    expect(screen.queryByTitle('Active Acme Cardio devices')).not.toBeInTheDocument();
  });

  test('ignores inactive devices and devices from other manufacturers', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    await createDevice(patient, 'inactive');
    await createDevice(patient, 'inactive');
    await createDevice(patient, 'active', 'Other Vendor');

    const search = renderChip(patient);
    await settle(search);

    expect(screen.queryByTitle('Active Acme Cardio devices')).not.toBeInTheDocument();
  });
});
