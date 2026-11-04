// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from './App';
import { theme } from './theme';

test('App renders', async () => {
  await act(async () => {
    render(
      <MemoryRouter>
        <MedplumProvider medplum={new MockClient()}>
          <MantineProvider theme={theme}>
            <App />
          </MantineProvider>
        </MedplumProvider>
      </MemoryRouter>
    );
  });
});
