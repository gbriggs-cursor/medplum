import type { Observation } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { describe, expect, test } from 'vitest';
import { PAIRING_CODE, PAIRING_SYSTEM, handler, isSyntheticPairing } from '../bot/pairing-task';

const bot = { reference: 'Bot/pairing-task' };
const contentType = 'application/fhir+json';
const secrets = {};

function pairing(id?: string): Observation {
  return {
    resourceType: 'Observation',
    id,
    status: 'final',
    meta: {
      tag: [{ system: 'https://medplum.com/fhir/CodeSystem/synthetic', code: 'synthetic' }],
      security: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason', code: 'HTEST' }],
    },
    code: { coding: [{ system: PAIRING_SYSTEM, code: PAIRING_CODE }] },
    subject: { reference: 'Patient/acme-patient-00' },
    device: { reference: 'Device/acme-device-00' },
    valueString: 'paired',
  };
}

describe('pairing task bot', () => {
  test('creates a synthetic Task for a synthetic pairing Observation', async () => {
    const medplum = new MockClient();
    const created = await medplum.createResource(pairing());
    const task = await handler(medplum, { bot, contentType, secrets, input: created });
    expect(task.resourceType).toBe('Task');
    expect(task.status).toBe('requested');
    expect(task.focus).toEqual({ reference: `Observation/${created.id}` });
    expect(task.for).toEqual({ reference: 'Patient/acme-patient-00' });
    expect(isSyntheticPairing(created)).toBe(true);
    expect(task.meta?.tag?.[0]?.code).toBe('synthetic');
  });

  test('refuses an Observation that is not tagged synthetic and creates no Task', async () => {
    const medplum = new MockClient();
    const input = pairing('obs-plain');
    delete input.meta;
    let created = 0;
    const original = medplum.createResource.bind(medplum);
    medplum.createResource = (async (resource) => {
      created += 1;
      return original(resource);
    }) as typeof medplum.createResource;
    await expect(handler(medplum, { bot, contentType, secrets, input })).rejects.toThrow(/not a synthetic/);
    expect(created).toBe(0);
  });
});
