// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type {
  Bundle,
  BundleEntry,
  CodeableConcept,
  Coding,
  Device,
  DeviceDefinition,
  Observation,
  ObservationComponent,
  Patient,
  Resource,
} from '@medplum/fhirtypes';
import { SYNTHETIC_TAGS, storyTags } from '../../../_shared/fhir/tags.mjs';

export const REQUIREMENT_ID = 'REQ-001';
export const DEFAULT_SEED = 20261104;
export const PATIENT_COUNT = 20;
export const STORY = 'device-evidence';
export const BUNDLE_PATH = 'data/acme-cardio-patch-v2.bundle.json';

export const LOINC = 'http://loinc.org';
export const SNOMED = 'http://snomed.info/sct';
export const UCUM = 'http://unitsofmeasure.org';
export const MDC = 'urn:oid:2.16.840.1.113883.6.24';
export const OBSERVATION_CATEGORY = 'http://terminology.hl7.org/CodeSystem/observation-category';

export const ACME = {
  manufacturer: 'Acme Cardio',
  deviceName: 'Acme Cardio patch v2',
  modelNumber: 'ACP-2',
  version: '2.0',
  firmware: ['2.0.3', '2.0.4', '2.1.0'],
  serialSystem: 'https://acme-cardio.example/fhir/sid/serial-number',
  definitionSystem: 'https://acme-cardio.example/fhir/sid/device-definition',
  mrnSystem: 'https://acme-cardio.example/fhir/sid/synthetic-mrn',
} as const;

export const CODES = {
  bpPanel: { system: LOINC, code: '85354-9', display: 'Blood pressure panel with all children optional' },
  systolic: { system: LOINC, code: '8480-6', display: 'Systolic blood pressure' },
  diastolic: { system: LOINC, code: '8462-4', display: 'Diastolic blood pressure' },
  ecg: { system: LOINC, code: '11524-6', display: 'EKG study' },
  heartRate: { system: LOINC, code: '8867-4', display: 'Heart rate' },
  prInterval: { system: LOINC, code: '8625-6', display: 'P-R Interval' },
  qrsDuration: { system: LOINC, code: '8633-0', display: 'QRS duration' },
  qtInterval: { system: LOINC, code: '8634-8', display: 'Q-T interval' },
  qtcInterval: { system: LOINC, code: '8636-3', display: 'Q-T interval corrected' },
  rhythm: { system: LOINC, code: '8884-9', display: 'Heart rate rhythm' },
  leadI: { system: MDC, code: '131329', display: 'MDC_ECG_ELEC_POTL_I' },
} satisfies Record<string, Coding>;

export const RHYTHMS = {
  sinus: { system: SNOMED, code: '426783006', display: 'Normal sinus rhythm' },
  sinusBradycardia: { system: SNOMED, code: '426177001', display: 'Sinus bradycardia' },
  sinusTachycardia: { system: SNOMED, code: '11092001', display: 'Sinus tachycardia' },
  atrialFibrillation: { system: SNOMED, code: '49436004', display: 'Atrial fibrillation' },
} satisfies Record<string, Coding>;

export const ECG_SAMPLE_PERIOD_MS = 4;
export const ECG_DURATION_SECONDS = 10;
export const ECG_FACTOR_MV = 0.001;

const GIVEN_NAMES = [
  'Avery',
  'Blake',
  'Casey',
  'Devon',
  'Emerson',
  'Finley',
  'Harper',
  'Indigo',
  'Jordan',
  'Kendall',
  'Logan',
  'Morgan',
  'Noel',
  'Oakley',
  'Parker',
  'Quinn',
  'Riley',
  'Sage',
  'Taylor',
  'Wren',
];
const FAMILY_NAMES = ['Synthpatch', 'Testwell', 'Mockridge', 'Fauxley', 'Sampleton', 'Demoford', 'Fictor', 'Placeholt'];

export interface CohortManifest {
  requirement: string;
  seed: number;
  synthetic: true;
  tags: Coding[];
  prospect: string;
  device: string;
  bundle: string;
  generator: string;
  counts: {
    Patient: number;
    DeviceDefinition: number;
    Device: number;
    Observation: number;
    bloodPressurePanels: number;
    ecgObservations: number;
    atrialFibrillation: number;
    total: number;
  };
  resources: {
    Patient: string[];
    DeviceDefinition: string[];
    Device: string[];
    Observation: string[];
  };
  patients: {
    patient: string;
    deviceDefinition: string;
    device: string;
    bloodPressure: string;
    ecg: string;
  }[];
}

export interface Cohort {
  bundle: Bundle;
  manifest: CohortManifest;
}

/**
 * mulberry32: small, fast, and fully determined by the 32-bit seed.
 * @param seed - 32-bit integer seed.
 * @returns A generator of floats in [0, 1).
 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededUuid(random: () => number): string {
  const bytes = Array.from({ length: 16 }, () => Math.floor(random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

function intBetween(random: () => number, min: number, max: number): number {
  return Math.floor(between(random, min, max + 1));
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)];
}

function gaussian(t: number, center: number, width: number, amplitude: number): number {
  const d = (t - center) / width;
  return amplitude * Math.exp(-0.5 * d * d);
}

function quantity(value: number, unit: string, code = unit): ObservationComponent['valueQuantity'] {
  return { value, unit, system: UCUM, code };
}

export interface EcgTruth {
  heartRate: number;
  prInterval?: number;
  qrsDuration: number;
  qtInterval: number;
  qtcInterval: number;
  rhythm: Coding;
  samples: number[];
}

/**
 * Synthesizes one lead of a plausible ECG: Gaussian P, Q, R, S, and T waves per beat,
 * plus baseline wander and noise. Atrial fibrillation drops the P wave and randomizes RR.
 * @param random - Seeded random source.
 * @param atrialFibrillation - Whether to synthesize an irregular rhythm without P waves.
 * @returns The samples and the intervals they were built from.
 */
export function synthesizeEcg(random: () => number, atrialFibrillation: boolean): EcgTruth {
  const targetRate = atrialFibrillation ? between(random, 85, 125) : between(random, 50, 112);
  const baseRr = 60 / targetRate;
  const qrsSeconds = between(random, 0.08, 0.11);
  const prSeconds = between(random, 0.12, 0.2);
  const prolongedQtc = random() < 0.1;
  const qtcSeconds = prolongedQtc ? between(random, 0.47, 0.5) : between(random, 0.38, 0.44);
  const rAmplitude = between(random, 1.0, 1.5);
  const wanderPhase = between(random, 0, 2 * Math.PI);

  const totalSeconds = ECG_DURATION_SECONDS;
  const beats: number[] = [];
  for (let t = between(random, 0.25, 0.6); t < totalSeconds - 0.3;) {
    beats.push(t);
    const jitter = atrialFibrillation ? (random() * 2 - 1) * 0.3 : (random() * 2 - 1) * 0.02;
    t += baseRr * (1 + jitter);
  }

  const rrIntervals = beats.slice(1).map((b, i) => b - beats[i]);
  const meanRr = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
  const qtSeconds = qtcSeconds * Math.sqrt(meanRr);

  const sampleCount = Math.round((totalSeconds * 1000) / ECG_SAMPLE_PERIOD_MS);
  const samples: number[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const t = (i * ECG_SAMPLE_PERIOD_MS) / 1000;
    let mv = 0.05 * Math.sin(2 * Math.PI * 0.3 * t + wanderPhase) + (random() * 2 - 1) * 0.02;
    for (const b of beats) {
      if (Math.abs(t - b) > 0.8) {
        continue;
      }
      const qOnset = b - qrsSeconds / 2;
      if (!atrialFibrillation) {
        mv += gaussian(t, b - prSeconds + 0.04, 0.025, 0.15);
      }
      mv += gaussian(t, qOnset + 0.01, 0.01, -0.1);
      mv += gaussian(t, b, qrsSeconds / 6, rAmplitude);
      mv += gaussian(t, b + qrsSeconds / 2 - 0.01, 0.012, -0.25);
      mv += gaussian(t, qOnset + qtSeconds - 0.08, 0.045, 0.3);
    }
    samples.push(Math.round(mv / ECG_FACTOR_MV));
  }

  const heartRate = Math.round(60 / meanRr);
  let rhythm: Coding = RHYTHMS.sinus;
  if (atrialFibrillation) {
    rhythm = RHYTHMS.atrialFibrillation;
  } else if (heartRate < 60) {
    rhythm = RHYTHMS.sinusBradycardia;
  } else if (heartRate > 100) {
    rhythm = RHYTHMS.sinusTachycardia;
  }

  return {
    heartRate,
    prInterval: atrialFibrillation ? undefined : Math.round(prSeconds * 1000),
    qrsDuration: Math.round(qrsSeconds * 1000),
    qtInterval: Math.round(qtSeconds * 1000),
    qtcInterval: Math.round(qtcSeconds * 1000),
    rhythm,
    samples,
  };
}

function concept(coding: Coding): CodeableConcept {
  return { coding: [coding], text: coding.display };
}

function entry(resource: Resource & { id: string }): BundleEntry {
  return {
    fullUrl: `urn:uuid:${resource.id}`,
    resource,
    request: { method: 'PUT', url: `${resource.resourceType}/${resource.id}` },
  };
}

export function buildCohort(seed: number = DEFAULT_SEED, count: number = PATIENT_COUNT): Cohort {
  const random = createRandom(seed);
  const meta = (): Resource['meta'] => ({ tag: storyTags(STORY) });
  const base = Date.UTC(2026, 10, 4, 8, 0, 0);

  const patients: Patient[] = [];
  const definitions: DeviceDefinition[] = [];
  const devices: Device[] = [];
  const bpPanels: Observation[] = [];
  const ecgs: Observation[] = [];
  const rows: CohortManifest['patients'] = [];

  for (let i = 0; i < count; i++) {
    const n = String(i + 1).padStart(4, '0');
    const patientId = seededUuid(random);
    const definitionId = seededUuid(random);
    const deviceId = seededUuid(random);
    const bpId = seededUuid(random);
    const ecgId = seededUuid(random);

    const gender = random() < 0.5 ? 'female' : 'male';
    const birthYear = intBetween(random, 1944, 1990);
    const birthDate = `${birthYear}-${String(intBetween(random, 1, 12)).padStart(2, '0')}-${String(intBetween(random, 1, 28)).padStart(2, '0')}`;
    const patientRef = { reference: `Patient/${patientId}` };
    const deviceRef = { reference: `Device/${deviceId}`, display: ACME.deviceName };

    patients.push({
      resourceType: 'Patient',
      id: patientId,
      meta: meta(),
      identifier: [{ system: ACME.mrnSystem, value: `SYN-${n}` }],
      name: [{ given: [GIVEN_NAMES[i % GIVEN_NAMES.length]], family: pick(random, FAMILY_NAMES) }],
      gender,
      birthDate,
    });

    definitions.push({
      resourceType: 'DeviceDefinition',
      id: definitionId,
      meta: meta(),
      identifier: [{ system: ACME.definitionSystem, value: `${ACME.modelNumber}-SYN-${n}` }],
      manufacturerString: ACME.manufacturer,
      deviceName: [{ name: ACME.deviceName, type: 'manufacturer-name' }],
      modelNumber: ACME.modelNumber,
      version: [ACME.version],
      capability: [{ type: { text: 'Non-invasive blood pressure' } }, { type: { text: 'Single-lead ECG (lead I)' } }],
    });

    devices.push({
      resourceType: 'Device',
      id: deviceId,
      meta: meta(),
      identifier: [{ system: ACME.serialSystem, value: `ACP2-SYN-${n}` }],
      definition: { reference: `DeviceDefinition/${definitionId}` },
      status: 'active',
      manufacturer: ACME.manufacturer,
      deviceName: [{ name: ACME.deviceName, type: 'user-friendly-name' }],
      modelNumber: ACME.modelNumber,
      serialNumber: `ACP2-SYN-${n}`,
      version: [{ type: { text: 'firmware' }, value: pick(random, ACME.firmware) }],
      patient: patientRef,
    });

    const bpTime = new Date(base - intBetween(random, 0, 13) * 86400000 + intBetween(random, 0, 600) * 60000);
    const hypertensive = random() < 0.3;
    const systolic = hypertensive ? intBetween(random, 140, 168) : intBetween(random, 104, 134);
    const diastolic = hypertensive ? intBetween(random, 88, 102) : intBetween(random, 64, 84);
    bpPanels.push({
      resourceType: 'Observation',
      id: bpId,
      meta: meta(),
      status: 'final',
      category: [{ coding: [{ system: OBSERVATION_CATEGORY, code: 'vital-signs', display: 'Vital Signs' }] }],
      code: concept(CODES.bpPanel),
      subject: patientRef,
      device: deviceRef,
      effectiveDateTime: bpTime.toISOString(),
      component: [
        { code: concept(CODES.systolic), valueQuantity: quantity(systolic, 'mm[Hg]') },
        { code: concept(CODES.diastolic), valueQuantity: quantity(diastolic, 'mm[Hg]') },
      ],
    });

    const af = random() < 0.12;
    const ecg = synthesizeEcg(random, af);
    const ecgTime = new Date(bpTime.getTime() + 5 * 60000);
    const components: ObservationComponent[] = [
      { code: concept(CODES.heartRate), valueQuantity: quantity(ecg.heartRate, '/min') },
    ];
    if (ecg.prInterval !== undefined) {
      components.push({ code: concept(CODES.prInterval), valueQuantity: quantity(ecg.prInterval, 'ms') });
    }
    components.push(
      { code: concept(CODES.qrsDuration), valueQuantity: quantity(ecg.qrsDuration, 'ms') },
      { code: concept(CODES.qtInterval), valueQuantity: quantity(ecg.qtInterval, 'ms') },
      { code: concept(CODES.qtcInterval), valueQuantity: quantity(ecg.qtcInterval, 'ms') },
      { code: concept(CODES.rhythm), valueCodeableConcept: concept(ecg.rhythm) },
      {
        code: concept(CODES.leadI),
        valueSampledData: {
          origin: { value: 0, unit: 'mV', system: UCUM, code: 'mV' },
          period: ECG_SAMPLE_PERIOD_MS,
          factor: ECG_FACTOR_MV,
          dimensions: 1,
          data: ecg.samples.join(' '),
        },
      }
    );
    ecgs.push({
      resourceType: 'Observation',
      id: ecgId,
      meta: meta(),
      status: 'final',
      category: [{ coding: [{ system: OBSERVATION_CATEGORY, code: 'procedure', display: 'Procedure' }] }],
      code: concept(CODES.ecg),
      subject: patientRef,
      device: deviceRef,
      effectiveDateTime: ecgTime.toISOString(),
      component: components,
    });

    rows.push({
      patient: patientId,
      deviceDefinition: definitionId,
      device: deviceId,
      bloodPressure: bpId,
      ecg: ecgId,
    });
  }

  const observations = [...bpPanels, ...ecgs];
  const all = [...patients, ...definitions, ...devices, ...observations] as (Resource & { id: string })[];

  const bundle: Bundle = {
    resourceType: 'Bundle',
    id: seededUuid(createRandom(seed ^ 0x5eed)),
    meta: meta(),
    type: 'transaction',
    entry: all.map(entry),
  };

  const ids = (list: { id?: string }[]): string[] => list.map((r) => r.id as string);
  const manifest: CohortManifest = {
    requirement: REQUIREMENT_ID,
    seed,
    synthetic: true,
    tags: SYNTHETIC_TAGS,
    prospect: ACME.manufacturer,
    device: ACME.deviceName,
    bundle: BUNDLE_PATH,
    generator: 'npx tsx src/generate.ts',
    counts: {
      Patient: patients.length,
      DeviceDefinition: definitions.length,
      Device: devices.length,
      Observation: observations.length,
      bloodPressurePanels: bpPanels.length,
      ecgObservations: ecgs.length,
      atrialFibrillation: ecgs.filter((o) =>
        o.component?.some((c) => c.valueCodeableConcept?.coding?.[0]?.code === RHYTHMS.atrialFibrillation.code)
      ).length,
      total: all.length,
    },
    resources: {
      Patient: ids(patients),
      DeviceDefinition: ids(definitions),
      Device: ids(devices),
      Observation: ids(observations),
    },
    patients: rows,
  };

  return { bundle, manifest };
}
