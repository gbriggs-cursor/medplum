// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Device, DeviceMetric } from '@medplum/fhirtypes';

export const DEVICE_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export const DEVICE_EXPIRING_WITHIN_MS = 30 * 24 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

export type DeviceReadinessStatus = 'ready' | 'attention' | 'offline' | 'unknown';

export type DeviceConnection = 'on' | 'off' | 'standby';

export interface ClassifiedDevice {
  readonly device: Device;
  readonly status: DeviceReadinessStatus;
  readonly reason: string;
  readonly name: string;
  readonly connection?: DeviceConnection;
  readonly lastContact?: string;
}

export interface DeviceReadinessModel {
  readonly items: ClassifiedDevice[];
  readonly excludedCount: number;
}

const STATUS_RANK: Record<DeviceReadinessStatus, number> = {
  offline: 0,
  attention: 1,
  unknown: 2,
  ready: 3,
};

const NAME_PREFERENCE = ['user-friendly-name', 'patient-reported-name'] as const;

export function deviceDisplayName(device: Device): string {
  for (const type of NAME_PREFERENCE) {
    const match = device.deviceName?.find((entry) => entry.type === type && entry.name);
    if (match) {
      return match.name;
    }
  }
  const anyName = device.deviceName?.find((entry) => entry.name);
  if (anyName) {
    return anyName.name;
  }
  if (device.type?.text) {
    return device.type.text;
  }
  const display = device.type?.coding?.find((coding) => coding.display)?.display;
  if (display) {
    return display;
  }
  if (device.manufacturer && device.modelNumber) {
    return `${device.manufacturer} ${device.modelNumber}`;
  }
  return device.manufacturer || device.modelNumber || 'Unnamed device';
}

export function classifyDevice(device: Device, metrics: DeviceMetric[], now: Date): ClassifiedDevice | undefined {
  if (device.status === 'entered-in-error') {
    return undefined;
  }

  const metric = selectMetric(metricsForDevice(device, metrics));
  const connection = connectionOf(metric);
  const lastContact = metric?.meta?.lastUpdated;
  const expirationDays = expirationOffsetDays(device.expirationDate, now);
  const base = { device, name: deviceDisplayName(device), connection, lastContact };

  if (device.status === 'inactive') {
    return { ...base, status: 'offline', reason: 'Marked inactive' };
  }
  if (expirationDays !== undefined && expirationDays < 0) {
    return { ...base, status: 'offline', reason: 'Expired' };
  }
  if (connection === 'off') {
    return { ...base, status: 'offline', reason: 'Connection off' };
  }
  if (!device.status || device.status === 'unknown') {
    return { ...base, status: 'unknown', reason: 'Status not recorded' };
  }
  if (metric?.operationalStatus === 'entered-in-error') {
    return { ...base, status: 'unknown', reason: 'Connection status invalid' };
  }
  if (expirationDays !== undefined && expirationDays <= DEVICE_EXPIRING_WITHIN_MS / DAY_MS) {
    return { ...base, status: 'attention', reason: `Expires within ${DEVICE_EXPIRING_WITHIN_MS / DAY_MS} days` };
  }
  if (connection === 'on' && isStale(lastContact, now)) {
    return {
      ...base,
      status: 'attention',
      reason: `Last contact is over ${DEVICE_STALE_AFTER_MS / (60 * 60 * 1000)} hours old`,
    };
  }
  if (connection === 'standby') {
    return { ...base, status: 'attention', reason: 'Standing by' };
  }
  if (!metric) {
    return { ...base, status: 'attention', reason: 'No connection reported' };
  }
  if (!connection) {
    return { ...base, status: 'attention', reason: 'Connection status not recorded' };
  }
  return { ...base, status: 'ready', reason: 'Connected' };
}

export function summarizeDeviceReadiness(devices: Device[], metrics: DeviceMetric[], now: Date): DeviceReadinessModel {
  let excludedCount = 0;
  const items: ClassifiedDevice[] = [];
  for (const device of devices) {
    const classified = classifyDevice(device, metrics, now);
    if (!classified) {
      if (device.status === 'entered-in-error') {
        excludedCount++;
      }
      continue;
    }
    items.push(classified);
  }
  items.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.name.localeCompare(b.name));
  return { items, excludedCount };
}

export function filterDeviceReadiness(
  items: ClassifiedDevice[],
  status: DeviceReadinessStatus | 'all',
  query: string
): ClassifiedDevice[] {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => {
    if (status !== 'all' && item.status !== status) {
      return false;
    }
    if (!needle) {
      return true;
    }
    const device = item.device;
    const haystack = [
      item.name,
      device.manufacturer,
      device.modelNumber,
      device.serialNumber,
      device.distinctIdentifier,
    ]
      .filter((part): part is string => !!part)
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function countDeviceReadiness(items: ClassifiedDevice[]): Record<DeviceReadinessStatus, number> {
  const counts: Record<DeviceReadinessStatus, number> = { ready: 0, attention: 0, offline: 0, unknown: 0 };
  for (const item of items) {
    counts[item.status]++;
  }
  return counts;
}

function metricsForDevice(device: Device, metrics: DeviceMetric[]): DeviceMetric[] {
  if (!device.id) {
    return [];
  }
  const ref = `Device/${device.id}`;
  return metrics.filter((metric) => {
    const source = metric.source?.reference;
    return source === ref || source?.endsWith('/' + ref) === true;
  });
}

function selectMetric(metrics: DeviceMetric[]): DeviceMetric | undefined {
  if (metrics.length === 0) {
    return undefined;
  }
  return [...metrics].sort((a, b) => contactTime(b) - contactTime(a))[0];
}

function contactTime(metric: DeviceMetric): number {
  const time = Date.parse(metric.meta?.lastUpdated ?? '');
  return Number.isNaN(time) ? 0 : time;
}

function connectionOf(metric: DeviceMetric | undefined): DeviceConnection | undefined {
  const status = metric?.operationalStatus;
  if (status === 'on' || status === 'off' || status === 'standby') {
    return status;
  }
  return undefined;
}

function isStale(lastContact: string | undefined, now: Date): boolean {
  if (!lastContact) {
    return false;
  }
  const time = Date.parse(lastContact);
  if (Number.isNaN(time)) {
    return false;
  }
  return now.getTime() - time > DEVICE_STALE_AFTER_MS;
}

// Date-only values compare as UTC calendar days. A negative offset is already expired.
function expirationOffsetDays(expirationDate: string | undefined, now: Date): number | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(expirationDate ?? '');
  if (!match) {
    return undefined;
  }
  const expiration = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((expiration - today) / DAY_MS);
}
