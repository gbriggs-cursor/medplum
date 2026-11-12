// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import { formatObservationValue, getReferenceString } from '@medplum/core';
import type { Bundle, Observation, Patient } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { act, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Suspense } from 'react';
import { Vitals } from '../../../../../examples/foomedical/src/pages/health-record/Vitals';
import { parseEcgSummary } from './ecg-summary-parser';
import { SYNTHETIC_TAG_SYSTEM } from './seed';

const bundle = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../data/acme-cardio-patch-v2.bundle.json'), 'utf8')
) as Bundle;

function isSynthetic(resource: { meta?: { tag?: { system?: string; code?: string }[] } }): boolean {
  return Boolean(resource.meta?.tag?.some((tag) => tag.system === SYNTHETIC_TAG_SYSTEM && tag.code === 'synthetic'));
}

async function loadBundle(medplum: MockClient): Promise<void> {
  const result = await medplum.executeBatch(bundle);
  const failed = result.entry?.filter((entry) => !entry.response?.status?.startsWith('2')) ?? [];
  expect(failed).toHaveLength(0);
}

test('MockClient ingests the synthetic Acme Cardio patch v2 bundle', async () => {
  const medplum = new MockClient();
  await loadBundle(medplum);

  const patients = (await medplum.searchResources('Patient', '_count=200')).filter((resource) =>
    resource.id?.startsWith('acme-patient-')
  );
  const devices = (await medplum.searchResources('Device', '_count=200')).filter((resource) =>
    resource.id?.startsWith('acme-device-')
  );
  const definitions = (await medplum.searchResources('DeviceDefinition', '_count=200')).filter((resource) =>
    resource.id?.startsWith('acme-cardio-patch-v2-')
  );
  const bloodPressure = await medplum.searchResources('Observation', 'code=http://loinc.org|85354-9');
  const ecg = await medplum.searchResources('Observation', 'code=urn:iso:std:iso:11073:10101|131328');

  expect(patients).toHaveLength(20);
  expect(devices).toHaveLength(20);
  expect(definitions).toHaveLength(20);
  expect(bloodPressure).toHaveLength(20);
  expect(ecg).toHaveLength(20);
  expect([...patients, ...devices, ...definitions, ...bloodPressure, ...ecg].every(isSynthetic)).toBe(true);

  for (const device of devices) {
    if (!device.definition) {
      throw new Error(`Device/${device.id} is missing DeviceDefinition`);
    }
    const definition = await medplum.readReference(device.definition);
    expect(definition.resourceType).toBe('DeviceDefinition');
    expect(definition.modelNumber).toBe('ACP-V2');
    expect(isSynthetic(definition)).toBe(true);
  }

  for (const observation of bloodPressure) {
    expect(observation.component).toHaveLength(2);
    expect(observation.component?.[0].code?.coding?.[0].code).toBe('8480-6');
    expect(observation.component?.[1].code?.coding?.[0].code).toBe('8462-4');
  }

  for (const observation of ecg) {
    expect(observation.component?.[0].valueSampledData?.data?.split(' ')).toHaveLength(40);
    const summary = parseEcgSummary(observation);
    expect(summary.sampleCount).toBe(40);
    expect(summary.periodMs).toBe(8);
    expect(summary.unit).toBe('mV');
  }
});

test('Foo Medical Vitals shows ingested blood pressure for the signed-in patient', async () => {
  const medplum = new MockClient();
  await loadBundle(medplum);

  const patient = (await medplum.readResource('Patient', 'acme-patient-00')) as Patient;
  const bp = (await medplum.readResource('Observation', 'acme-bp-00')) as Observation;
  const ecg = (await medplum.readResource('Observation', 'acme-ecg-00')) as Observation;
  medplum.mock.setProfile(patient);

  await act(async () => {
    render(
      <MedplumProvider medplum={medplum}>
        <MantineProvider>
          <Suspense fallback={<div>loading</div>}>
            <Vitals />
          </Suspense>
        </MantineProvider>
      </MedplumProvider>
    );
  });

  expect(await screen.findByText('Vitals')).toBeInTheDocument();
  expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
  expect(screen.getByText(formatObservationValue(bp))).toBeInTheDocument();

  const listed = await medplum.searchResources('Observation', 'patient=' + getReferenceString(patient));
  expect(listed.some((observation) => observation.id === bp.id)).toBe(true);
  expect(listed.some((observation) => observation.id === ecg.id)).toBe(true);
  expect(parseEcgSummary(ecg).sampleCount).toBe(40);
});
