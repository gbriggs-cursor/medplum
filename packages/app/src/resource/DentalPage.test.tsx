// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MockClient } from '@medplum/mock';
import { act, fireEvent, renderAppRoutes, screen } from '../test-utils/render';

describe('DentalPage', () => {
  test('opens the Dental tab on a patient chart', async () => {
    const medplum = new MockClient();
    await act(async () => {
      renderAppRoutes(medplum, '/Patient/123');
    });

    expect(await screen.findByRole('tab', { name: 'Dental' })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Dental' }));
    });

    expect(await screen.findByText('No hygiene recall on file')).toBeInTheDocument();
    expect(screen.getByText('No treatment plan items')).toBeInTheDocument();
  });

  test('does not add a Dental tab to other resource types', async () => {
    await act(async () => {
      renderAppRoutes(new MockClient(), '/Practitioner/124');
    });

    expect(await screen.findByRole('tab', { name: 'Timeline' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Dental' })).not.toBeInTheDocument();
  });
});
