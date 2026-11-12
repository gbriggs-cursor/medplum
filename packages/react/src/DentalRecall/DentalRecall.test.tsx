// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { createReference, formatDate } from '@medplum/core';
import type { CarePlan, Patient, ServiceRequest } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react-hooks';
import { act, render, screen, within } from '../test-utils/render';
import { DENTAL_CARE_SYSTEM, HYGIENE_RECALL_CODE } from './codes';
import { DentalRecallPanel } from './DentalRecall';
import { seedSyntheticDentalCharts } from './syntheticDental';

describe('DentalRecallPanel', () => {
  test('shows a loading state until dental searches resolve', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      name: [{ given: ['Load'], family: 'Test' }],
    });
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = medplum.searchResources.bind(medplum);
    vi.spyOn(medplum, 'searchResources').mockImplementation(((...args: unknown[]) =>
      gate.then(() => original(...(args as Parameters<typeof original>)))) as typeof medplum.searchResources);

    renderPanel(medplum, patient);

    expect(screen.getByTestId('dental-recall-loading')).toBeInTheDocument();

    release();

    expect(await screen.findByText('No hygiene recall on file')).toBeInTheDocument();
    expect(screen.queryByTestId('dental-recall-loading')).not.toBeInTheDocument();
  });

  test('shows a search failure instead of an empty chart', async () => {
    const medplum = new MockClient();
    const patient = await medplum.createResource<Patient>({ resourceType: 'Patient' });
    vi.spyOn(medplum, 'searchResources').mockRejectedValue(new Error('dental search failed'));

    renderPanel(medplum, patient);

    expect(await screen.findByText('dental search failed')).toBeInTheDocument();
    expect(screen.queryByText('No hygiene recall on file')).not.toBeInTheDocument();
  });

  test('shows empty recall and treatment plan for a synthetic patient with no chart', async () => {
    const medplum = new MockClient();
    const { riley } = await seedSyntheticDentalCharts(medplum);

    renderPanel(medplum, riley);

    expect(await screen.findByText('No hygiene recall on file')).toBeInTheDocument();
    expect(screen.getByText('No treatment plan items')).toBeInTheDocument();
    expect(screen.getByTestId('dental-treatment-open')).toHaveTextContent('0 open');
    expect(screen.getByTestId('dental-synthetic-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('dental-recall-status')).not.toBeInTheDocument();
  });

  test('shows an overdue recall and planned, scheduled, and completed procedures', async () => {
    const medplum = new MockClient();
    const { avery, averyDue } = await seedSyntheticDentalCharts(medplum);
    const today = new Date().toISOString().slice(0, 10);
    await medplum.createResource<CarePlan>({
      resourceType: 'CarePlan',
      status: 'active',
      intent: 'plan',
      title: 'Later hygiene recall',
      subject: createReference(avery),
      category: [{ coding: [{ system: DENTAL_CARE_SYSTEM, code: HYGIENE_RECALL_CODE }] }],
      period: { end: shiftDate(today, 30) },
    });
    await medplum.createResource<ServiceRequest>({
      resourceType: 'ServiceRequest',
      status: 'active',
      intent: 'order',
      subject: createReference(avery),
      code: { text: 'Complete blood count' },
    });

    renderPanel(medplum, avery);

    expect(await screen.findByText('Adult prophylaxis recall')).toBeInTheDocument();
    expect(screen.getByTestId('dental-recall-status')).toHaveTextContent('Overdue');
    expect(screen.getByText('90 days overdue')).toBeInTheDocument();
    expect(screen.getByText(`Next due ${formatDate(averyDue)}`)).toBeInTheDocument();
    expect(screen.queryByText('Later hygiene recall')).not.toBeInTheDocument();
    expect(screen.queryByText('Complete blood count')).not.toBeInTheDocument();
    expect(screen.getByTestId('dental-treatment-open')).toHaveTextContent('2 open');
    expect(screen.getByTestId('dental-synthetic-badge')).toBeInTheDocument();

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).getAllByRole('cell')[0]?.textContent)).toEqual([
      'D2391',
      'D2740',
      'D1110',
      'D7140',
    ]);
    expect(within(rows[0]).getByText('Planned')).toBeInTheDocument();
    expect(within(rows[0]).getByText('14')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Scheduled')).toBeInTheDocument();
    expect(within(rows[1]).getByText('19')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Prophylaxis, adult')).toBeInTheDocument();
    expect(within(rows[3]).getByText('3')).toBeInTheDocument();
    expect(screen.getAllByRole('cell', { name: 'D7140' })).toHaveLength(1);
  });

  test('keeps a future recall due and not overdue', async () => {
    const medplum = new MockClient();
    const { jordan, jordanDue } = await seedSyntheticDentalCharts(medplum);

    renderPanel(medplum, jordan);

    expect(await screen.findByText(`Next due ${formatDate(jordanDue)}`)).toBeInTheDocument();
    expect(screen.getByTestId('dental-recall-status')).toHaveTextContent('Due');
    expect(screen.queryByText(/days overdue/)).not.toBeInTheDocument();
    expect(screen.getByText('D4341')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByTestId('dental-treatment-open')).toHaveTextContent('1 open');
  });

  test('does not mark a recall due today as overdue', async () => {
    const medplum = new MockClient();
    const today = new Date().toISOString().slice(0, 10);
    const patient = await medplum.createResource<Patient>({
      resourceType: 'Patient',
      name: [{ given: ['Due'], family: 'Today' }],
    });
    await medplum.createResource<CarePlan>({
      resourceType: 'CarePlan',
      status: 'active',
      intent: 'plan',
      title: 'Hygiene recall',
      subject: createReference(patient),
      category: [{ coding: [{ system: DENTAL_CARE_SYSTEM, code: HYGIENE_RECALL_CODE }] }],
      period: { end: today },
    });

    renderPanel(medplum, patient);

    expect(await screen.findByTestId('dental-recall-status')).toHaveTextContent('Due');
    expect(screen.getByText('Due today')).toBeInTheDocument();
    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
  });
});

function renderPanel(medplum: MockClient, patient: Patient): void {
  act(() => {
    render(
      <MedplumProvider medplum={medplum}>
        <DentalRecallPanel patient={patient} />
      </MedplumProvider>
    );
  });
}

function shiftDate(isoDate: string, days: number): string {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
