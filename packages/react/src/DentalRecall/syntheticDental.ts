// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { MedplumClient, WithId } from '@medplum/core';
import { createReference, getReferenceString } from '@medplum/core';
import type { CarePlan, CodeableConcept, Coding, Meta, Patient, Procedure, ServiceRequest } from '@medplum/fhirtypes';
import {
  CDT_SYSTEM,
  DENTAL_CARE_SYSTEM,
  HYGIENE_RECALL_CODE,
  SYNTHETIC_SECURITY,
  TREATMENT_PLAN_CODE,
  UNIVERSAL_TOOTH_SYSTEM,
} from './codes';

const PATIENT_IDENTIFIER_SYSTEM = 'urn:medplum:synthetic-patient';
const CHART_IDENTIFIER_SYSTEM = 'urn:medplum:synthetic-dental';

export interface SeededDentalCharts {
  readonly avery: WithId<Patient>;
  readonly jordan: WithId<Patient>;
  readonly riley: WithId<Patient>;
  readonly averyDue: string;
  readonly jordanDue: string;
}

export async function seedSyntheticDentalCharts(medplum: MedplumClient): Promise<SeededDentalCharts> {
  const today = new Date().toISOString().slice(0, 10);
  const averyDue = shiftDate(today, -90);
  const jordanDue = shiftDate(today, 120);
  const avery = await createPatient(medplum, {
    key: 'SYNTHETIC-DENTAL-AVERY',
    given: 'Avery',
    family: 'Chen',
    gender: 'female',
    birthDate: '1984-06-12',
  });
  const jordan = await createPatient(medplum, {
    key: 'SYNTHETIC-DENTAL-JORDAN',
    given: 'Jordan',
    family: 'Hale',
    gender: 'male',
    birthDate: '1991-11-03',
  });
  const riley = await createPatient(medplum, {
    key: 'SYNTHETIC-DENTAL-RILEY',
    given: 'Riley',
    family: 'Okonkwo',
    gender: 'unknown',
    birthDate: '1978-01-20',
  });

  await seedAvery(medplum, avery, averyDue, today);
  await seedJordan(medplum, jordan, jordanDue);
  return { avery, jordan, riley, averyDue, jordanDue };
}

async function seedAvery(medplum: MedplumClient, patient: WithId<Patient>, due: string, today: string): Promise<void> {
  const subject = createReference(patient);
  await ensure(medplum, 'CarePlan', 'avery-recall', {
    resourceType: 'CarePlan',
    status: 'active',
    intent: 'plan',
    title: 'Adult prophylaxis recall',
    subject,
    category: dentalCategory(HYGIENE_RECALL_CODE, 'Hygiene recall'),
    period: { end: due },
  });
  const scheduled = shiftDate(today, 21);
  const extractedOn = shiftDate(today, -40);
  const composite = await ensure(
    medplum,
    'ServiceRequest',
    'avery-composite',
    {
      resourceType: 'ServiceRequest',
      status: 'draft',
      intent: 'plan',
      subject,
      category: dentalCategory(TREATMENT_PLAN_CODE, 'Treatment plan'),
      code: cdt('D2391', 'Resin composite, one surface, posterior'),
      bodySite: tooth('14'),
    },
    'Composite, tooth 14'
  );
  const crown = await ensure(
    medplum,
    'ServiceRequest',
    'avery-crown',
    {
      resourceType: 'ServiceRequest',
      status: 'active',
      intent: 'order',
      subject,
      category: dentalCategory(TREATMENT_PLAN_CODE, 'Treatment plan'),
      code: cdt('D2740', 'Crown, porcelain/ceramic'),
      bodySite: tooth('19'),
      occurrenceDateTime: scheduled,
      authoredOn: scheduled,
    },
    'Crown, tooth 19'
  );
  const extractionRequest = await ensure(
    medplum,
    'ServiceRequest',
    'avery-extraction-request',
    {
      resourceType: 'ServiceRequest',
      status: 'completed',
      intent: 'order',
      subject,
      category: dentalCategory(TREATMENT_PLAN_CODE, 'Treatment plan'),
      code: cdt('D7140', 'Extraction, erupted tooth'),
      bodySite: tooth('3'),
      authoredOn: extractedOn,
    },
    'Extraction, tooth 3'
  );
  const extraction = await ensure(medplum, 'Procedure', 'avery-extraction', {
    resourceType: 'Procedure',
    status: 'completed',
    subject,
    category: dentalCategory(TREATMENT_PLAN_CODE, 'Treatment plan')[0],
    code: cdt('D7140', 'Extraction, erupted tooth'),
    bodySite: tooth('3'),
    performedDateTime: extractedOn,
    basedOn: [{ reference: getReferenceString(extractionRequest) }],
  });
  const prophy = await ensure(medplum, 'Procedure', 'avery-prophy', {
    resourceType: 'Procedure',
    status: 'completed',
    subject,
    category: dentalCategory(TREATMENT_PLAN_CODE, 'Treatment plan')[0],
    code: cdt('D1110', 'Prophylaxis, adult'),
    performedDateTime: shiftDate(today, -90),
  });
  await ensure(medplum, 'CarePlan', 'avery-plan', {
    resourceType: 'CarePlan',
    status: 'active',
    intent: 'plan',
    title: 'Active treatment plan',
    subject,
    category: dentalCategory(TREATMENT_PLAN_CODE, 'Treatment plan'),
    activity: [
      { reference: { reference: getReferenceString(composite) } },
      { reference: { reference: getReferenceString(crown) } },
      {
        reference: { reference: getReferenceString(extractionRequest) },
        outcomeReference: [createReference(extraction)],
      },
      { outcomeReference: [createReference(prophy)] },
    ],
  });
}

async function seedJordan(medplum: MedplumClient, patient: WithId<Patient>, due: string): Promise<void> {
  const subject = createReference(patient);
  await ensure(medplum, 'CarePlan', 'jordan-recall', {
    resourceType: 'CarePlan',
    status: 'active',
    intent: 'plan',
    title: 'Adult prophylaxis recall',
    subject,
    category: dentalCategory(HYGIENE_RECALL_CODE, 'Hygiene recall'),
    period: { end: due },
  });
  const scaling = await ensure(
    medplum,
    'ServiceRequest',
    'jordan-srp',
    {
      resourceType: 'ServiceRequest',
      status: 'draft',
      intent: 'plan',
      subject,
      category: dentalCategory(TREATMENT_PLAN_CODE, 'Treatment plan'),
      code: cdt('D4341', 'Periodontal scaling and root planing'),
      bodySite: tooth('30'),
    },
    'Scaling, tooth 30'
  );
  await ensure(medplum, 'CarePlan', 'jordan-plan', {
    resourceType: 'CarePlan',
    status: 'active',
    intent: 'plan',
    title: 'Active treatment plan',
    subject,
    category: dentalCategory(TREATMENT_PLAN_CODE, 'Treatment plan'),
    activity: [{ reference: { reference: getReferenceString(scaling) } }],
  });
}

async function createPatient(
  medplum: MedplumClient,
  input: { key: string; given: string; family: string; gender: Patient['gender']; birthDate: string }
): Promise<WithId<Patient>> {
  return ensure(medplum, 'Patient', input.key, {
    resourceType: 'Patient',
    active: true,
    name: [{ given: [input.given], family: input.family }],
    gender: input.gender,
    birthDate: input.birthDate,
    identifier: [{ system: PATIENT_IDENTIFIER_SYSTEM, value: input.key }],
  });
}

async function ensure<T extends Patient | CarePlan | ServiceRequest | Procedure>(
  medplum: MedplumClient,
  resourceType: T['resourceType'],
  key: string,
  resource: T,
  label?: string
): Promise<WithId<T>> {
  const identifierSystem = resourceType === 'Patient' ? PATIENT_IDENTIFIER_SYSTEM : CHART_IDENTIFIER_SYSTEM;
  const withIdentity = {
    ...resource,
    meta: syntheticMeta(),
    identifier: resource.identifier ?? [
      ...(label ? [{ system: identifierSystem, value: label }] : []),
      { system: identifierSystem, value: key },
    ],
  };
  return medplum.createResourceIfNoneExist(withIdentity, `identifier=${identifierSystem}|${key}`);
}

function syntheticMeta(): Meta {
  return { security: [{ ...SYNTHETIC_SECURITY }] };
}

function dentalCategory(code: string, display: string): CodeableConcept[] {
  return [{ coding: [{ system: DENTAL_CARE_SYSTEM, code, display }] }];
}

function cdt(code: string, display: string): CodeableConcept {
  return { text: display, coding: [{ system: CDT_SYSTEM, code, display }] };
}

function tooth(code: string): CodeableConcept[] {
  return [{ coding: [toothCoding(code)] }];
}

function toothCoding(code: string): Coding {
  return { system: UNIVERSAL_TOOTH_SYSTEM, code, display: `Tooth ${code}` };
}

function shiftDate(isoDate: string, days: number): string {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
