// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Device, DeviceMetric } from '@medplum/fhirtypes';
import {
  DEVICE_STALE_AFTER_MS,
  classifyDevice,
  deviceDisplayName,
  filterDeviceReadiness,
  summarizeDeviceReadiness,
} from './deviceReadiness';

const NOW = new Date('2026-11-08T15:00:00.000Z');

describe('device readiness', () => {
  function device(overrides: Partial<Device> = {}): Device {
    return {
      resourceType: 'Device',
      id: 'cuff',
      status: 'active',
      expirationDate: '2027-12-01',
      deviceName: [{ name: 'Cuff', type: 'user-friendly-name' }],
      ...overrides,
    };
  }

  function metric(overrides: Partial<DeviceMetric> = {}): DeviceMetric {
    return {
      resourceType: 'DeviceMetric',
      id: 'metric-1',
      type: { text: 'Connection' },
      category: 'setting',
      operationalStatus: 'on',
      source: { reference: 'Device/cuff' },
      meta: { lastUpdated: NOW.toISOString() },
      ...overrides,
    };
  }

  function daysFromNow(days: number): string {
    return new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), NOW.getUTCDate() + days))
      .toISOString()
      .slice(0, 10);
  }

  function hoursAgo(ms: number): string {
    return new Date(NOW.getTime() - ms).toISOString();
  }

  test.each([
    {
      name: 'connected',
      device: device(),
      metrics: [metric()],
      status: 'ready',
      reason: 'Connected',
    },
    {
      name: 'on at exactly 24 hours',
      device: device(),
      metrics: [metric({ meta: { lastUpdated: hoursAgo(DEVICE_STALE_AFTER_MS) } })],
      status: 'ready',
      reason: 'Connected',
    },
    {
      name: 'on with no timestamp',
      device: device(),
      metrics: [metric({ meta: undefined })],
      status: 'ready',
      reason: 'Connected',
    },
    {
      name: 'stale by one millisecond',
      device: device(),
      metrics: [metric({ meta: { lastUpdated: hoursAgo(DEVICE_STALE_AFTER_MS + 1) } })],
      status: 'attention',
      reason: 'Last contact is over 24 hours old',
    },
    {
      name: 'expires in 30 days',
      device: device({ expirationDate: daysFromNow(30) }),
      metrics: [metric()],
      status: 'attention',
      reason: 'Expires within 30 days',
    },
    {
      name: 'expires in 31 days',
      device: device({ expirationDate: daysFromNow(31) }),
      metrics: [metric()],
      status: 'ready',
      reason: 'Connected',
    },
    {
      name: 'expires today',
      device: device({ expirationDate: daysFromNow(0) }),
      metrics: [metric()],
      status: 'attention',
      reason: 'Expires within 30 days',
    },
    {
      name: 'expired yesterday',
      device: device({ expirationDate: daysFromNow(-1) }),
      metrics: [metric()],
      status: 'offline',
      reason: 'Expired',
    },
    {
      name: 'unparseable expiration is ignored',
      device: device({ expirationDate: 'not-a-date' }),
      metrics: [metric()],
      status: 'ready',
      reason: 'Connected',
    },
    {
      name: 'inactive wins over expired and on',
      device: device({ status: 'inactive', expirationDate: daysFromNow(-1) }),
      metrics: [metric()],
      status: 'offline',
      reason: 'Marked inactive',
    },
    {
      name: 'expired wins over off',
      device: device({ expirationDate: daysFromNow(-1) }),
      metrics: [metric({ operationalStatus: 'off' })],
      status: 'offline',
      reason: 'Expired',
    },
    {
      name: 'connection off',
      device: device(),
      metrics: [metric({ operationalStatus: 'off' })],
      status: 'offline',
      reason: 'Connection off',
    },
    {
      name: 'expiring wins over stale',
      device: device({ expirationDate: daysFromNow(10) }),
      metrics: [metric({ meta: { lastUpdated: hoursAgo(DEVICE_STALE_AFTER_MS + 1) } })],
      status: 'attention',
      reason: 'Expires within 30 days',
    },
    {
      name: 'standby',
      device: device(),
      metrics: [metric({ operationalStatus: 'standby' })],
      status: 'attention',
      reason: 'Standing by',
    },
    {
      name: 'no metric',
      device: device(),
      metrics: [],
      status: 'attention',
      reason: 'No connection reported',
    },
    {
      name: 'metric without operational status',
      device: device(),
      metrics: [metric({ operationalStatus: undefined })],
      status: 'attention',
      reason: 'Connection status not recorded',
    },
    {
      name: 'unknown device status',
      device: device({ status: 'unknown' }),
      metrics: [metric()],
      status: 'unknown',
      reason: 'Status not recorded',
    },
    {
      name: 'missing device status',
      device: device({ status: undefined }),
      metrics: [metric()],
      status: 'unknown',
      reason: 'Status not recorded',
    },
    {
      name: 'invalid connection',
      device: device(),
      metrics: [metric({ operationalStatus: 'entered-in-error' })],
      status: 'unknown',
      reason: 'Connection status invalid',
    },
  ])('$name', ({ device: input, metrics, status, reason }) => {
    expect(classifyDevice(input, metrics, NOW)).toMatchObject({ status, reason });
  });

  test('hides entered-in-error devices and sorts problems first', () => {
    const summary = summarizeDeviceReadiness(
      [
        device({ id: 'ready', deviceName: [{ name: 'Alpha', type: 'user-friendly-name' }] }),
        device({
          id: 'hidden',
          status: 'entered-in-error',
          deviceName: [{ name: 'Hidden', type: 'user-friendly-name' }],
        }),
        device({
          id: 'offline',
          status: 'inactive',
          deviceName: [{ name: 'Zulu', type: 'user-friendly-name' }],
        }),
      ],
      [metric(), metric({ source: { reference: 'Device/ready' } })],
      NOW
    );

    expect(summary.excludedCount).toBe(1);
    expect(summary.items.map((item) => item.name)).toEqual(['Zulu', 'Alpha']);
  });

  test('uses the newest metric for the same device', () => {
    const classified = classifyDevice(
      device(),
      [
        metric({ id: 'old', operationalStatus: 'off', meta: { lastUpdated: hoursAgo(DEVICE_STALE_AFTER_MS) } }),
        metric({ id: 'new', operationalStatus: 'on', meta: { lastUpdated: NOW.toISOString() } }),
      ],
      NOW
    );
    expect(classified).toMatchObject({ status: 'ready', reason: 'Connected', connection: 'on' });
  });

  test('names and filters rows', () => {
    const friendly = device({
      manufacturer: 'Acme',
      modelNumber: 'M1',
      serialNumber: 'SN-9',
      deviceName: [
        { name: 'Model name', type: 'model-name' },
        { name: 'Friendly', type: 'user-friendly-name' },
      ],
    });
    expect(deviceDisplayName(friendly)).toBe('Friendly');
    expect(deviceDisplayName(device({ id: 'bare', deviceName: undefined, status: 'active' }))).toBe('Unnamed device');

    const items = summarizeDeviceReadiness([friendly], [metric()], NOW).items;
    expect(filterDeviceReadiness(items, 'all', '  sn-9 ').map((item) => item.name)).toEqual(['Friendly']);
    expect(filterDeviceReadiness(items, 'all', 'acme').map((item) => item.name)).toEqual(['Friendly']);
  });
});
