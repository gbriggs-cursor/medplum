// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { LOINC, UCUM } from '@medplum/core';
import type { Bundle, BundleEntry, Device, DeviceDefinition, Observation, Patient, Resource } from '@medplum/fhirtypes';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATOR_SEED, mulberry32, syntheticMeta } from './seed';

const PATIENT_COUNT = 20;
const ECG_SAMPLE_COUNT = 40;
const ECG_PERIOD_MS = 8;
const GIVEN_NAMES = [
  'River',
  'Sky',
  'Cedar',
  'Rowan',
  'Indigo',
  'Maple',
  'Quill',
  'North',
  'Lake',
  'Moss',
  'Pine',
  'Ash',
  'Fern',
  'Sage',
  'Wren',
  'Brook',
  'Glen',
  'Reed',
  'Vale',
  'Dale',
] as const;

export interface DeviceEvidenceManifest {
  name: string;
  seed: number;
  synthetic: true;
  counts: Record<string, number>;
  resources: { resourceType: string; id: string }[];
}

export function generateDeviceEvidence(): { bundle: Bundle; manifest: DeviceEvidenceManifest } {
  const random = mulberry32(GENERATOR_SEED);
  const resources: Resource[] = [];

  for (let i = 0; i < PATIENT_COUNT; i += 1) {
    const pad = String(i).padStart(2, '0');
    const patientId = `acme-patient-${pad}`;
    const definitionId = `acme-cardio-patch-v2-${pad}`;
    const deviceId = `acme-device-${pad}`;
    const given = GIVEN_NAMES[i];
    const family = `Synthetic${pad}`;

    const patient: Patient = {
      resourceType: 'Patient',
      id: patientId,
      meta: syntheticMeta(),
      identifier: [{ system: 'https://acme-cardio.example/synthetic/patient', value: patientId }],
      name: [{ use: 'official', family, given: [given] }],
      gender: i % 2 === 0 ? 'female' : 'male',
      birthDate: `19${70 + (i % 20)}-01-15`,
      telecom: [{ system: 'email', value: `${given.toLowerCase()}.synthetic${pad}@example.test` }],
      address: [{ use: 'home', line: ['1 Example Way'], city: 'Testville', state: 'TS', postalCode: '00000' }],
    };

    const definition: DeviceDefinition = {
      resourceType: 'DeviceDefinition',
      id: definitionId,
      meta: syntheticMeta(),
      identifier: [{ system: 'https://acme-cardio.example/synthetic/device-definition', value: definitionId }],
      manufacturerString: 'Acme Cardio',
      deviceName: [{ name: 'Acme Cardio patch v2', type: 'model-name' }],
      modelNumber: 'ACP-V2',
      type: { text: 'Wearable cardiac patch' },
    };

    const device: Device = {
      resourceType: 'Device',
      id: deviceId,
      meta: syntheticMeta(),
      identifier: [{ system: 'https://acme-cardio.example/synthetic/device', value: `ACP-V2-${pad}` }],
      definition: { reference: `DeviceDefinition/${definitionId}` },
      status: 'active',
      manufacturer: 'Acme Cardio',
      deviceName: [{ name: 'Acme Cardio patch v2', type: 'model-name' }],
      modelNumber: 'ACP-V2',
      type: { text: 'Wearable cardiac patch' },
      patient: { reference: `Patient/${patientId}` },
    };

    const systolic = 108 + Math.round(random() * 28);
    const diastolic = 68 + Math.round(random() * 18);
    const bp: Observation = {
      resourceType: 'Observation',
      id: `acme-bp-${pad}`,
      meta: syntheticMeta(),
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs',
            },
          ],
        },
      ],
      code: {
        coding: [{ system: LOINC, code: '85354-9', display: 'Blood Pressure' }],
        text: 'Blood Pressure',
      },
      subject: { reference: `Patient/${patientId}` },
      device: { reference: `Device/${deviceId}` },
      effectiveDateTime: `2026-11-04T08:${pad}:00Z`,
      component: [
        {
          code: { coding: [{ system: LOINC, code: '8480-6', display: 'Systolic' }] },
          valueQuantity: { value: systolic, unit: 'mm[Hg]', system: UCUM, code: 'mm[Hg]' },
        },
        {
          code: { coding: [{ system: LOINC, code: '8462-4', display: 'Diastolic' }] },
          valueQuantity: { value: diastolic, unit: 'mm[Hg]', system: UCUM, code: 'mm[Hg]' },
        },
      ],
    };

    const samples = Array.from({ length: ECG_SAMPLE_COUNT }, (_, sampleIndex) => {
      const wave = Math.sin((sampleIndex / ECG_SAMPLE_COUNT) * Math.PI * 4 + i) * 0.8;
      const noise = (random() - 0.5) * 0.08;
      return Number((wave + noise).toFixed(3));
    });

    const ecg: Observation = {
      resourceType: 'Observation',
      id: `acme-ecg-${pad}`,
      meta: syntheticMeta(),
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'procedure',
              display: 'Procedure',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'urn:iso:std:iso:11073:10101',
            code: '131328',
            display: 'MDC_ECG_ELEC_POTL',
          },
        ],
        text: 'ECG summary',
      },
      subject: { reference: `Patient/${patientId}` },
      device: { reference: `Device/${deviceId}` },
      effectiveDateTime: `2026-11-04T08:${pad}:00Z`,
      component: [
        {
          code: {
            coding: [
              {
                system: 'urn:iso:std:iso:11073:10101',
                code: '131329',
                display: 'MDC_ECG_ELEC_POTL_I',
              },
            ],
            text: 'Lead I',
          },
          valueSampledData: {
            origin: { value: 0, unit: 'mV', system: UCUM, code: 'mV' },
            period: ECG_PERIOD_MS,
            factor: 1,
            dimensions: 1,
            data: samples.join(' '),
          },
        },
      ],
    };

    resources.push(patient, definition, device, bp, ecg);
  }

  const bundle: Bundle = {
    resourceType: 'Bundle',
    type: 'batch',
    meta: syntheticMeta(),
    entry: resources.map((resource): BundleEntry => ({
      fullUrl: `${resource.resourceType}/${resource.id}`,
      resource,
      request: { method: 'PUT', url: `${resource.resourceType}/${resource.id}` },
    })),
  };

  const counts: Record<string, number> = {};
  for (const resource of resources) {
    counts[resource.resourceType] = (counts[resource.resourceType] ?? 0) + 1;
  }
  counts.ObservationBloodPressure = resources.filter(
    (resource) => resource.resourceType === 'Observation' && resource.id?.startsWith('acme-bp-')
  ).length;
  counts.ObservationEcg = resources.filter(
    (resource) => resource.resourceType === 'Observation' && resource.id?.startsWith('acme-ecg-')
  ).length;
  counts.total = resources.length;

  return {
    bundle,
    manifest: {
      name: 'Acme Cardio patch v2',
      seed: GENERATOR_SEED,
      synthetic: true,
      counts,
      resources: resources.map((resource) => ({
        resourceType: resource.resourceType,
        id: resource.id as string,
      })),
    },
  };
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === thisFile) {
  const { bundle, manifest } = generateDeviceEvidence();
  const demoRoot = join(dirname(thisFile), '..');
  const dataDir = join(demoRoot, 'data');
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, 'acme-cardio-patch-v2.bundle.json'), JSON.stringify(bundle, null, 2) + '\n');
  writeFileSync(join(demoRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
}
