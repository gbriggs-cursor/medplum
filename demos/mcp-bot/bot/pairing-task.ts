import type { BotEvent, MedplumClient } from '@medplum/core';
import type { Observation, Task } from '@medplum/fhirtypes';

const SYNTHETIC = 'https://medplum.com/fhir/CodeSystem/synthetic';
const HTEST = 'http://terminology.hl7.org/CodeSystem/v3-ActReason';
export const PAIRING_SYSTEM = 'https://acme-cardio.example/synthetic/observation';
export const PAIRING_CODE = 'device-pairing';

export function isSyntheticPairing(observation: Observation | undefined): boolean {
  if (!observation || observation.resourceType !== 'Observation') {
    return false;
  }
  const tag = observation.meta?.tag?.some((coding) => coding.system === SYNTHETIC && coding.code === 'synthetic');
  const security = observation.meta?.security?.some((coding) => coding.system === HTEST && coding.code === 'HTEST');
  const code = observation.code?.coding?.some(
    (coding) => coding.system === PAIRING_SYSTEM && coding.code === PAIRING_CODE
  );
  return Boolean(tag && security && code);
}

export async function handler(medplum: MedplumClient, event: BotEvent<Observation>): Promise<Task> {
  const observation = event.input;
  if (!isSyntheticPairing(observation) || !observation.id) {
    throw new Error('Refusing input that is not a synthetic device-pairing Observation');
  }
  return medplum.createResource<Task>({
    resourceType: 'Task',
    status: 'requested',
    intent: 'order',
    description: 'Review synthetic device pairing',
    for: observation.subject,
    focus: { reference: `Observation/${observation.id}` },
    meta: {
      tag: [{ system: SYNTHETIC, code: 'synthetic', display: 'Synthetic' }],
      security: [{ system: HTEST, code: 'HTEST', display: 'test health data' }],
    },
  });
}
