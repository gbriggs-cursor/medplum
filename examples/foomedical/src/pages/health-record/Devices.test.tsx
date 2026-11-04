// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import { createReference, formatDateTime, formatObservationValue, indexSearchParameter } from '@medplum/core';
import type { Device, Observation, Patient, SearchParameter } from '@medplum/fhirtypes';
import { HomerSimpson, MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { act, render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { MemoryRouter } from 'react-router';
import { Devices } from './Devices';
import { LOINC_BLOOD_PRESSURE, LOINC_DIASTOLIC, LOINC_SYSTOLIC } from './Devices.utils';

const mockSearchParameters: SearchParameter[] = [
  {
    resourceType: 'SearchParameter',
    url: 'http://hl7.org/fhir/SearchParameter/Device-patient',
    name: 'patient',
    status: 'active',
    description: 'Patient information, if known',
    code: 'patient',
    base: ['Device'],
    type: 'reference',
    expression: 'Device.patient',
  },
  {
    resourceType: 'SearchParameter',
    url: 'http://hl7.org/fhir/SearchParameter/clinical-patient',
    name: 'patient',
    status: 'active',
    description: 'The subject that the observation is about',
    code: 'patient',
    base: ['Observation'],
    type: 'reference',
    expression: 'Observation.subject',
  },
  {
    resourceType: 'SearchParameter',
    url: 'http://hl7.org/fhir/SearchParameter/clinical-date',
    name: 'date',
    status: 'active',
    description: 'Obtained date/time of the observation',
    code: 'date',
    base: ['Observation'],
    type: 'date',
    expression: 'Observation.effective',
  },
];

const SYNTHETIC_TAG = {
  system: 'https://medplum.com/fhir/CodeSystem/synthetic',
  code: 'synthetic',
  display: 'Synthetic',
};

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function syntheticDevice(patient: Patient, overrides: Partial<Device> = {}): Device {
  return {
    resourceType: 'Device',
    meta: { tag: [SYNTHETIC_TAG] },
    status: 'active',
    deviceName: [{ name: 'Foo Medical Home BP Cuff', type: 'user-friendly-name' }],
    type: { text: 'Home blood pressure cuff' },
    patient: createReference(patient),
    ...overrides,
  };
}

function syntheticBpObservation(patient: Patient, device: Device, effectiveDateTime: string): Observation {
  return {
    resourceType: 'Observation',
    meta: { tag: [SYNTHETIC_TAG] },
    status: 'final',
    code: {
      coding: [{ system: 'http://loinc.org', code: LOINC_BLOOD_PRESSURE, display: 'Blood Pressure' }],
      text: 'Blood Pressure',
    },
    subject: createReference(patient),
    device: createReference(device),
    effectiveDateTime,
    component: [
      {
        code: { coding: [{ system: 'http://loinc.org', code: LOINC_DIASTOLIC, display: 'Diastolic Blood Pressure' }] },
        valueQuantity: { value: 78, unit: 'mm[Hg]', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
      },
      {
        code: { coding: [{ system: 'http://loinc.org', code: LOINC_SYSTOLIC, display: 'Systolic Blood Pressure' }] },
        valueQuantity: { value: 122, unit: 'mm[Hg]', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
      },
    ],
  };
}

async function renderDevices(medplum: MockClient): Promise<void> {
  await act(async () => {
    render(
      <MemoryRouter>
        <MedplumProvider medplum={medplum}>
          <MantineProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <Devices />
            </Suspense>
          </MantineProvider>
        </MedplumProvider>
      </MemoryRouter>
    );
  });
}

describe('Devices page', () => {
  beforeAll(() => {
    for (const searchParameter of mockSearchParameters) {
      indexSearchParameter(searchParameter);
    }
  });

  test('shows an empty state when the patient has no devices', async () => {
    const medplum = new MockClient({ profile: HomerSimpson });
    await renderDevices(medplum);
    expect(await screen.findByRole('heading', { name: 'My Devices' })).toBeInTheDocument();
    expect(screen.getByText('You do not have any connected devices yet.')).toBeInTheDocument();
  });

  test('lists the device and only its in-window readings', async () => {
    const medplum = new MockClient({ profile: HomerSimpson });
    const patient = HomerSimpson;
    const device = await medplum.createResource(syntheticDevice(patient));
    await medplum.createResource(
      syntheticDevice(patient, {
        deviceName: [{ name: 'Other Cuff', type: 'user-friendly-name' }],
        type: { text: 'Other cuff' },
      })
    );

    const recent = await medplum.createResource(syntheticBpObservation(patient, device, daysAgo(3)));
    const old = await medplum.createResource(syntheticBpObservation(patient, device, daysAgo(40)));

    await renderDevices(medplum);

    expect(await screen.findByRole('heading', { name: 'Foo Medical Home BP Cuff' })).toBeInTheDocument();
    expect(screen.getByText('Home blood pressure cuff')).toBeInTheDocument();
    expect(screen.getAllByText('active')).toHaveLength(2);
    expect(screen.getByText(formatObservationValue(recent))).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Other Cuff' })).toBeInTheDocument();
    expect(screen.getByText('No blood pressure readings in the last 30 days.')).toBeInTheDocument();
    expect(screen.queryByText(formatDateTime(old.effectiveDateTime as string))).not.toBeInTheDocument();
  });
});
