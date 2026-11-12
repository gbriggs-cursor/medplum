// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { getCodeBySystem, resolveId } from '@medplum/core';
import type { CarePlan, CodeableConcept, Patient, Procedure, ServiceRequest } from '@medplum/fhirtypes';
import {
  CDT_SYSTEM,
  DENTAL_CARE_SYSTEM,
  HYGIENE_RECALL_CODE,
  SYNTHETIC_SECURITY,
  UNIVERSAL_TOOTH_SYSTEM,
} from './codes';

export type DentalItemStatus = 'planned' | 'scheduled' | 'completed';

export interface DentalRecallSummary {
  readonly carePlanId: string | undefined;
  readonly title: string;
  readonly dueDate: string | undefined;
  readonly overdue: boolean;
}

export interface DentalTreatmentItem {
  readonly id: string;
  readonly code: string | undefined;
  readonly display: string;
  readonly tooth: string | undefined;
  readonly status: DentalItemStatus;
  readonly date: string | undefined;
}

const STATUS_RANK: Record<DentalItemStatus, number> = {
  planned: 0,
  scheduled: 1,
  completed: 2,
};

export function utcToday(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isRecallOverdue(dueDate: string | undefined, today: string = utcToday()): boolean {
  return !!dueDate && dueDate.slice(0, 10) < today;
}

export function daysPastDue(dueDate: string, today: string = utcToday()): number {
  const due = Date.parse(`${dueDate.slice(0, 10)}T00:00:00Z`);
  const current = Date.parse(`${today}T00:00:00Z`);
  return Math.round((current - due) / 86_400_000);
}

export function isSyntheticPatient(patient: Patient | undefined): boolean {
  return (
    patient?.meta?.security?.some(
      (coding) => coding.system === SYNTHETIC_SECURITY.system && coding.code === SYNTHETIC_SECURITY.code
    ) ?? false
  );
}

export function selectHygieneRecall(plans: CarePlan[], today: string = utcToday()): DentalRecallSummary | undefined {
  const recalls = plans.filter(
    (plan) =>
      hasDentalCode(plan.category, HYGIENE_RECALL_CODE) && (plan.status === 'active' || plan.status === 'on-hold')
  );
  if (recalls.length === 0) {
    return undefined;
  }
  const next = [...recalls].sort((a, b) =>
    (dueDateOf(a) ?? '9999-99-99').localeCompare(dueDateOf(b) ?? '9999-99-99')
  )[0];
  const dueDate = dueDateOf(next);
  return {
    carePlanId: next.id,
    title: next.title || 'Hygiene recall',
    dueDate,
    overdue: isRecallOverdue(dueDate, today),
  };
}

export function toTreatmentItems(requests: ServiceRequest[], procedures: Procedure[]): DentalTreatmentItem[] {
  const coveredRequestIds = new Set(
    procedures.flatMap((procedure) =>
      (procedure.basedOn ?? []).map((reference) => resolveId(reference)).filter((id): id is string => !!id)
    )
  );
  const items: DentalTreatmentItem[] = [];
  for (const request of requests) {
    if (request.id && coveredRequestIds.has(request.id)) {
      continue;
    }
    const status = serviceRequestStatus(request.status);
    if (!status || !request.id) {
      continue;
    }
    const coded = cdtDisplay(request.code);
    items.push({
      id: `ServiceRequest/${request.id}`,
      code: coded.code,
      display: coded.display,
      tooth: toothNumber(request.bodySite),
      status,
      date: requestDate(request),
    });
  }
  for (const procedure of procedures) {
    const status = procedureStatus(procedure.status);
    if (!status || !procedure.id) {
      continue;
    }
    const coded = cdtDisplay(procedure.code);
    items.push({
      id: `Procedure/${procedure.id}`,
      code: coded.code,
      display: coded.display,
      tooth: toothNumber(procedure.bodySite),
      status,
      date: procedureDate(procedure),
    });
  }
  return items.sort((a, b) => {
    const byStatus = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (byStatus !== 0) {
      return byStatus;
    }
    const byTooth = (a.tooth ?? '').localeCompare(b.tooth ?? '', undefined, { numeric: true });
    if (byTooth !== 0) {
      return byTooth;
    }
    return (a.code ?? '').localeCompare(b.code ?? '');
  });
}

function hasDentalCode(categories: CodeableConcept[] | CodeableConcept | undefined, code: string): boolean {
  let list: CodeableConcept[];
  if (Array.isArray(categories)) {
    list = categories;
  } else if (categories) {
    list = [categories];
  } else {
    list = [];
  }
  return list.some((category) => getCodeBySystem(category, DENTAL_CARE_SYSTEM) === code);
}

function dueDateOf(plan: CarePlan): string | undefined {
  return (plan.period?.end ?? plan.period?.start)?.slice(0, 10);
}

function serviceRequestStatus(status: ServiceRequest['status']): DentalItemStatus | undefined {
  switch (status) {
    case 'draft':
    case 'on-hold':
      return 'planned';
    case 'active':
      return 'scheduled';
    case 'completed':
      return 'completed';
    default:
      return undefined;
  }
}

function procedureStatus(status: Procedure['status']): DentalItemStatus | undefined {
  switch (status) {
    case 'preparation':
    case 'in-progress':
      return 'scheduled';
    case 'completed':
      return 'completed';
    default:
      return undefined;
  }
}

function cdtDisplay(code: CodeableConcept | undefined): { code: string | undefined; display: string } {
  const cdt = code?.coding?.find((coding) => coding.system === CDT_SYSTEM) ?? code?.coding?.[0];
  return {
    code: cdt?.code,
    display: code?.text || cdt?.display || cdt?.code || 'Procedure',
  };
}

function toothNumber(bodySite: CodeableConcept[] | undefined): string | undefined {
  if (!bodySite) {
    return undefined;
  }
  for (const site of bodySite) {
    const universal = getCodeBySystem(site, UNIVERSAL_TOOTH_SYSTEM);
    if (universal) {
      return universal;
    }
  }
  const text = bodySite.find((site) => site.text)?.text;
  if (text) {
    return text;
  }
  return bodySite[0]?.coding?.[0]?.code;
}

function requestDate(request: ServiceRequest): string | undefined {
  return (request.occurrenceDateTime ?? request.occurrencePeriod?.start ?? request.occurrencePeriod?.end)?.slice(0, 10);
}

function procedureDate(procedure: Procedure): string | undefined {
  return (procedure.performedDateTime ?? procedure.performedPeriod?.start)?.slice(0, 10);
}
