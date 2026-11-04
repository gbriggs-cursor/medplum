// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { formatCodeableConcept, formatDate, getDisplayString, getReferenceString } from '@medplum/core';
import type { Device, Observation } from '@medplum/fhirtypes';

export const LOINC_BLOOD_PRESSURE = '85354-9';
export const LOINC_SYSTOLIC = '8480-6';
export const LOINC_DIASTOLIC = '8462-4';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function getThirtyDayDateParam(now = new Date()): string {
  return new Date(now.getTime() - THIRTY_DAYS_MS).toISOString().slice(0, 10);
}

export function isWithinLastThirtyDays(dateTime: string | undefined, now = new Date()): boolean {
  if (!dateTime) {
    return false;
  }
  const value = Date.parse(dateTime);
  return !Number.isNaN(value) && value >= now.getTime() - THIRTY_DAYS_MS && value <= now.getTime();
}

export function getDeviceName(device: Device): string {
  return getDisplayString(device);
}

export function getDeviceType(device: Device): string {
  return device.type ? formatCodeableConcept(device.type) : 'Unknown type';
}

export function getComponentValue(observation: Observation, loincCode: string): number | undefined {
  return observation.component?.find((component) =>
    component.code?.coding?.some((coding) => coding.code === loincCode)
  )?.valueQuantity?.value;
}

export function observationsForDevice(observations: Observation[], device: Device): Observation[] {
  const reference = getReferenceString(device);
  return observations.filter((observation) => observation.device?.reference === reference);
}

export interface BloodPressureSeries {
  labels: string[];
  systolic: number[];
  diastolic: number[];
}

export function buildBloodPressureSeries(observations: Observation[]): BloodPressureSeries {
  const labels: string[] = [];
  const systolic: number[] = [];
  const diastolic: number[] = [];

  for (const observation of observations) {
    const systolicValue = getComponentValue(observation, LOINC_SYSTOLIC);
    const diastolicValue = getComponentValue(observation, LOINC_DIASTOLIC);
    if (systolicValue === undefined && diastolicValue === undefined) {
      continue;
    }
    labels.push(formatDate(observation.effectiveDateTime));
    systolic.push(systolicValue as number);
    diastolic.push(diastolicValue as number);
  }

  return { labels, systolic, diastolic };
}
