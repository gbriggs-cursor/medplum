// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

// Writes foo-medical-devices.bundle.json: one fictional patient, three Devices, and
// 30 days of Observation readings ending on ANCHOR. Every resource is synthetic.
// Usage: node demos/_shared/data/generate-foo-medical-devices.mjs

import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ANCHOR = Date.parse('2026-11-14T00:00:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const SEED = 20261114;

const meta = {
  tag: [{ system: 'https://medplum.com/fhir/CodeSystem/synthetic', code: 'synthetic', display: 'Synthetic' }],
  security: [
    { system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason', code: 'HTEST', display: 'test health data' },
  ],
};

// Medplum requires UUID ids, so each readable key maps to a stable name-based (v5) UUID.
const UUID_NAMESPACE = Buffer.from('6f6f6d65-6469-4361-8c2d-73796e746865'.replaceAll('-', ''), 'hex');
function uuid(key) {
  const hash = createHash('sha1').update(UUID_NAMESPACE).update(key).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

let state = SEED;
function rand() {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
}
function around(center, spread) {
  return Math.round(center + (rand() * 2 - 1) * spread);
}
function at(daysAgo, hour) {
  return new Date(ANCHOR - daysAgo * DAY_MS + hour * 60 * 60 * 1000).toISOString().replace('.000Z', 'Z');
}
function loinc(code, display) {
  return { coding: [{ system: 'http://loinc.org', code, display }], text: display };
}
function ucum(value, unit, code) {
  return { value, unit, system: 'http://unitsofmeasure.org', code };
}

const patientRef = { reference: `Patient/${uuid('foo-patient-01')}`, display: 'Avery Synthetic' };
const vitalSigns = [
  {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs',
      },
    ],
  },
];

const patient = {
  resourceType: 'Patient',
  id: uuid('foo-patient-01'),
  meta,
  identifier: [{ system: 'https://foo-medical.example/synthetic/patient', value: 'foo-patient-01' }],
  name: [{ use: 'official', family: 'Synthetic', given: ['Avery'] }],
  gender: 'female',
  birthDate: '1968-03-02',
};

function device(key, name, type, manufacturer, serialNumber, status) {
  return {
    resourceType: 'Device',
    id: uuid(key),
    meta,
    identifier: [{ system: 'https://foo-medical.example/synthetic/device', value: serialNumber }],
    status,
    manufacturer,
    serialNumber,
    deviceName: [{ name, type: 'user-friendly-name' }],
    type: { text: type },
    patient: patientRef,
  };
}

const devices = [
  device(
    'foo-bp-cuff-01',
    'Foo Home BP Cuff',
    'Blood pressure monitor',
    'Foo Devices (synthetic)',
    'FBP-0001',
    'active'
  ),
  device('foo-oximeter-01', 'Foo Pulse Oximeter', 'Pulse oximeter', 'Foo Devices (synthetic)', 'FOX-0001', 'active'),
  device('foo-glucometer-01', 'Foo Glucometer', 'Glucose meter', 'Foo Devices (synthetic)', 'FGL-0001', 'inactive'),
];

function observation(key, deviceKey, code, effectiveDateTime, value) {
  return {
    resourceType: 'Observation',
    id: uuid(key),
    meta,
    identifier: [{ system: 'https://foo-medical.example/synthetic/observation', value: key }],
    status: 'final',
    category: vitalSigns,
    code,
    subject: patientRef,
    device: { reference: `Device/${uuid(deviceKey)}` },
    effectiveDateTime,
    ...value,
  };
}

function bloodPressure(daysAgo) {
  return observation(
    `foo-bp-${String(daysAgo).padStart(2, '0')}`,
    'foo-bp-cuff-01',
    loinc('85354-9', 'Blood pressure panel'),
    at(daysAgo, 8),
    {
      component: [
        { code: loinc('8480-6', 'Systolic blood pressure'), valueQuantity: ucum(around(128, 8), 'mmHg', 'mm[Hg]') },
        { code: loinc('8462-4', 'Diastolic blood pressure'), valueQuantity: ucum(around(82, 5), 'mmHg', 'mm[Hg]') },
      ],
    }
  );
}

const observations = [];
for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
  observations.push(bloodPressure(daysAgo));
}
// Older than the 30-day window, so the Devices tab must leave it out.
observations.push(bloodPressure(45));

for (let daysAgo = 28; daysAgo >= 0; daysAgo -= 2) {
  const suffix = String(daysAgo).padStart(2, '0');
  observations.push(
    observation(`foo-spo2-${suffix}`, 'foo-oximeter-01', loinc('59408-5', 'Oxygen saturation'), at(daysAgo, 6), {
      valueQuantity: ucum(around(96, 2), '%', '%'),
    }),
    observation(`foo-hr-${suffix}`, 'foo-oximeter-01', loinc('8867-4', 'Heart rate'), at(daysAgo, 6), {
      valueQuantity: ucum(around(72, 6), 'beats/minute', '/min'),
    })
  );
}

// The glucometer's last reading is outside the window.
observations.push(
  observation('foo-glucose-60', 'foo-glucometer-01', loinc('2339-0', 'Glucose [Mass/volume] in Blood'), at(60, 7), {
    valueQuantity: ucum(around(104, 10), 'mg/dL', 'mg/dL'),
  })
);

const resources = [patient, ...devices, ...observations];
const bundle = {
  resourceType: 'Bundle',
  type: 'batch',
  meta,
  entry: resources.map((resource) => ({
    resource,
    request: { method: 'PUT', url: `${resource.resourceType}/${resource.id}` },
  })),
};

const out = join(dirname(fileURLToPath(import.meta.url)), 'foo-medical-devices.bundle.json');
writeFileSync(out, JSON.stringify(bundle, null, 2) + '\n');
console.log(`Wrote ${resources.length} synthetic resources to ${out}`);
