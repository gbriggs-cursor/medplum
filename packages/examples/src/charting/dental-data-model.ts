// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

// start-block systems
import type { MedplumClient } from '@medplum/core';
import { getReferenceString } from '@medplum/core';
import type {
  Appointment,
  Bundle,
  CarePlan,
  CodeableConcept,
  Coding,
  Observation,
  ObservationComponent,
  Patient,
  Procedure,
  Reference,
  ServiceRequest,
} from '@medplum/fhirtypes';

// Defined in FHIR R4 (example / draft content)
export const FDI_TOOTH = 'http://terminology.hl7.org/CodeSystem/ex-tooth';
export const FDI_SURFACE = 'http://terminology.hl7.org/CodeSystem/FDI-surface';

// Placeholders: replace with your organization's canonical URIs
export const CDT = 'https://example.com/fhir/CodeSystem/cdt-placeholder';
export const UNIVERSAL_TOOTH = 'https://example.com/fhir/CodeSystem/universal-tooth-number';
export const PERIO = 'https://example.com/fhir/CodeSystem/perio-charting';
export const DENTAL_WORKFLOW = 'https://example.com/fhir/CodeSystem/dental-workflow';
// end-block systems

// start-block toothSite
export function tooth(fdi: string, universal?: string): CodeableConcept {
  const coding: Coding[] = [{ system: FDI_TOOTH, code: fdi }];
  if (universal) {
    coding.push({ system: UNIVERSAL_TOOTH, code: universal });
  }
  return { coding, text: universal ? `Tooth #${universal}` : `Tooth ${fdi}` };
}

export function surface(code: string, display: string): CodeableConcept {
  return { coding: [{ system: FDI_SURFACE, code, display }] };
}

// Lower right first molar: FDI 46 = Universal #30
export const lowerRightFirstMolar = tooth('46', '30');
// end-block toothSite

// start-block recordProcedure
export async function recordCompletedProcedure(
  medplum: MedplumClient,
  patient: Patient,
  basedOn?: ServiceRequest
): Promise<Procedure> {
  return medplum.createResource<Procedure>({
    resourceType: 'Procedure',
    status: 'completed',
    subject: { reference: getReferenceString(patient) },
    basedOn: basedOn ? [{ reference: getReferenceString(basedOn) }] : undefined,
    code: {
      coding: [{ system: CDT, code: 'EXAMPLE-RESIN-2S-POST', display: 'Resin composite, two surfaces, posterior' }],
    },
    // One tooth per Procedure; surfaces listed alongside it
    bodySite: [lowerRightFirstMolar, surface('MO', 'Mesioclusal')],
    performedDateTime: '2026-11-12T15:30:00Z',
  });
}
// end-block recordProcedure

// start-block treatmentPlan
interface PlannedItem {
  cdt: Coding;
  bodySite: CodeableConcept[];
}

export async function createTreatmentPlan(
  medplum: MedplumClient,
  patient: Patient,
  items: PlannedItem[]
): Promise<Bundle> {
  const subject = { reference: getReferenceString(patient) };
  const requests = items.map((item, i) => ({
    fullUrl: `urn:uuid:00000000-0000-4000-8000-00000000000${i + 1}`,
    request: { method: 'POST' as const, url: 'ServiceRequest' },
    resource: {
      resourceType: 'ServiceRequest' as const,
      status: 'draft' as const,
      intent: 'plan' as const,
      subject,
      code: { coding: [item.cdt] },
      bodySite: item.bodySite,
    },
  }));

  const carePlan: CarePlan = {
    resourceType: 'CarePlan',
    status: 'draft',
    intent: 'proposal',
    title: 'Restorative treatment plan',
    subject,
    activity: requests.map((r) => ({ reference: { reference: r.fullUrl } })),
  };

  return medplum.executeBatch({
    resourceType: 'Bundle',
    type: 'transaction',
    entry: [...requests, { request: { method: 'POST', url: 'CarePlan' }, resource: carePlan }],
  });
}
// end-block treatmentPlan

// start-block acceptPlan
export async function acceptTreatmentPlan(medplum: MedplumClient, carePlan: CarePlan): Promise<CarePlan> {
  for (const activity of carePlan.activity ?? []) {
    const request = await medplum.readReference(activity.reference as Reference<ServiceRequest>);
    await medplum.updateResource({ ...request, status: 'active' });
  }
  return medplum.updateResource({ ...carePlan, status: 'active' });
}
// end-block acceptPlan

// start-block recall
export async function createRecall(medplum: MedplumClient, patient: Patient, dueDate: string): Promise<ServiceRequest> {
  return medplum.createResource<ServiceRequest>({
    resourceType: 'ServiceRequest',
    status: 'active',
    intent: 'plan',
    subject: { reference: getReferenceString(patient) },
    category: [{ coding: [{ system: DENTAL_WORKFLOW, code: 'hygiene-recall', display: 'Hygiene recall' }] }],
    code: { coding: [{ system: CDT, code: 'EXAMPLE-PROPHY-ADULT', display: 'Adult prophylaxis' }] },
    occurrenceDateTime: dueDate,
  });
}

export async function findDueRecalls(medplum: MedplumClient, dueBy: string): Promise<ServiceRequest[]> {
  return medplum.searchResources('ServiceRequest', {
    status: 'active',
    category: `${DENTAL_WORKFLOW}|hygiene-recall`,
    occurrence: `le${dueBy}`,
  });
}

export async function bookRecall(
  medplum: MedplumClient,
  recall: ServiceRequest,
  start: string,
  end: string
): Promise<Appointment> {
  return medplum.createResource<Appointment>({
    resourceType: 'Appointment',
    status: 'booked',
    basedOn: [{ reference: getReferenceString(recall) }],
    start,
    end,
    participant: [{ actor: recall.subject as Reference<Patient>, status: 'accepted' }],
  });
}
// end-block recall

// start-block perio
const SITES = ['MB', 'B', 'DB', 'ML', 'L', 'DL'] as const;

function probingSites(depthsMm: number[], bleeding: boolean[]): ObservationComponent[] {
  return SITES.flatMap((site, i) => [
    {
      code: { coding: [{ system: PERIO, code: `probing-depth-${site}` }] },
      valueQuantity: { value: depthsMm[i], unit: 'mm', system: 'http://unitsofmeasure.org', code: 'mm' },
    },
    {
      code: { coding: [{ system: PERIO, code: `bleeding-on-probing-${site}` }] },
      valueBoolean: bleeding[i],
    },
  ]);
}

export async function recordPerioExam(
  medplum: MedplumClient,
  patient: Patient,
  teeth: { fdi: string; depthsMm: number[]; bleeding: boolean[] }[]
): Promise<Bundle> {
  const subject = { reference: getReferenceString(patient) };
  const effectiveDateTime = '2026-11-12T15:00:00Z';
  const category = [
    { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'exam' }] },
  ];

  const toothEntries = teeth.map((t, i) => ({
    fullUrl: `urn:uuid:00000000-0000-4000-9000-00000000000${i + 1}`,
    request: { method: 'POST' as const, url: 'Observation' },
    resource: {
      resourceType: 'Observation' as const,
      status: 'final' as const,
      category,
      code: { coding: [{ system: PERIO, code: 'tooth-perio-findings' }] },
      subject,
      effectiveDateTime,
      bodySite: tooth(t.fdi),
      component: probingSites(t.depthsMm, t.bleeding),
    },
  }));

  const panel: Observation = {
    resourceType: 'Observation',
    status: 'final',
    category,
    code: { coding: [{ system: PERIO, code: 'perio-chart', display: 'Periodontal charting' }] },
    subject,
    effectiveDateTime,
    hasMember: toothEntries.map((e) => ({ reference: e.fullUrl })),
  };

  return medplum.executeBatch({
    resourceType: 'Bundle',
    type: 'transaction',
    entry: [...toothEntries, { request: { method: 'POST', url: 'Observation' }, resource: panel }],
  });
}
// end-block perio
