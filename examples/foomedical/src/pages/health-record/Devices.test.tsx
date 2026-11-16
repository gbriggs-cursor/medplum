// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import { getReferenceString, indexSearchParameterBundle, indexStructureDefinitionBundle } from '@medplum/core';
import { SEARCH_PARAMETER_BUNDLE_FILES, readJson } from '@medplum/definitions';
import type { Bundle, Device, SearchParameter } from '@medplum/fhirtypes';
import { HomerSimpson, MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { MemoryRouter } from 'react-router';
import { Devices } from './Devices';

indexStructureDefinitionBundle(readJson('fhir/r4/profiles-types.json') as Bundle);
indexStructureDefinitionBundle(readJson('fhir/r4/profiles-resources.json') as Bundle);
indexStructureDefinitionBundle(readJson('fhir/r4/profiles-medplum.json') as Bundle);
for (const filename of SEARCH_PARAMETER_BUNDLE_FILES) {
  indexSearchParameterBundle(readJson(filename) as Bundle<SearchParameter>);
}

const BATTERY_SYSTEM = 'https://foo-medical.example/device-property';

function batteryDevice(name: string, patient: string, percent: number): Device {
  return {
    resourceType: 'Device',
    manufacturer: 'Foo Medical',
    deviceName: [{ name, type: 'user-friendly-name' }],
    patient: { reference: patient },
    property: [
      {
        type: { coding: [{ system: BATTERY_SYSTEM, code: 'battery-percent' }] },
        valueQuantity: [{ value: percent, unit: '%' }],
      },
    ],
  };
}

describe('Devices', () => {
  test('shows a low-battery card for the signed-in patient only', async () => {
    const medplum = new MockClient({ profile: HomerSimpson, seedDefaultData: false });
    const patientRef = getReferenceString(HomerSimpson);
    if (!patientRef) {
      throw new Error('Expected Homer Simpson to have an id');
    }
    await medplum.createResource(batteryDevice('Home Monitor', patientRef, 12));
    await medplum.createResource(batteryDevice('Clinic Spare', 'Patient/someone-else', 4));

    render(
      <MedplumProvider medplum={medplum}>
        <MantineProvider>
          <MemoryRouter>
            <Suspense fallback={<div>Loading</div>}>
              <Devices />
            </Suspense>
          </MemoryRouter>
        </MantineProvider>
      </MedplumProvider>
    );

    expect(await screen.findByText('Home Monitor')).toBeInTheDocument();
    expect(screen.getByText('Low battery')).toBeInTheDocument();
    expect(screen.getByText('Battery 12%')).toBeInTheDocument();
    expect(screen.queryByText('Clinic Spare')).not.toBeInTheDocument();
  });
});
