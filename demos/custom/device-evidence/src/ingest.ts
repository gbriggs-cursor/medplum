// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Bundle, Observation, Patient } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { GENERATOR_SEED } from './constants';
import { generateBundle } from './generate';

export async function ingestBundle(bundle: Bundle = generateBundle(GENERATOR_SEED)): Promise<MockClient> {
  const medplum = new MockClient({ seedDefaultData: false });
  const result = await medplum.executeBatch(bundle);
  if (!result.entry || result.entry.length !== bundle.entry?.length) {
    throw new Error(`Unexpected transaction response size: ${result.entry?.length ?? 0}`);
  }
  for (const entry of result.entry) {
    const status = entry.response?.status ?? '';
    if (!/^20[01]$/.test(status)) {
      throw new Error(`Bundle entry failed: ${entry.response?.location ?? 'unknown'} status ${status}`);
    }
  }
  return medplum;
}

export async function loadPatientCohort(
  patientId = 'acme-cardio-patient-01'
): Promise<{ medplum: MockClient; patient: Patient; observations: Observation[] }> {
  const medplum = await ingestBundle();
  const patient = await medplum.readResource('Patient', patientId);
  medplum.mock.setProfile(patient);
  const observations = await medplum.searchResources('Observation', {
    patient: `Patient/${patientId}`,
    _count: '50',
  });
  return { medplum, patient, observations };
}
