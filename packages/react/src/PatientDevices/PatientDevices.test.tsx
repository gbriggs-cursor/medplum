// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import type { Bundle, Observation, Patient, Reference } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react-hooks';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MemoryRouter } from 'react-router';
import { act, render, screen, within } from '../test-utils/render';
import { getDeviceReadingSeries, PatientDevices } from './PatientDevices';

const fixture = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../../../../demos/_shared/data/foo-medical-devices.bundle.json'), 'utf8')
) as Bundle;
const patient: Reference<Patient> = { reference: 'Patient/foo-patient-01' };

async function setup(props: { patient: Reference<Patient>; days?: number }): Promise<void> {
  const medplum = new MockClient();
  await medplum.executeBatch(fixture);
  await act(async () => {
    render(
      <MemoryRouter>
        <MantineProvider>
          <MedplumProvider medplum={medplum}>
            <PatientDevices {...props} />
          </MedplumProvider>
        </MantineProvider>
      </MemoryRouter>
    );
  });
}

function card(name: string): HTMLElement {
  const cards = screen.getAllByTestId('patient-device-card');
  const match = cards.find((c) => within(c).queryByText(name));
  if (!match) {
    throw new Error(`No device card named ${name}`);
  }
  return match;
}

describe('PatientDevices', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-14T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('every fixture resource is tagged synthetic', () => {
    expect(fixture.entry?.length).toBeGreaterThan(0);
    for (const entry of fixture.entry ?? []) {
      expect(entry.resource?.meta?.tag).toContainEqual(expect.objectContaining({ code: 'synthetic' }));
    }
  });

  test('charts the last 30 days of readings for each linked device', async () => {
    await setup({ patient });

    expect(await screen.findAllByTestId('patient-device-card')).toHaveLength(3);

    const cuff = card('Foo Home BP Cuff');
    expect(within(cuff).getByText('active')).toBeInTheDocument();
    // 30 daily readings in the window; the 45-day-old reading is excluded.
    expect(
      await within(cuff).findByRole('img', { name: /^Systolic blood pressure trend, 30 readings/ })
    ).toBeInTheDocument();
    expect(within(cuff).getByRole('img', { name: /^Diastolic blood pressure trend, 30 readings/ })).toBeInTheDocument();

    const oximeter = card('Foo Pulse Oximeter');
    expect(await within(oximeter).findByRole('img', { name: /^Oxygen saturation trend, 15 readings/ })).toBeInTheDocument();
    expect(within(oximeter).getByRole('img', { name: /^Heart rate trend, 15 readings/ })).toBeInTheDocument();

    const glucometer = card('Foo Glucometer');
    expect(within(glucometer).getByText('inactive')).toBeInTheDocument();
    expect(await within(glucometer).findByText('No readings in the last 30 days.')).toBeInTheDocument();
  });

  test('days prop narrows the window', async () => {
    await setup({ patient, days: 7 });
    await screen.findAllByTestId('patient-device-card');
    expect(
      await within(card('Foo Home BP Cuff')).findByRole('img', { name: /^Systolic blood pressure trend, 7 readings/ })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Last 7 days')).toHaveLength(2);
  });

  test('patient with no devices', async () => {
    await setup({ patient: { reference: 'Patient/foo-no-devices' } });
    expect(await screen.findByText('No devices are linked to this patient.')).toBeInTheDocument();
  });
});

describe('getDeviceReadingSeries', () => {
  test('groups numeric values by code, splits components, sorts by time, and skips unusable readings', () => {
    const observations: Observation[] = [
      {
        resourceType: 'Observation',
        status: 'final',
        code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
        effectiveDateTime: '2026-11-02T00:00:00Z',
        valueQuantity: { value: 80, unit: 'beats/minute' },
      },
      {
        resourceType: 'Observation',
        status: 'final',
        code: { coding: [{ system: 'http://loinc.org', code: '8867-4' }] },
        effectiveDateTime: '2026-11-01T00:00:00Z',
        valueQuantity: { value: 70, unit: 'beats/minute' },
      },
      {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Blood pressure' },
        issued: '2026-11-01T00:00:00Z',
        component: [
          { code: { text: 'Systolic' }, valueQuantity: { value: 120, code: 'mm[Hg]' } },
          { code: { text: 'Diastolic' }, valueString: 'n/a' },
        ],
      },
      {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'No date' },
        valueQuantity: { value: 1 },
      },
      {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'Not numeric' },
        effectiveDateTime: '2026-11-01T00:00:00Z',
        valueString: 'high',
      },
    ];

    expect(getDeviceReadingSeries(observations)).toEqual([
      {
        key: 'http://loinc.org|8867-4',
        label: 'Heart rate',
        unit: 'beats/minute',
        points: [
          { time: Date.parse('2026-11-01T00:00:00Z'), value: 70 },
          { time: Date.parse('2026-11-02T00:00:00Z'), value: 80 },
        ],
      },
      {
        key: 'Systolic',
        label: 'Systolic',
        unit: 'mm[Hg]',
        points: [{ time: Date.parse('2026-11-01T00:00:00Z'), value: 120 }],
      },
    ]);
  });
});
