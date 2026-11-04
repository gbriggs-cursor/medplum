// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { formatObservationValue } from '@medplum/core';
import type { Device, Observation, Patient } from '@medplum/fhirtypes';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEcgSummary } from './ecg-summary-parser';
import { bundleResources, generateBundle } from './generate';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function main(): void {
  const resources = bundleResources(generateBundle());
  const patients = resources.filter((resource): resource is Patient => resource.resourceType === 'Patient');
  const devices = resources.filter((resource): resource is Device => resource.resourceType === 'Device');
  const observations = resources.filter((resource): resource is Observation => resource.resourceType === 'Observation');
  const rows = patients.map((patient) => {
    const subject = `Patient/${patient.id}`;
    const bp = observations.find((obs) => obs.subject?.reference === subject && obs.code?.coding?.[0]?.code === '85354-9');
    const ecg = observations.find((obs) => obs.subject?.reference === subject && obs.code?.coding?.[0]?.code === '11524-6');
    const device = devices.find((item) => item.patient?.reference === subject);
    const summary = ecg ? parseEcgSummary(ecg) : undefined;
    return {
      patient: `${patient.name?.[0]?.given?.[0]} ${patient.name?.[0]?.family}`,
      patientId: patient.id,
      device: device?.serialNumber ?? '',
      bp: formatObservationValue(bp),
      ecg: formatObservationValue(ecg),
      heartRate: summary?.heartRate ?? '',
      interpretation: summary?.interpretation ?? '',
      samples: summary?.sampled?.samples.length ?? 0,
    };
  });

  const first = rows[0];
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Acme Cardio patch v2 — device evidence</title>
  <style>
    @font-face { font-family: EvidenceSans; src: url("./DejaVuSans.ttf") format("truetype"); }
    body { font-family: EvidenceSans, "DejaVu Sans", Arial, sans-serif; margin: 32px; color: #1a1a1a; word-spacing: 0.15em; }
    h1 { margin-bottom: 4px; }
    .banner { background: #fff3cd; border: 1px solid #e6c35c; padding: 8px 12px; margin: 16px 0; }
    table { border-collapse: collapse; width: 100%; font-size: 14px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #f4f6f8; }
    .vitals { display: grid; grid-template-columns: 160px 1fr; gap: 8px 16px; max-width: 640px; }
    .vitals div { padding: 8px 10px; background: #f7f9fb; border: 1px solid #d9e1ea; }
    .label { color: #5c6b7a; font-weight: 600; }
  </style>
</head>
<body>
  <h1>Foo Medical Vitals — Acme Cardio patch v2</h1>
  <p>Synthetic cohort only. Seed 20251104. No PHI.</p>
  <div class="banner">Every resource is tagged synthetic. This is fictional wearable-patch data for a Boston Scientific CDx demo.</div>
  <h2>Patient 01 as Foo Medical would list it</h2>
  <div class="vitals">
    <div class="label">Patient</div><div>${first.patient} (${first.patientId})</div>
    <div class="label">Device</div><div>Acme Cardio patch v2 · ${first.device}</div>
    <div class="label">Blood pressure panel</div><div>${first.bp}</div>
    <div class="label">EKG study (formatted)</div><div>${first.ecg}</div>
    <div class="label">Parsed heart rate</div><div>${first.heartRate} /min</div>
    <div class="label">Parsed interpretation</div><div>${first.interpretation}</div>
    <div class="label">SampledData points</div><div>${first.samples} Lead II samples</div>
  </div>
  <h2>Full synthetic cohort</h2>
  <table>
    <thead>
      <tr>
        <th>Patient</th>
        <th>Device serial</th>
        <th>Blood pressure</th>
        <th>ECG heart rate</th>
        <th>Interpretation</th>
        <th>Samples</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>
        <td>${row.patient}</td>
        <td>${row.device}</td>
        <td>${row.bp}</td>
        <td>${row.heartRate} /min</td>
        <td>${row.interpretation}</td>
        <td>${row.samples}</td>
      </tr>`
        )
        .join('\n')}
    </tbody>
  </table>
</body>
</html>
`;
  mkdirSync(join(root, 'evidence', 'screenshots'), { recursive: true });
  writeFileSync(join(root, 'evidence', 'preview.html'), html);
}

main();
