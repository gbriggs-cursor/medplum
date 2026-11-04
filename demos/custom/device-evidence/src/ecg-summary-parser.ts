// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Observation, ObservationComponent, SampledData } from '@medplum/fhirtypes';
import { ACME_ECG_CODE_SYSTEM, ACME_ECG_CODES, EKG_STUDY_CODE, HEART_RATE_CODE, SYNTHETIC_TAG_SYSTEM } from './constants';

export interface ParsedSampledData {
  originValue: number;
  originUnit?: string;
  periodMs: number;
  dimensions: number;
  factor: number;
  samples: number[];
}

export interface EcgSummary {
  observationId?: string;
  patientRef?: string;
  deviceRef?: string;
  effectiveDateTime?: string;
  heartRate?: number;
  prIntervalMs?: number;
  qrsDurationMs?: number;
  qtIntervalMs?: number;
  interpretation?: string;
  sampled?: ParsedSampledData;
  componentSampled?: ParsedSampledData;
  synthetic: boolean;
}

function componentCode(component: ObservationComponent): string | undefined {
  return component.code?.coding?.[0]?.code;
}

function componentSystem(component: ObservationComponent): string | undefined {
  return component.code?.coding?.[0]?.system;
}

function findComponent(obs: Observation, code: string, system?: string): ObservationComponent | undefined {
  return obs.component?.find((component) => {
    if (componentCode(component) !== code) {
      return false;
    }
    return system ? componentSystem(component) === system : true;
  });
}

export function isSyntheticResource(resource: { meta?: { tag?: { system?: string; code?: string }[] } }): boolean {
  return resource.meta?.tag?.some((tag) => tag.system === SYNTHETIC_TAG_SYSTEM && tag.code === 'synthetic') === true;
}

export function isEcgObservation(obs: Observation): boolean {
  return obs.code?.coding?.some((coding) => coding.code === EKG_STUDY_CODE) === true;
}

export function parseSampledData(data: SampledData | undefined): ParsedSampledData | undefined {
  if (!data?.data || data.period === undefined || data.dimensions === undefined || data.origin?.value === undefined) {
    return undefined;
  }
  const samples: number[] = [];
  for (const token of data.data.trim().split(/\s+/)) {
    if (token === 'E' || token === 'L' || token === 'U') {
      samples.push(Number.NaN);
      continue;
    }
    const value = Number(token);
    if (Number.isNaN(value)) {
      throw new Error(`Invalid SampledData token: ${token}`);
    }
    samples.push(value);
  }
  return {
    originValue: data.origin.value,
    originUnit: data.origin.unit,
    periodMs: data.period,
    dimensions: data.dimensions,
    factor: data.factor ?? 1,
    samples,
  };
}

export function parseEcgSummary(obs: Observation): EcgSummary {
  if (!isEcgObservation(obs)) {
    throw new Error(`Observation ${obs.id ?? '(no id)'} is not an EKG study`);
  }
  const heartRate = findComponent(obs, HEART_RATE_CODE)?.valueQuantity?.value;
  const prIntervalMs = findComponent(obs, ACME_ECG_CODES.prInterval, ACME_ECG_CODE_SYSTEM)?.valueQuantity?.value;
  const qrsDurationMs = findComponent(obs, ACME_ECG_CODES.qrsDuration, ACME_ECG_CODE_SYSTEM)?.valueQuantity?.value;
  const qtIntervalMs = findComponent(obs, ACME_ECG_CODES.qtInterval, ACME_ECG_CODE_SYSTEM)?.valueQuantity?.value;
  const interpretation = findComponent(obs, ACME_ECG_CODES.interpretation, ACME_ECG_CODE_SYSTEM)?.valueString;
  const leadII = findComponent(obs, ACME_ECG_CODES.leadII, ACME_ECG_CODE_SYSTEM);
  return {
    observationId: obs.id,
    patientRef: obs.subject?.reference,
    deviceRef: obs.device?.reference,
    effectiveDateTime: obs.effectiveDateTime,
    heartRate,
    prIntervalMs,
    qrsDurationMs,
    qtIntervalMs,
    interpretation,
    sampled: parseSampledData(obs.valueSampledData),
    componentSampled: parseSampledData(leadII?.valueSampledData),
    synthetic: isSyntheticResource(obs),
  };
}
