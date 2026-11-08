// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MockClient } from '@medplum/mock';
import { act, renderAppRoutes, screen } from '../test-utils/render';

describe('DevicesPage', () => {
  async function setup(url: string, medplum = new MockClient()): Promise<void> {
    await act(async () => {
      renderAppRoutes(medplum, url);
    });
  }

  test('Patient devices tab shows readiness and the empty state', async () => {
    await setup('/Patient/123/devices');
    expect(await screen.findByRole('heading', { name: 'Device readiness' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Devices' })).toBeInTheDocument();
    expect(screen.getByText('No devices linked to this patient')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load synthetic sample' })).toBeInTheDocument();
  });

  test('Other resource types explain that the page is patient only', async () => {
    await setup('/Practitioner/124/devices');
    expect(await screen.findByText('Device readiness is only available for Patient resources')).toBeInTheDocument();
  });
});
