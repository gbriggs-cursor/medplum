// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { validateResource } from '@medplum/core';
import type { Device, DeviceDefinition, Observation } from '@medplum/fhirtypes';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isSynthetic } from '../../../_shared/fhir/tags.mjs';
import { ACME, buildCohort, BUNDLE_PATH, CODES, createRandom, DEFAULT_SEED, seededUuid } from './cohort';
import { bundleResources, indexFhirDefinitions, loadIntoMockClient, readBundle, readManifest, RUN_DIR } from './load';

describe('REQ-001 synthetic Acme Cardio patch v2 cohort', () => {
  test('regenerating from the seed reproduces the committed bundle and manifest', () => {
    const manifest = readManifest();
    const { bundle, manifest: rebuilt } = buildCohort(manifest.seed);
    const committed = readFileSync(join(RUN_DIR, BUNDLE_PATH), 'utf8');

    expect(manifest.seed).toBe(DEFAULT_SEED);
    expect(JSON.stringify(bundle, null, 2) + '\n').toBe(committed);
    expect(createHash('sha256').update(committed).digest('hex')).toBe(manifest.bundleSha256);
    expect({ ...rebuilt, bundleSha256: manifest.bundleSha256 }).toEqual(manifest);
    expect(buildCohort(manifest.seed + 1).manifest.resources.Patient).not.toEqual(manifest.resources.Patient);
    expect(seededUuid(createRandom(1))).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  test('manifest lists every resource id with counts; every resource is valid R4 and tagged synthetic and HTEST', () => {
    const bundle = readBundle();
    const manifest = readManifest();
    const resources = bundleResources(bundle);

    expect(manifest.counts).toMatchObject({
      Patient: 20,
      DeviceDefinition: 20,
      Device: 20,
      Observation: 40,
      bloodPressurePanels: 20,
      ecgObservations: 20,
      total: 100,
    });
    const manifestIds = Object.values(manifest.resources).flat();
    expect(new Set(manifestIds).size).toBe(manifest.counts.total);
    expect(resources.map((r) => r.id).sort()).toEqual([...manifestIds].sort());
    expect(manifest.patients).toHaveLength(20);

    expect(isSynthetic(bundle)).toBe(true);
    for (const resource of resources) {
      expect(isSynthetic(resource), `${resource.resourceType}/${resource.id}`).toBe(true);
    }

    indexFhirDefinitions();
    for (const resource of resources) {
      expect(() => validateResource(resource), `${resource.resourceType}/${resource.id}`).not.toThrow();
    }
  });

  test('MockClient ingests the bundle and links patient, device, definition, BP panel, and ECG', async () => {
    const manifest = readManifest();
    const medplum = await loadIntoMockClient(readBundle());

    for (const row of manifest.patients) {
      const device = await medplum.readResource('Device', row.device);
      expect(device.patient?.reference).toBe(`Patient/${row.patient}`);
      const definition = await medplum.readReference(device.definition as { reference: string });
      expect(definition.id).toBe(row.deviceDefinition);
      expect((definition as DeviceDefinition).manufacturerString).toBe(ACME.manufacturer);
      expect((device as Device).deviceName?.[0]?.name).toBe('Acme Cardio patch v2');

      const observations = await medplum.searchResources('Observation', { patient: `Patient/${row.patient}` });
      expect(observations.map((o) => o.id).sort()).toEqual([row.bloodPressure, row.ecg].sort());
      for (const obs of observations as Observation[]) {
        expect(obs.device?.reference).toBe(`Device/${row.device}`);
      }

      const bp = await medplum.readResource('Observation', row.bloodPressure);
      expect(bp.code?.coding?.[0]?.code).toBe(CODES.bpPanel.code);
      const systolic = bp.component?.find((c) => c.code.coding?.[0]?.code === CODES.systolic.code)?.valueQuantity;
      const diastolic = bp.component?.find((c) => c.code.coding?.[0]?.code === CODES.diastolic.code)?.valueQuantity;
      expect(systolic?.unit).toBe('mm[Hg]');
      expect(systolic?.value).toBeGreaterThan(diastolic?.value as number);

      const ecg = await medplum.readResource('Observation', row.ecg);
      expect(ecg.component?.some((c) => c.valueSampledData?.data)).toBe(true);
    }

    const broken = readBundle();
    broken.entry = [{ request: { method: 'GET', url: 'Patient/does-not-exist' } }];
    await expect(loadIntoMockClient(broken)).rejects.toThrow('Bundle load failed');
  });
});
