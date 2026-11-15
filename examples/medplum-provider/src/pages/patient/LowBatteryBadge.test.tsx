// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { getReferenceString } from '@medplum/core';
import type { Device, Observation, Patient } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { MockInstance } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { EditTab } from './EditTab';
import { LowBatteryBadge } from './LowBatteryBadge';
import { PatientPage } from './PatientPage';
import { TimelineTab } from './TimelineTab';

describe('LowBatteryBadge', () => {
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

  async function createDevice(
    patient: Patient,
    status: Device['status'],
    manufacturer: string,
    batteryPercent?: number
  ): Promise<Device> {
    return medplum.createResource<Device>({
      resourceType: 'Device',
      status,
      manufacturer,
      patient: { reference: getReferenceString(patient) },
      property:
        batteryPercent === undefined
          ? undefined
          : [
              {
                type: { text: 'Battery level', coding: [{ code: 'battery-level' }] },
                valueQuantity: [{ value: batteryPercent, unit: '%', system: 'http://unitsofmeasure.org', code: '%' }],
              },
            ],
    });
  }

  async function createBatteryObservation(
    patient: Patient,
    device: Device,
    percent: number,
    effectiveDateTime: string,
    status: Observation['status'] = 'final'
  ): Promise<void> {
    await medplum.createResource<Observation>({
      resourceType: 'Observation',
      status,
      code: { text: 'Battery level', coding: [{ code: 'battery-level' }] },
      subject: { reference: getReferenceString(patient) },
      device: { reference: getReferenceString(device) },
      effectiveDateTime,
      valueQuantity: { value: percent, unit: '%', system: 'http://unitsofmeasure.org', code: '%' },
    });
  }

  function renderBadge(patient: Patient): MockInstance {
    const search = vi.spyOn(medplum, 'searchResources');
    render(
      <MedplumProvider medplum={medplum}>
        <MantineProvider>
          <LowBatteryBadge patient={patient} />
        </MantineProvider>
      </MedplumProvider>
    );
    return search;
  }

  async function settle(search: MockInstance): Promise<void> {
    await waitFor(() => expect(search).toHaveBeenCalled());
    for (let attempt = 0; attempt < 6; attempt++) {
      await act(async () => {
        await Promise.all(search.mock.results.map((result) => Promise.resolve(result.value).catch(() => undefined)));
      });
    }
  }

  function expectNoBadge(): void {
    expect(screen.queryByText('Low battery')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Acme Cardio battery below 20%')).not.toBeInTheDocument();
  }

  test('shows no badge when the patient has no devices', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    const someoneElse = await createPatient('Other', 'Patient');
    await createDevice(someoneElse, 'active', 'Acme Cardio', 5);

    const search = renderBadge(patient);
    await settle(search);

    expectNoBadge();
  });

  test('shows no badge when battery is at the 20% threshold', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    await createDevice(patient, 'active', 'Acme Cardio', 20);

    const search = renderBadge(patient);
    await settle(search);

    expectNoBadge();
  });

  test('shows a badge when an active Acme Cardio device property is below 20%', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    await createDevice(patient, 'active', 'Acme Cardio', 19);

    renderBadge(patient);

    expect(await screen.findByText('Low battery')).toBeInTheDocument();
    expect(screen.getByTitle('Acme Cardio battery below 20%')).toHaveTextContent('Low battery');
  });

  test('shows a badge when the latest battery observation is below 20%', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    const device = await createDevice(patient, 'active', 'Acme Cardio', 80);
    await createBatteryObservation(patient, device, 19, '2026-11-15T12:00:00.000Z');

    renderBadge(patient);

    expect(await screen.findByText('Low battery')).toBeInTheDocument();
  });

  test('uses the latest battery observation when an older reading is low', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    const device = await createDevice(patient, 'active', 'Acme Cardio');
    await createBatteryObservation(patient, device, 5, '2026-11-01T00:00:00.000Z');
    await createBatteryObservation(patient, device, 40, '2026-11-15T00:00:00.000Z');

    const search = renderBadge(patient);
    await settle(search);

    expectNoBadge();
  });

  test('prefers a healthy battery observation over a low device property', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    const device = await createDevice(patient, 'active', 'Acme Cardio', 5);
    await createBatteryObservation(patient, device, 40, '2026-11-15T00:00:00.000Z');

    const search = renderBadge(patient);
    await settle(search);

    expectNoBadge();
  });

  test('shows no badge when the device has no battery reading', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    await createDevice(patient, 'active', 'Acme Cardio');

    const search = renderBadge(patient);
    await settle(search);

    expectNoBadge();
  });

  test('ignores inactive devices, other manufacturers, and names that only contain Acme Cardio', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    await createDevice(patient, 'inactive', 'Acme Cardio', 5);
    await createDevice(patient, 'active', 'Other Vendor', 5);
    await createDevice(patient, 'active', 'Acme Cardio Labs', 5);

    const search = renderBadge(patient);
    await settle(search);

    expectNoBadge();
  });

  test('ignores a cancelled low battery observation', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    const device = await createDevice(patient, 'active', 'Acme Cardio');
    await createBatteryObservation(patient, device, 5, '2026-11-15T00:00:00.000Z', 'cancelled');

    const search = renderBadge(patient);
    await settle(search);

    expectNoBadge();
  });

  test('still shows a badge when the battery observation search fails', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    await createDevice(patient, 'active', 'Acme Cardio', 12);
    const original = medplum.searchResources.bind(medplum);
    vi.spyOn(medplum, 'searchResources').mockImplementation((resourceType, query, options) => {
      if (resourceType === 'Observation') {
        return Promise.reject(new Error('network')) as never;
      }
      return original(resourceType, query, options);
    });

    render(
      <MedplumProvider medplum={medplum}>
        <MantineProvider>
          <LowBatteryBadge patient={patient} />
        </MantineProvider>
      </MedplumProvider>
    );

    expect(await screen.findByText('Low battery')).toBeInTheDocument();
  });

  test('shows no badge when the device search fails', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    const search = vi.spyOn(medplum, 'searchResources').mockRejectedValue(new Error('network'));

    render(
      <MedplumProvider medplum={medplum}>
        <MantineProvider>
          <LowBatteryBadge patient={patient} />
        </MantineProvider>
      </MedplumProvider>
    );

    await waitFor(() => expect(search).toHaveBeenCalled());
    await act(async () => {
      await Promise.all(search.mock.results.map((result) => Promise.resolve(result.value).catch(() => undefined)));
    });

    expectNoBadge();
  });

  test('shows the badge on the patient summary header', async () => {
    const patient = await createPatient('Taylor', 'Demo');
    await createDevice(patient, 'active', 'Acme Cardio', 12);

    render(
      <MemoryRouter initialEntries={[`/Patient/${patient.id}`]}>
        <MedplumProvider medplum={medplum}>
          <MantineProvider>
            <Notifications />
            <Routes>
              <Route path="/Patient/:patientId/*" element={<PatientPage />}>
                <Route path="edit" element={<EditTab />} />
                <Route path="" element={<TimelineTab />} />
                <Route path="*" element={<TimelineTab />} />
              </Route>
            </Routes>
          </MantineProvider>
        </MedplumProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Taylor Demo')).toBeInTheDocument();
    expect(await screen.findByText('Low battery')).toBeInTheDocument();
  });
});
