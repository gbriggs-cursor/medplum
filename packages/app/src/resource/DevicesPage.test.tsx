// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import type { Bundle } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { ErrorBoundary, Loading, MedplumProvider } from '@medplum/react';
import { act, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Suspense } from 'react';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../AppRoutes';

const fixture = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../../../../demos/_shared/data/foo-medical-devices.bundle.json'), 'utf8')
) as Bundle;

describe('DevicesPage', () => {
  async function setup(url: string): Promise<void> {
    const medplum = new MockClient();
    await medplum.executeBatch(fixture);
    await act(async () => {
      render(
        <MedplumProvider medplum={medplum}>
          <MemoryRouter initialEntries={[url]} initialIndex={0}>
            <MantineProvider>
              <Notifications />
              <ErrorBoundary>
                <Suspense fallback={<Loading />}>
                  <AppRoutes />
                </Suspense>
              </ErrorBoundary>
            </MantineProvider>
          </MemoryRouter>
        </MedplumProvider>
      );
    });
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-14T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('Patient shows Devices tab with device readings', async () => {
    await setup('/Patient/foo-patient-01/devices');
    expect(await screen.findByRole('tab', { name: 'Devices' })).toBeInTheDocument();
    expect(await screen.findAllByTestId('patient-device-card')).toHaveLength(3);
    expect(await screen.findByRole('img', { name: /^Systolic blood pressure trend, 30 readings/ })).toBeInTheDocument();
  });

  test('Non-patient has no Devices tab and shows unsupported message', async () => {
    await setup('/Practitioner/124/devices');
    expect(await screen.findByText('Unsupported resource type')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Devices' })).not.toBeInTheDocument();
  });
});
