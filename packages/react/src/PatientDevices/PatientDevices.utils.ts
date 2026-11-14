// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { CodeableConcept, Observation, Quantity } from '@medplum/fhirtypes';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DeviceReadingPoint {
  readonly time: number;
  readonly value: number;
}

export interface DeviceReadingSeries {
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  readonly points: DeviceReadingPoint[];
}

export interface ReadingWindow {
  readonly start: number;
  readonly end: number;
}

/**
 * Returns the time window covering the last `days` days, ending now.
 * @param days - The window length in days.
 * @param now - The window end, in epoch milliseconds. Defaults to the current time.
 * @returns The window start and end, in epoch milliseconds.
 */
export function getReadingWindow(days: number, now = Date.now()): ReadingWindow {
  return { start: now - days * DAY_MS, end: now };
}

/**
 * Groups numeric Observation values into one series per measurement code, ordered by time.
 * Panel observations (such as blood pressure) contribute one series per component.
 * @param observations - The observations to group.
 * @returns The reading series, in order of first appearance.
 */
export function getDeviceReadingSeries(observations: Observation[]): DeviceReadingSeries[] {
  const byKey = new Map<string, { label: string; unit: string; points: DeviceReadingPoint[] }>();

  function add(code: CodeableConcept | undefined, quantity: Quantity | undefined, time: number): void {
    if (typeof quantity?.value !== 'number' || !code) {
      return;
    }
    const coding = code.coding?.[0];
    const key = coding?.code ? `${coding.system ?? ''}|${coding.code}` : code.text;
    if (!key) {
      return;
    }
    let entry = byKey.get(key);
    if (!entry) {
      entry = {
        label: code.text ?? coding?.display ?? coding?.code ?? key,
        unit: quantity.unit ?? quantity.code ?? '',
        points: [],
      };
      byKey.set(key, entry);
    }
    entry.points.push({ time, value: quantity.value });
  }

  for (const obs of observations) {
    const dateTime = obs.effectiveDateTime ?? obs.effectivePeriod?.start ?? obs.effectiveInstant ?? obs.issued;
    const time = dateTime ? Date.parse(dateTime) : Number.NaN;
    if (Number.isNaN(time)) {
      continue;
    }
    add(obs.code, obs.valueQuantity, time);
    for (const component of obs.component ?? []) {
      add(component.code, component.valueQuantity, time);
    }
  }

  return Array.from(byKey, ([key, entry]) => ({
    key,
    ...entry,
    points: entry.points.sort((a, b) => a.time - b.time),
  }));
}
