// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { badRequest, OperationOutcomeError } from '@medplum/core';
import type { Device } from '@medplum/fhirtypes';
import { HomerSimpson, MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react-hooks';
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '../test-utils/render';
import { PatientDeviceReadiness } from './PatientDeviceReadiness';
import { loadSyntheticDeviceReadiness } from './syntheticDevices';

describe('PatientDeviceReadiness', () => {
  async function setup(medplum: MockClient, node: ReactNode): Promise<void> {
    await act(async () => {
      render(<MedplumProvider medplum={medplum}>{node}</MedplumProvider>);
    });
  }

  test('loads the labeled sample from the empty state', async () => {
    const medplum = new MockClient();
    await setup(medplum, <PatientDeviceReadiness patient={HomerSimpson} allowSyntheticSample />);

    expect(await screen.findByText('No devices linked to this patient')).toBeInTheDocument();
    expect(screen.getByText(/No device gateway is contacted/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Synthetic sample loaded' })).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Load synthetic sample' }));
    });

    expect(await screen.findByRole('link', { name: 'Synthetic — Home blood pressure cuff' })).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Expires within 30 days')).toBeInTheDocument();
    expect(screen.getByText('Connection off')).toBeInTheDocument();
    expect(screen.getByText('Status not recorded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ready: 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Needs attention: 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Offline: 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unknown: 1' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Synthetic sample loaded' })).toBeDisabled();
    expect(screen.getByText('Loaded 4 synthetic devices.')).toBeInTheDocument();
    expect(screen.getByText(/not live equipment/)).toBeInTheDocument();
  });

  test('filters by status and text', async () => {
    const medplum = new MockClient();
    await loadSyntheticDeviceReadiness(medplum, HomerSimpson);
    await setup(medplum, <PatientDeviceReadiness patient={HomerSimpson} />);

    expect(await screen.findByRole('link', { name: 'Synthetic — Pulse oximeter' })).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Offline: 1' }));
    });
    expect(screen.getByRole('link', { name: 'Synthetic — Pulse oximeter' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Synthetic — Glucose sensor' })).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Filter devices'), { target: { value: 'glucose' } });
    });
    expect(screen.getByText('No devices match')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    });
    expect(screen.getByRole('link', { name: 'Synthetic — Glucose sensor' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Synthetic — Home blood pressure cuff' })).toBeInTheDocument();
  });

  test('does not offer the sample unless enabled', async () => {
    await setup(new MockClient(), <PatientDeviceReadiness patient={HomerSimpson} />);
    expect(await screen.findByText('No devices linked to this patient')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load synthetic sample' })).not.toBeInTheDocument();
  });

  test('shows a search failure instead of the empty state', async () => {
    const medplum = new MockClient();
    vi.spyOn(medplum, 'searchResources').mockRejectedValue(
      new OperationOutcomeError(badRequest('Device search failed'))
    );
    await setup(medplum, <PatientDeviceReadiness patient={HomerSimpson} allowSyntheticSample />);

    expect(await screen.findByText('Device search failed')).toBeInTheDocument();
    expect(screen.queryByText('No devices linked to this patient')).not.toBeInTheDocument();
  });

  test('explains when every device is entered-in-error', async () => {
    const medplum = new MockClient();
    await medplum.createResource<Device>({
      resourceType: 'Device',
      status: 'entered-in-error',
      patient: { reference: 'Patient/123' },
      deviceName: [{ name: 'Synthetic — Retired monitor', type: 'user-friendly-name' }],
    });
    await setup(medplum, <PatientDeviceReadiness patient={HomerSimpson} />);

    expect(await screen.findByText('No devices to review')).toBeInTheDocument();
    expect(screen.getByText('1 device is hidden because its status is entered-in-error.')).toBeInTheDocument();
    expect(screen.queryByText('Synthetic — Retired monitor')).not.toBeInTheDocument();
  });
});
