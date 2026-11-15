// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { tryParseReference } from '@medplum/core';
import type { Coding, Observation } from '@medplum/fhirtypes';

const LOINC = 'http://loinc.org';

/** LOINC panel codes 85354-9 and 55284-4, plus systolic 8480-6 and diastolic 8462-4. */
const BLOOD_PRESSURE_LOINC_CODES: ReadonlySet<string> = new Set(['85354-9', '55284-4', '8480-6', '8462-4']);

const BLOOD_PRESSURE_SEARCH_COUNT = '1000';

/**
 * @param patientId - Bare Patient id (`123`, not `Patient/123`).
 * @returns Search params for that patient's blood-pressure Observations.
 */
export function bloodPressureObservationQuery(patientId: string): URLSearchParams {
  return new URLSearchParams({
    patient: `Patient/${patientId}`,
    code: [...BLOOD_PRESSURE_LOINC_CODES].join(','),
    _sort: '-date',
    _count: BLOOD_PRESSURE_SEARCH_COUNT,
  });
}

/**
 * Latest blood-pressure date per Device id.
 * Precedence is `effectiveDateTime`, `effectiveInstant`, period end, period start, then `issued`.
 * `DeviceMetric` references are ignored.
 * @param observations - Candidate Observations, including ones that are not blood pressure.
 * @returns Device id to the winning FHIR date or dateTime.
 */
export function latestBloodPressureDatesByDevice(observations: readonly Observation[]): Map<string, string> {
  const best = new Map<string, { instant: number; date: string }>();

  for (const observation of observations) {
    if (!isBloodPressureObservation(observation)) {
      continue;
    }
    const deviceId = referencedDeviceId(observation);
    const date = bloodPressureDate(observation);
    if (!deviceId || !date) {
      continue;
    }
    const instant = Date.parse(date);
    if (Number.isNaN(instant)) {
      continue;
    }
    const current = best.get(deviceId);
    if (!current || instant > current.instant) {
      best.set(deviceId, { instant, date });
    }
  }

  return new Map(Array.from(best, ([deviceId, value]) => [deviceId, value.date]));
}

function isBloodPressureObservation(observation: Observation): boolean {
  if (hasBloodPressureCode(observation.code?.coding)) {
    return true;
  }
  return (observation.component ?? []).some((component) => hasBloodPressureCode(component.code?.coding));
}

function hasBloodPressureCode(coding: Coding[] | undefined): boolean {
  return (coding ?? []).some(
    (entry) =>
      entry.code !== undefined &&
      BLOOD_PRESSURE_LOINC_CODES.has(entry.code) &&
      (entry.system === undefined || entry.system === LOINC)
  );
}

function referencedDeviceId(observation: Observation): string | undefined {
  const parsed = tryParseReference(observation.device);
  if (parsed?.[0] !== 'Device') {
    return undefined;
  }
  return parsed[1];
}

function bloodPressureDate(observation: Observation): string | undefined {
  return (
    observation.effectiveDateTime ??
    observation.effectiveInstant ??
    observation.effectivePeriod?.end ??
    observation.effectivePeriod?.start ??
    observation.issued
  );
}
