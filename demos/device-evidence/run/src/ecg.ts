// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Coding, Observation, ObservationComponent, SampledData } from '@medplum/fhirtypes';
import { CODES, LOINC } from './cohort';

export const TACHYCARDIA_BPM = 100;
export const BRADYCARDIA_BPM = 60;
export const PROLONGED_QTC_MS = 460;
export const IRREGULAR_RR_CV = 0.1;
export const HEART_RATE_TOLERANCE_BPM = 10;
const REFRACTORY_MS = 250;

export type EcgFlag =
  'tachycardia' | 'bradycardia' | 'prolonged-qtc' | 'irregular-rhythm' | 'heart-rate-mismatch' | 'no-waveform';

export interface EcgWaveformSummary {
  lead: string;
  samplingRateHz: number;
  durationSeconds: number;
  sampleCount: number;
  validSampleCount: number;
  minMv: number;
  maxMv: number;
  rPeakCount: number;
  rrIntervalsMs: number[];
  derivedHeartRate?: number;
  rrCoefficientOfVariation?: number;
}

export interface EcgSummary {
  observationId?: string;
  patient?: string;
  device?: string;
  effective?: string;
  heartRate?: number;
  prInterval?: number;
  qrsDuration?: number;
  qtInterval?: number;
  qtcInterval?: number;
  rhythm?: string;
  waveform?: EcgWaveformSummary;
  flags: EcgFlag[];
}

function hasCode(codings: Coding[] | undefined, target: Coding): boolean {
  return !!codings?.some((c) => c.system === target.system && c.code === target.code);
}

export function isEcgObservation(obs: Observation): boolean {
  return hasCode(obs.code?.coding, CODES.ecg);
}

function findComponent(obs: Observation, target: Coding): ObservationComponent | undefined {
  return obs.component?.find((c) => hasCode(c.code?.coding, target));
}

function componentNumber(obs: Observation, target: Coding): number | undefined {
  const value = findComponent(obs, target)?.valueQuantity?.value;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * Decodes SampledData into values in the origin's units. "E" (error), "L" (below detection),
 * and "U" (above detection) samples decode as undefined so callers can skip them.
 * For multi-dimension data the samples are interleaved; `channel` picks one.
 * @param sampled - The SampledData value.
 * @param channel - Zero-based dimension to decode.
 * @returns One value per sample, undefined for E, L, and U.
 */
export function decodeSampledData(sampled: SampledData, channel = 0): (number | undefined)[] {
  const dimensions = sampled.dimensions ?? 1;
  if (!Number.isInteger(dimensions) || dimensions < 1) {
    throw new Error(`Invalid SampledData dimensions: ${dimensions}`);
  }
  if (channel < 0 || channel >= dimensions) {
    throw new Error(`Channel ${channel} out of range for ${dimensions} dimension(s)`);
  }
  const origin = sampled.origin?.value ?? 0;
  const factor = sampled.factor ?? 1;
  const tokens = (sampled.data ?? '').trim().split(/\s+/).filter(Boolean);
  const values: (number | undefined)[] = [];
  for (let i = channel; i < tokens.length; i += dimensions) {
    const token = tokens[i];
    if (token === 'E' || token === 'L' || token === 'U') {
      values.push(undefined);
      continue;
    }
    const n = Number(token);
    if (!Number.isFinite(n)) {
      throw new Error(`Invalid SampledData token "${token}" at position ${i}`);
    }
    values.push(origin + factor * n);
  }
  return values;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Finds R peaks: the local maximum of each excursion above the median plus half the
 * median-to-max range, at least REFRACTORY_MS after the previous peak.
 * @param values - Decoded samples; undefined samples are skipped.
 * @param periodMs - Milliseconds between samples.
 * @returns Sample indexes of the detected R peaks.
 */
export function detectRPeaks(values: (number | undefined)[], periodMs: number): number[] {
  const valid = values.filter((v): v is number => v !== undefined);
  if (valid.length === 0) {
    return [];
  }
  const baseline = median(valid);
  const max = Math.max(...valid);
  if (max <= baseline) {
    return [];
  }
  const threshold = baseline + 0.5 * (max - baseline);
  const refractory = Math.ceil(REFRACTORY_MS / periodMs);

  const peaks: number[] = [];
  let candidate = -1;
  for (let i = 0; i <= values.length; i++) {
    const v = values[i];
    if (v !== undefined && v >= threshold) {
      if (candidate < 0 || v > (values[candidate] as number)) {
        candidate = i;
      }
    } else if (candidate >= 0) {
      const last = peaks[peaks.length - 1];
      if (last === undefined || candidate - last >= refractory) {
        peaks.push(candidate);
      } else if ((values[candidate] as number) > (values[last] as number)) {
        peaks[peaks.length - 1] = candidate;
      }
      candidate = -1;
    }
  }
  return peaks;
}

export function summarizeWaveform(sampled: SampledData, lead: string): EcgWaveformSummary {
  if (!(sampled.period > 0)) {
    throw new Error(`Invalid SampledData period: ${sampled.period}`);
  }
  const values = decodeSampledData(sampled);
  const valid = values.filter((v): v is number => v !== undefined);
  const peaks = detectRPeaks(values, sampled.period);
  const rrIntervalsMs = peaks.slice(1).map((p, i) => (p - peaks[i]) * sampled.period);

  let derivedHeartRate: number | undefined;
  let rrCoefficientOfVariation: number | undefined;
  if (rrIntervalsMs.length > 0) {
    const mean = rrIntervalsMs.reduce((a, b) => a + b, 0) / rrIntervalsMs.length;
    const variance = rrIntervalsMs.reduce((a, b) => a + (b - mean) ** 2, 0) / rrIntervalsMs.length;
    derivedHeartRate = Math.round(60000 / mean);
    rrCoefficientOfVariation = Math.round((Math.sqrt(variance) / mean) * 1000) / 1000;
  }

  return {
    lead,
    samplingRateHz: 1000 / sampled.period,
    durationSeconds: (values.length * sampled.period) / 1000,
    sampleCount: values.length,
    validSampleCount: valid.length,
    minMv: valid.length ? Math.min(...valid) : 0,
    maxMv: valid.length ? Math.max(...valid) : 0,
    rPeakCount: peaks.length,
    rrIntervalsMs,
    derivedHeartRate,
    rrCoefficientOfVariation,
  };
}

export function parseEcgSummary(obs: Observation): EcgSummary {
  if (obs.resourceType !== 'Observation' || !isEcgObservation(obs)) {
    throw new Error(`Not an ECG Observation (expected ${LOINC}|${CODES.ecg.code})`);
  }

  const waveformComponent = obs.component?.find((c) => c.valueSampledData);
  const waveform = waveformComponent?.valueSampledData
    ? summarizeWaveform(
        waveformComponent.valueSampledData,
        waveformComponent.code?.coding?.[0]?.display ?? waveformComponent.code?.text ?? 'unknown'
      )
    : undefined;
  const rhythmConcept = findComponent(obs, CODES.rhythm)?.valueCodeableConcept;

  const summary: EcgSummary = {
    observationId: obs.id,
    patient: obs.subject?.reference,
    device: obs.device?.reference,
    effective: obs.effectiveDateTime,
    heartRate: componentNumber(obs, CODES.heartRate) ?? waveform?.derivedHeartRate,
    prInterval: componentNumber(obs, CODES.prInterval),
    qrsDuration: componentNumber(obs, CODES.qrsDuration),
    qtInterval: componentNumber(obs, CODES.qtInterval),
    qtcInterval: componentNumber(obs, CODES.qtcInterval),
    rhythm: rhythmConcept?.text ?? rhythmConcept?.coding?.[0]?.display,
    waveform,
    flags: [],
  };

  const { heartRate, qtcInterval } = summary;
  if (heartRate !== undefined && heartRate > TACHYCARDIA_BPM) {
    summary.flags.push('tachycardia');
  }
  if (heartRate !== undefined && heartRate < BRADYCARDIA_BPM) {
    summary.flags.push('bradycardia');
  }
  if (qtcInterval !== undefined && qtcInterval > PROLONGED_QTC_MS) {
    summary.flags.push('prolonged-qtc');
  }
  if (!waveform) {
    summary.flags.push('no-waveform');
  } else {
    if (waveform.rrCoefficientOfVariation !== undefined && waveform.rrCoefficientOfVariation > IRREGULAR_RR_CV) {
      summary.flags.push('irregular-rhythm');
    }
    if (
      heartRate !== undefined &&
      waveform.derivedHeartRate !== undefined &&
      Math.abs(heartRate - waveform.derivedHeartRate) > HEART_RATE_TOLERANCE_BPM
    ) {
      summary.flags.push('heart-rate-mismatch');
    }
  }
  return summary;
}

export function formatEcgSummary(summary: EcgSummary): string {
  const parts: string[] = [];
  if (summary.heartRate !== undefined) {
    parts.push(`HR ${summary.heartRate} /min`);
  }
  if (summary.prInterval !== undefined) {
    parts.push(`PR ${summary.prInterval} ms`);
  }
  if (summary.qrsDuration !== undefined) {
    parts.push(`QRS ${summary.qrsDuration} ms`);
  }
  if (summary.qtcInterval !== undefined) {
    parts.push(`QTc ${summary.qtcInterval} ms`);
  }
  if (summary.rhythm) {
    parts.push(summary.rhythm);
  }
  if (summary.flags.length) {
    parts.push(`flags: ${summary.flags.join(', ')}`);
  }
  return parts.join(', ');
}
