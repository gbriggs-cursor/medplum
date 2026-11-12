// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

import { indexSearchParameterBundle, indexStructureDefinitionBundle, validateResource } from '@medplum/core';
import { readJson, SEARCH_PARAMETER_BUNDLE_FILES } from '@medplum/definitions';
import type { Bundle, CarePlan, Observation, Patient, Resource, SearchParameter } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import assert from 'node:assert/strict';
import { beforeAll, test } from 'vitest';
import {
  acceptTreatmentPlan,
  bookRecall,
  CDT,
  createRecall,
  createTreatmentPlan,
  findDueRecalls,
  lowerRightFirstMolar,
  recordCompletedProcedure,
  recordPerioExam,
  surface,
  tooth,
} from './dental-data-model.js';

beforeAll(() => {
  indexStructureDefinitionBundle(readJson('fhir/r4/profiles-types.json') as Bundle);
  indexStructureDefinitionBundle(readJson('fhir/r4/profiles-resources.json') as Bundle);
  for (const file of SEARCH_PARAMETER_BUNDLE_FILES) {
    indexSearchParameterBundle(readJson(file) as Bundle<SearchParameter>);
  }
});

async function setup(): Promise<{ medplum: MockClient; patient: Patient }> {
  const medplum = new MockClient();
  const patient = await medplum.createResource<Patient>({ resourceType: 'Patient', name: [{ family: 'Synthetic' }] });
  return { medplum, patient };
}

function assertValid(resource: Resource | undefined): void {
  assert.ok(resource);
  assert.deepEqual(validateResource(resource), []);
}

test('treatment plan links draft requests, then accepting activates plan and requests', async () => {
  const { medplum, patient } = await setup();
  const result = await createTreatmentPlan(medplum, patient, [
    {
      cdt: { system: CDT, code: 'EXAMPLE-RESIN-2S-POST' },
      bodySite: [lowerRightFirstMolar, surface('MO', 'Mesioclusal')],
    },
    { cdt: { system: CDT, code: 'EXAMPLE-CROWN' }, bodySite: [tooth('16', '3')] },
  ]);
  const resources = result.entry?.map((e) => e.resource) ?? [];
  resources.forEach(assertValid);

  const plan = resources.find((r) => r?.resourceType === 'CarePlan') as CarePlan;
  assert.equal(plan.activity?.length, 2);
  const accepted = await acceptTreatmentPlan(medplum, plan);
  assert.equal(accepted.status, 'active');
  const active = await medplum.searchResources('ServiceRequest', {
    subject: `Patient/${patient.id}`,
    status: 'active',
  });
  assert.equal(active.length, 2);

  const procedure = await recordCompletedProcedure(medplum, patient, active[0]);
  assertValid(procedure);
  assert.equal(procedure.basedOn?.[0].reference, `ServiceRequest/${active[0].id}`);
});

test('recalls are found by due date and booked as appointments', async () => {
  const { medplum, patient } = await setup();
  const due = await createRecall(medplum, patient, '2026-12-01');
  await createRecall(medplum, patient, '2027-06-01');
  assertValid(due);

  const recalls = await findDueRecalls(medplum, '2026-12-31');
  assert.deepEqual(
    recalls.map((r) => r.id),
    [due.id]
  );

  const appointment = await bookRecall(medplum, due, '2026-12-01T15:00:00Z', '2026-12-01T16:00:00Z');
  assertValid(appointment);
  const booked = await medplum.searchResources('Appointment', { 'based-on': `ServiceRequest/${due.id}` });
  assert.equal(booked.length, 1);
});

test('perio exam stores one Observation per tooth under a panel', async () => {
  const { medplum, patient } = await setup();
  const result = await recordPerioExam(medplum, patient, [
    { fdi: '46', depthsMm: [3, 2, 4, 3, 2, 5], bleeding: [false, false, true, false, false, true] },
    { fdi: '47', depthsMm: [2, 2, 3, 2, 2, 3], bleeding: [false, false, false, false, false, false] },
  ]);
  const observations = (result.entry?.map((e) => e.resource) ?? []) as Observation[];
  observations.forEach(assertValid);

  const panel = observations.find((o) => o.hasMember);
  assert.equal(panel?.hasMember?.length, 2);
  assert.ok(panel?.hasMember);
  const member = await medplum.readReference(panel.hasMember[0]);
  assert.equal((member as Observation).component?.length, 12);
});
