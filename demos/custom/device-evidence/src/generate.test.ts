// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATOR_SEED, PATIENT_COUNT, SYNTHETIC_TAG_SYSTEM } from './constants';
import { bundleResources, generateBundle } from './generate';
import type { Bundle } from '@medplum/fhirtypes';

describe('Acme Cardio synthetic generator', () => {
  const bundle = generateBundle(GENERATOR_SEED);
  const resources = bundleResources(bundle);

  test('is deterministic for the fixed seed', () => {
    expect(generateBundle(GENERATOR_SEED)).toStrictEqual(bundle);
  });

  test('flags every resource synthetic and never includes PHI markers', () => {
    expect(resources.length).toBeGreaterThan(0);
    for (const resource of resources) {
      expect(resource.meta?.tag?.some((tag) => tag.system === SYNTHETIC_TAG_SYSTEM && tag.code === 'synthetic')).toBe(
        true
      );
    }
    expect(JSON.stringify(bundle).toLowerCase()).not.toMatch(/ssn|social security|mrn-real|phi/i);
  });

  test('creates 20 patients, 20 devices with definitions, BP panels, and ECG summaries', () => {
    expect(bundle.type).toBe('transaction');
    expect(bundle.entry).toHaveLength(2 + PATIENT_COUNT * 4);
    const byType = Object.groupBy(resources, (resource) => resource.resourceType);
    expect(byType.Patient).toHaveLength(20);
    expect(byType.Device).toHaveLength(20);
    expect(byType.DeviceDefinition).toHaveLength(1);
    expect(byType.Observation).toHaveLength(40);

    for (const device of byType.Device ?? []) {
      expect(device.resourceType === 'Device' && device.definition?.reference).toBe(
        'DeviceDefinition/acme-cardio-patch-v2'
      );
    }

    const observations = byType.Observation ?? [];
    const bp = observations.filter((obs) => obs.resourceType === 'Observation' && obs.code?.coding?.[0]?.code === '85354-9');
    const ecg = observations.filter((obs) => obs.resourceType === 'Observation' && obs.code?.coding?.[0]?.code === '11524-6');
    expect(bp).toHaveLength(20);
    expect(ecg).toHaveLength(20);
    for (const obs of bp) {
      expect(obs.resourceType === 'Observation' && obs.component?.length).toBe(2);
      expect(obs.resourceType === 'Observation' && obs.valueSampledData).toBeUndefined();
    }
    for (const obs of ecg) {
      expect(obs.resourceType === 'Observation' && obs.component?.length).toBeGreaterThan(0);
      expect(obs.resourceType === 'Observation' && obs.valueSampledData?.data?.split(' ').length).toBeGreaterThan(10);
    }
  });

  test('committed bundle matches the fixed-seed generator', () => {
    const written = JSON.parse(
      readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'acme-cardio-bundle.json'), 'utf8')
    ) as Bundle;
    expect(written).toStrictEqual(bundle);
  });
});
