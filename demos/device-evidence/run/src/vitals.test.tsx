// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import { MedplumProvider } from '@medplum/react';
import { render, screen, within } from '@testing-library/react';
import { Suspense } from 'react';
import { MemoryRouter } from 'react-router';
import { Vitals } from '../../../../examples/foomedical/src/pages/health-record/Vitals';
import { CODES } from './cohort';
import { parseEcgSummary } from './ecg';
import { loadIntoMockClient, readBundle, readManifest } from './load';

describe('REQ-001 Foo Medical vitals display', () => {
  test('a synthetic patch v2 patient sees the blood-pressure panel and ECG summary in Foo Medical vitals', async () => {
    const row = readManifest().patients[0];
    const medplum = await loadIntoMockClient(readBundle());
    const patient = await medplum.readResource('Patient', row.patient);
    vi.spyOn(medplum, 'getProfile').mockReturnValue(patient);

    const bp = await medplum.readResource('Observation', row.bloodPressure);
    const ecg = await medplum.readResource('Observation', row.ecg);
    const [systolic, diastolic] = (bp.component ?? []).map((c) => c.valueQuantity?.value);
    const summary = parseEcgSummary(ecg);

    render(
      <MemoryRouter>
        <MedplumProvider medplum={medplum}>
          <MantineProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <Vitals />
            </Suspense>
          </MantineProvider>
        </MedplumProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Vitals')).toBeInTheDocument();
    const bpRow = screen.getByText(CODES.bpPanel.display).closest('tr') as HTMLElement;
    expect(within(bpRow).getByText(`${systolic} mm[Hg] / ${diastolic} mm[Hg]`)).toBeInTheDocument();

    const ecgRow = screen.getByText(CODES.ecg.display).closest('tr') as HTMLElement;
    const ecgCell = ecgRow.querySelectorAll('td')[1].textContent ?? '';
    expect(ecgCell).toContain(`${summary.heartRate} /min`);
    expect(ecgCell).toContain(`${summary.qtcInterval} ms`);
    expect(ecgCell).toContain(summary.rhythm as string);
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });
});
