// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { LOINC, UCUM } from '@medplum/core';
import type {
  Bundle,
  BundleEntry,
  Device,
  DeviceDefinition,
  Meta,
  Observation,
  Organization,
  Patient,
  Resource,
  SampledData,
} from '@medplum/fhirtypes';
import {
  ACME_DEVICE_TYPE_SYSTEM,
  ACME_ECG_CODE_SYSTEM,
  ACME_ECG_CODES,
  ACME_IDENTIFIER_SYSTEM,
  BP_PANEL_CODE,
  DIASTOLIC_CODE,
  EKG_STUDY_CODE,
  GENERATOR_SEED,
  GENERATOR_SEED_LABEL,
  HEART_RATE_CODE,
  LOINC_DISPLAY,
  PATIENT_COUNT,
  SYNTHETIC_TAG_SYSTEM,
  SYSTOLIC_CODE,
} from './constants';

const GIVEN_NAMES = [
  'Ada',
  'Blake',
  'Casey',
  'Drew',
  'Eden',
  'Finley',
  'Gray',
  'Harper',
  'Indigo',
  'Jules',
  'Kai',
  'Logan',
  'Morgan',
  'Noel',
  'Oakley',
  'Parker',
  'Quinn',
  'Reese',
  'Sage',
  'Tatum',
] as const;

export interface ResourceRef {
  resourceType: string;
  id: string;
}

export interface DeviceEvidenceManifest {
  seed: number;
  seedLabel: string;
  generatedAt: string;
  synthetic: true;
  phi: false;
  counts: Record<string, number>;
  resources: ResourceRef[];
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pad(index: number): string {
  return String(index).padStart(2, '0');
}

function syntheticMeta(): Meta {
  return {
    tag: [
      {
        system: SYNTHETIC_TAG_SYSTEM,
        code: 'synthetic',
        display: 'Synthetic',
      },
    ],
  };
}

function isSynthetic(resource: Resource): boolean {
  return resource.meta?.tag?.some((tag) => tag.system === SYNTHETIC_TAG_SYSTEM && tag.code === 'synthetic') === true;
}

function loinc(code: string): { system: typeof LOINC; code: string; display: string } {
  return { system: LOINC, code, display: LOINC_DISPLAY[code] ?? code };
}

function quantity(value: number, unit: string, code = unit): { value: number; unit: string; system: typeof UCUM; code: string } {
  return { value, unit, system: UCUM, code };
}

function generateWaveform(rng: () => number, heartRate: number): SampledData {
  const sampleCount = 250;
  const period = 4;
  const samples: number[] = [];
  const cycle = 60 / heartRate;
  for (let i = 0; i < sampleCount; i++) {
    const t = (i * period) / 1000;
    const phase = (t % cycle) / cycle;
    let value = 0.05 * Math.sin(2 * Math.PI * phase);
    if (phase > 0.18 && phase < 0.22) {
      value += 0.15 * Math.sin(((phase - 0.18) / 0.04) * Math.PI);
    }
    if (phase > 0.38 && phase < 0.46) {
      const qrs = (phase - 0.38) / 0.08;
      value += qrs < 0.35 ? -0.2 * qrs : qrs < 0.55 ? 1.2 - (qrs - 0.35) * 2 : -0.15 * (1 - qrs);
    }
    if (phase > 0.62 && phase < 0.78) {
      value += 0.25 * Math.sin(((phase - 0.62) / 0.16) * Math.PI);
    }
    value += (rng() - 0.5) * 0.02;
    samples.push(Number(value.toFixed(3)));
  }
  return {
    origin: quantity(0, 'mV'),
    period,
    factor: 1,
    dimensions: 1,
    data: samples.join(' '),
  };
}

function createOrganization(): Organization {
  return {
    resourceType: 'Organization',
    id: 'acme-cardio-org',
    meta: syntheticMeta(),
    identifier: [{ system: `${ACME_IDENTIFIER_SYSTEM}/org`, value: 'acme-cardio' }],
    active: true,
    name: 'Acme Cardio',
  };
}

function createDeviceDefinition(): DeviceDefinition {
  return {
    resourceType: 'DeviceDefinition',
    id: 'acme-cardio-patch-v2',
    meta: syntheticMeta(),
    identifier: [{ system: `${ACME_IDENTIFIER_SYSTEM}/device-definition`, value: 'ACP-V2' }],
    manufacturerString: 'Acme Cardio',
    deviceName: [{ name: 'Acme Cardio patch v2', type: 'model-name' }],
    modelNumber: 'ACP-V2',
    type: {
      coding: [
        {
          system: ACME_DEVICE_TYPE_SYSTEM,
          code: 'cardio-patch-v2',
          display: 'Acme Cardio patch v2',
        },
      ],
      text: 'Acme Cardio patch v2',
    },
    manufacturerReference: { reference: 'Organization/acme-cardio-org' },
  };
}

function createPatient(index: number, rng: () => number): Patient {
  const id = `acme-cardio-patient-${pad(index)}`;
  const year = 1948 + randomInt(rng, 0, 40);
  const month = pad(randomInt(rng, 1, 12));
  const day = pad(randomInt(rng, 1, 28));
  return {
    resourceType: 'Patient',
    id,
    meta: syntheticMeta(),
    identifier: [{ system: `${ACME_IDENTIFIER_SYSTEM}/patient`, value: `SYN-P-${pad(index)}` }],
    active: true,
    name: [{ use: 'official', family: 'Synthetica', given: [GIVEN_NAMES[index - 1]] }],
    gender: rng() > 0.5 ? 'female' : 'male',
    birthDate: `${year}-${month}-${day}`,
    address: [
      {
        use: 'home',
        line: [`${100 + index} Synthetic Way`],
        city: 'Example City',
        state: 'EX',
        postalCode: `000${pad(index)}`,
        country: 'US',
      },
    ],
  };
}

function createDevice(index: number): Device {
  const id = `acme-cardio-device-${pad(index)}`;
  return {
    resourceType: 'Device',
    id,
    meta: syntheticMeta(),
    identifier: [{ system: `${ACME_IDENTIFIER_SYSTEM}/device`, value: `ACP-V2-SN-${pad(index)}` }],
    definition: { reference: 'DeviceDefinition/acme-cardio-patch-v2' },
    status: 'active',
    manufacturer: 'Acme Cardio',
    serialNumber: `ACP2-2025-${pad(index)}`,
    deviceName: [{ name: 'Acme Cardio patch v2', type: 'model-name' }],
    modelNumber: 'ACP-V2',
    type: {
      coding: [
        {
          system: ACME_DEVICE_TYPE_SYSTEM,
          code: 'cardio-patch-v2',
          display: 'Acme Cardio patch v2',
        },
      ],
      text: 'Acme Cardio patch v2',
    },
    patient: { reference: `Patient/acme-cardio-patient-${pad(index)}` },
    owner: { reference: 'Organization/acme-cardio-org' },
  };
}

function createBloodPressure(index: number, systolic: number, diastolic: number): Observation {
  const id = `acme-cardio-bp-${pad(index)}`;
  return {
    resourceType: 'Observation',
    id,
    meta: syntheticMeta(),
    identifier: [{ system: `${ACME_IDENTIFIER_SYSTEM}/observation`, value: id }],
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
    code: { coding: [loinc(BP_PANEL_CODE)], text: LOINC_DISPLAY[BP_PANEL_CODE] },
    subject: { reference: `Patient/acme-cardio-patient-${pad(index)}` },
    device: { reference: `Device/acme-cardio-device-${pad(index)}` },
    effectiveDateTime: `2025-10-15T0${(index % 8) + 1}:15:00Z`,
    component: [
      {
        code: { coding: [loinc(SYSTOLIC_CODE)], text: LOINC_DISPLAY[SYSTOLIC_CODE] },
        valueQuantity: quantity(systolic, 'mm[Hg]'),
      },
      {
        code: { coding: [loinc(DIASTOLIC_CODE)], text: LOINC_DISPLAY[DIASTOLIC_CODE] },
        valueQuantity: quantity(diastolic, 'mm[Hg]'),
      },
    ],
  };
}

function createEcgSummary(
  index: number,
  rng: () => number,
  heartRate: number,
  prInterval: number,
  qrsDuration: number,
  qtInterval: number
): Observation {
  const id = `acme-cardio-ecg-${pad(index)}`;
  const sampled = generateWaveform(rng, heartRate);
  const interpretation = heartRate < 60 ? 'Sinus bradycardia' : heartRate > 90 ? 'Sinus tachycardia' : 'Normal sinus rhythm';
  return {
    resourceType: 'Observation',
    id,
    meta: syntheticMeta(),
    identifier: [{ system: `${ACME_IDENTIFIER_SYSTEM}/observation`, value: id }],
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
    code: { coding: [loinc(EKG_STUDY_CODE)], text: LOINC_DISPLAY[EKG_STUDY_CODE] },
    subject: { reference: `Patient/acme-cardio-patient-${pad(index)}` },
    device: { reference: `Device/acme-cardio-device-${pad(index)}` },
    effectiveDateTime: `2025-10-15T0${(index % 8) + 1}:16:00Z`,
    valueSampledData: sampled,
    component: [
      {
        code: { coding: [loinc(HEART_RATE_CODE)], text: LOINC_DISPLAY[HEART_RATE_CODE] },
        valueQuantity: quantity(heartRate, '/min'),
      },
      {
        code: {
          coding: [{ system: ACME_ECG_CODE_SYSTEM, code: ACME_ECG_CODES.prInterval, display: 'PR interval' }],
          text: 'PR interval',
        },
        valueQuantity: quantity(prInterval, 'ms'),
      },
      {
        code: {
          coding: [{ system: ACME_ECG_CODE_SYSTEM, code: ACME_ECG_CODES.qrsDuration, display: 'QRS duration' }],
          text: 'QRS duration',
        },
        valueQuantity: quantity(qrsDuration, 'ms'),
      },
      {
        code: {
          coding: [{ system: ACME_ECG_CODE_SYSTEM, code: ACME_ECG_CODES.qtInterval, display: 'QT interval' }],
          text: 'QT interval',
        },
        valueQuantity: quantity(qtInterval, 'ms'),
      },
      {
        code: {
          coding: [{ system: ACME_ECG_CODE_SYSTEM, code: ACME_ECG_CODES.interpretation, display: 'ECG interpretation' }],
          text: 'ECG interpretation',
        },
        valueString: interpretation,
      },
      {
        code: {
          coding: [{ system: ACME_ECG_CODE_SYSTEM, code: ACME_ECG_CODES.leadII, display: 'Lead II waveform' }],
          text: 'Lead II waveform',
        },
        valueSampledData: sampled,
      },
    ],
  };
}

function toEntry(resource: Resource): BundleEntry {
  return {
    fullUrl: `${resource.resourceType}/${resource.id}`,
    resource,
    request: { method: 'PUT', url: `${resource.resourceType}/${resource.id}` },
  };
}

export function generateBundle(seed: number = GENERATOR_SEED): Bundle {
  const rng = mulberry32(seed);
  const resources: Resource[] = [createOrganization(), createDeviceDefinition()];

  for (let index = 1; index <= PATIENT_COUNT; index++) {
    const systolic = randomInt(rng, 108, 142);
    const diastolic = randomInt(rng, 68, Math.min(92, systolic - 30));
    const heartRate = randomInt(rng, 54, 98);
    const prInterval = randomInt(rng, 120, 200);
    const qrsDuration = randomInt(rng, 80, 110);
    const qtInterval = randomInt(rng, 350, 440);
    resources.push(
      createPatient(index, rng),
      createDevice(index),
      createBloodPressure(index, systolic, diastolic),
      createEcgSummary(index, rng, heartRate, prInterval, qrsDuration, qtInterval)
    );
  }

  if (!resources.every(isSynthetic)) {
    throw new Error('Generator produced a resource without the synthetic flag');
  }

  return {
    resourceType: 'Bundle',
    id: 'acme-cardio-patch-v2-cohort',
    meta: syntheticMeta(),
    type: 'transaction',
    timestamp: '2025-10-15T12:00:00Z',
    entry: resources.map(toEntry),
  };
}

export function buildManifest(bundle: Bundle, seed: number = GENERATOR_SEED): DeviceEvidenceManifest {
  const resources: ResourceRef[] = [];
  const counts: Record<string, number> = {};
  for (const entry of bundle.entry ?? []) {
    const resource = entry.resource;
    if (!resource?.id) {
      continue;
    }
    resources.push({ resourceType: resource.resourceType, id: resource.id });
    counts[resource.resourceType] = (counts[resource.resourceType] ?? 0) + 1;
  }
  counts.total = resources.length;
  return {
    seed,
    seedLabel: GENERATOR_SEED_LABEL,
    generatedAt: '2025-10-15T12:00:00Z',
    synthetic: true,
    phi: false,
    counts,
    resources,
  };
}

export function bundleResources(bundle: Bundle): Resource[] {
  return (bundle.entry ?? []).map((entry) => entry.resource).filter((resource): resource is Resource => !!resource);
}
