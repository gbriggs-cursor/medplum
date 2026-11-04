// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Observation } from '@medplum/fhirtypes';

export const LOOKBACK_DAYS = 30;
export const LOINC_SYSTOLIC = '8480-6';
export const LOINC_DIASTOLIC = '8462-4';

export interface BloodPressurePoint {
  readonly date: string;
  readonly systolic: number;
  readonly diastolic: number;
}

export function getLookbackIso(now = new Date(), days = LOOKBACK_DAYS): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function getObservationDate(observation: Observation): string | undefined {
  return observation.effectiveDateTime ?? observation.issued;
}

export function getComponentValue(observation: Observation, loincCode: string): number | undefined {
  const component = observation.component?.find((entry) =>
    entry.code?.coding?.some((coding) => coding.code === loincCode)
  );
  return component?.valueQuantity?.value;
}

export function getBloodPressurePoint(observation: Observation): BloodPressurePoint | undefined {
  const date = getObservationDate(observation);
  const systolic = getComponentValue(observation, LOINC_SYSTOLIC);
  const diastolic = getComponentValue(observation, LOINC_DIASTOLIC);
  if (!date || systolic === undefined || diastolic === undefined) {
    return undefined;
  }
  return { date, systolic, diastolic };
}

export function toBloodPressureSeries(observations: Observation[]): BloodPressurePoint[] {
  return observations
    .map(getBloodPressurePoint)
    .filter((point): point is BloodPressurePoint => !!point)
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function filterRecentObservations(observations: Observation[], sinceIso: string): Observation[] {
  return observations.filter((observation) => {
    const date = getObservationDate(observation);
    return !!date && date >= sinceIso;
  });
}
