#!/usr/bin/env node
// Checks the Story A seed: PRD, synthetic bundle, Project Context files, and the UAT skill.
// Also proves the Devices feature is not in this tree (PR #10 stays unmerged).
//
//   node demos/test-review/offline.mjs
//   node demos/test-review/offline.mjs --as-of <YYYY-MM-DD> --write <file>   re-date a bundle copy so day 30 is that date

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isSynthetic } from '../_shared/fhir/tags.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const bundlePath = join(repoRoot, 'demos/_shared/data/taylor-demo-bp-cuff.json');
const prdPath = join(repoRoot, 'demos/test-review/prd-patient-devices.md');
const DAY_MS = 86400000;

const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));
const resources = bundle.entry.map((e) => e.resource);
const observations = resources.filter((r) => r.resourceType === 'Observation');
const times = observations.map((o) => Date.parse(o.effectiveDateTime));

const args = process.argv.slice(2);
const asOfIdx = args.indexOf('--as-of');
if (asOfIdx !== -1) {
  const asOf = args[asOfIdx + 1];
  const out = args[args.indexOf('--write') + 1];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf ?? '') || args.indexOf('--write') === -1 || !out) {
    console.error('usage: offline.mjs --as-of <YYYY-MM-DD> --write <file>');
    process.exit(2);
  }
  const latest = Math.max(...times);
  const shift = Date.parse(`${asOf}T14:00:00Z`) - latest;
  for (const o of observations) {
    o.effectiveDateTime = new Date(Date.parse(o.effectiveDateTime) + shift).toISOString().replace('.000Z', 'Z');
  }
  writeFileSync(out, JSON.stringify(bundle, null, 2) + '\n');
  console.log(`Wrote ${out}: 12 readings from day 0 to day 30 ending ${asOf}`);
  process.exit(0);
}

const results = [];
const check = (name, ok) => results.push({ name, ok: Boolean(ok) });
const component = (o, code) => o.component?.find((c) => c.code?.coding?.some((x) => x.code === code))?.valueQuantity;

const prd = readFileSync(prdPath, 'utf8');
for (const id of ['REQ-DEV-01', 'REQ-DEV-02', 'REQ-DEV-03', 'REQ-DEV-04', 'RISK-DEV-01']) {
  check(`PRD has ${id}`, prd.includes(`| ${id} |`));
}
check('PRD names /Patient/:id/devices', prd.includes('/Patient/:id/devices'));
check(
  'PRD names LOINC 85354-9, 8480-6, 8462-4 in mmHg',
  ['85354-9', '8480-6', '8462-4', 'mmHg'].every((s) => prd.includes(s))
);
check(
  'PRD says FHIR search only, no new backend or chart library',
  /FHIR search only/.test(prd) && /No new backend/.test(prd) && /chart library/.test(prd)
);

const patients = resources.filter((r) => r.resourceType === 'Patient');
const devices = resources.filter((r) => r.resourceType === 'Device');
check(
  'Bundle has one Patient, Taylor Demo',
  patients.length === 1 && patients[0].name?.[0]?.given?.[0] === 'Taylor' && patients[0].name?.[0]?.family === 'Demo'
);
check(
  'Bundle has one home BP cuff Device for the patient',
  devices.length === 1 && devices[0].patient?.reference === bundle.entry[0].fullUrl
);
check(
  'Bundle has 12 BP panels (85354-9)',
  observations.length === 12 && observations.every((o) => o.code?.coding?.[0]?.code === '85354-9')
);
check(
  'Every reading has systolic 8480-6 and diastolic 8462-4 in mm[Hg]',
  observations.every((o) => ['8480-6', '8462-4'].every((c) => component(o, c)?.code === 'mm[Hg]'))
);
const latest = observations[times.indexOf(Math.max(...times))];
check(
  'Latest reading is 117/75',
  component(latest, '8480-6')?.value === 117 && component(latest, '8462-4')?.value === 75
);
check('Readings span day 0 to day 30', Math.max(...times) - Math.min(...times) === 30 * DAY_MS);
check('Every resource is tagged synthetic and HTEST', resources.every(isSynthetic));

for (const f of ['architecture.md', 'how-to-test.md', 'evidence.md', 'personas.md', 'contracts/.gitkeep']) {
  check(`Project Context file context/${f}`, existsSync(join(repoRoot, 'demos/test-review/context', f)));
}
check('UAT skill exists', existsSync(join(repoRoot, '.cursor/skills/uat-from-acceptance-criteria/SKILL.md')));
check(
  'Devices feature is not in this tree (PR #10 stays unmerged)',
  !existsSync(join(repoRoot, 'packages/react/src/PatientDevices')) &&
    !existsSync(join(repoRoot, 'packages/app/src/resource/DevicesPage.tsx'))
);

for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`);
}
const failed = results.filter((r) => !r.ok).length;
if (failed) {
  console.log(`FAIL: L19 Story A seed (${results.length - failed} passed, ${failed} failed)`);
  process.exit(1);
}
console.log(`PASS: OFFLINE (no key) L19 Story A seed (${results.length} passed, 0 failed)`);
