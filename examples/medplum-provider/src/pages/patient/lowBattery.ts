// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { CodeableConcept, Device, Observation, Quantity } from '@medplum/fhirtypes';

export const ACME_CARDIO_MANUFACTURER = 'Acme Cardio';
export const LOW_BATTERY_THRESHOLD_PERCENT = 20;

const PERCENT_UNITS = new Set(['', '%', 'percent', 'percentage']);

function textMentionsBattery(value: string | undefined): boolean {
  return value?.toLowerCase().includes('battery') ?? false;
}

function conceptMentionsBattery(concept: CodeableConcept | undefined): boolean {
  if (!concept) {
    return false;
  }
  if (textMentionsBattery(concept.text)) {
    return true;
  }
  return (concept.coding ?? []).some(
    (coding) => textMentionsBattery(coding.code) || textMentionsBattery(coding.display)
  );
}

function percentFromQuantity(quantity: Quantity | undefined): number | undefined {
  if (!quantity) {
    return undefined;
  }
  const value = quantity.value;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  const unit = (quantity.unit ?? quantity.code ?? '').trim().toLowerCase();
  if (!PERCENT_UNITS.has(unit)) {
    return undefined;
  }
  return value;
}

function batteryPercentFromDevice(device: Device): number | undefined {
  for (const property of device.property ?? []) {
    if (!conceptMentionsBattery(property.type)) {
      continue;
    }
    for (const quantity of property.valueQuantity ?? []) {
      const percent = percentFromQuantity(quantity);
      if (percent !== undefined) {
        return percent;
      }
    }
  }
  return undefined;
}

function referencesDevice(observation: Observation, deviceId: string): boolean {
  const reference = observation.device?.reference;
  if (!reference) {
    return false;
  }
  return reference === `Device/${deviceId}` || reference.endsWith(`/Device/${deviceId}`);
}

function isUsableStatus(status: Observation['status']): boolean {
  return status === 'preliminary' || status === 'final' || status === 'amended' || status === 'corrected';
}

function observationTime(observation: Observation): number {
  const raw =
    observation.effectiveDateTime ??
    observation.effectiveInstant ??
    observation.issued ??
    observation.meta?.lastUpdated;
  if (!raw) {
    return Number.NEGATIVE_INFINITY;
  }
  const time = Date.parse(raw);
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

function latestBatteryPercent(deviceId: string, observations: readonly Observation[]): number | undefined {
  let found = false;
  let latestTime = Number.NEGATIVE_INFINITY;
  let percent: number | undefined;
  for (const observation of observations) {
    if (!referencesDevice(observation, deviceId) || !isUsableStatus(observation.status)) {
      continue;
    }
    if (!conceptMentionsBattery(observation.code)) {
      continue;
    }
    const value = percentFromQuantity(observation.valueQuantity);
    if (value === undefined) {
      continue;
    }
    const time = observationTime(observation);
    if (!found || time >= latestTime) {
      found = true;
      latestTime = time;
      percent = value;
    }
  }
  return percent;
}

// The latest battery Observation wins. Device.property applies only when that device has no battery Observation.
function reportedBatteryPercent(device: Device, observations: readonly Observation[]): number | undefined {
  if (device.id) {
    const fromObservation = latestBatteryPercent(device.id, observations);
    if (fromObservation !== undefined) {
      return fromObservation;
    }
  }
  return batteryPercentFromDevice(device);
}

export function hasLowBatteryDevice(devices: readonly Device[], observations: readonly Observation[]): boolean {
  return devices.some((device) => {
    if (device.status !== 'active' || device.manufacturer !== ACME_CARDIO_MANUFACTURER) {
      return false;
    }
    const percent = reportedBatteryPercent(device, observations);
    return percent !== undefined && percent < LOW_BATTERY_THRESHOLD_PERCENT;
  });
}
