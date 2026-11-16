// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import type { Device } from '@medplum/fhirtypes';
import { render, screen } from '@testing-library/react';
import { DeviceCard } from './DeviceCard';

const BATTERY_SYSTEM = 'https://foo-medical.example/device-property';

function device(options?: {
  value?: number;
  system?: string;
  code?: string;
  unit?: string;
  quantities?: { value: number; unit: string }[];
  omitProperty?: boolean;
  emptyQuantity?: boolean;
  decoyFirst?: boolean;
}): Device {
  const base: Device = {
    resourceType: 'Device',
    id: 'home-monitor',
    manufacturer: 'Foo Medical',
    deviceName: [{ name: 'Home Monitor', type: 'user-friendly-name' }],
  };
  if (options?.omitProperty) {
    return base;
  }

  const battery = {
    type: {
      coding: [{ system: options?.system ?? BATTERY_SYSTEM, code: options?.code ?? 'battery-percent' }],
    },
    valueQuantity: options?.emptyQuantity
      ? undefined
      : (options?.quantities ?? [{ value: options?.value ?? 0, unit: options?.unit ?? '%' }]),
  };
  const decoy = {
    type: { coding: [{ system: BATTERY_SYSTEM, code: 'firmware' }] },
    valueCode: [{ text: '1.2.3' }],
  };

  return {
    ...base,
    property: options?.decoyFirst ? [decoy, battery] : [battery],
  };
}

function renderCard(value: Device): void {
  render(
    <MantineProvider>
      <DeviceCard device={value} />
    </MantineProvider>
  );
}

describe('DeviceCard', () => {
  test.each([
    {
      name: 'reads battery-percent and shows Low battery below 20',
      value: device({
        decoyFirst: true,
        quantities: [
          { value: 1, unit: 'V' },
          { value: 19, unit: '%' },
        ],
      }),
      battery: 'Battery 19%',
      badge: true,
    },
    {
      name: 'shows the level and no badge at 20',
      value: device({ value: 20 }),
      battery: 'Battery 20%',
      badge: false,
    },
    {
      name: 'shows no badge when the property is missing',
      value: device({ omitProperty: true }),
      battery: null,
      badge: false,
    },
    {
      name: 'shows no badge when the matching property has no quantity',
      value: device({ emptyQuantity: true }),
      battery: null,
      badge: false,
    },
    {
      name: 'ignores a battery reading from another system',
      value: device({ value: 5, system: 'https://example.com/other' }),
      battery: null,
      badge: false,
    },
    {
      name: 'ignores a different property code',
      value: device({ value: 5, code: 'signal-strength' }),
      battery: null,
      badge: false,
    },
    {
      name: 'ignores a percent value whose unit is not %',
      value: device({ value: 5, unit: 'percent' }),
      battery: null,
      badge: false,
    },
  ])('$name', ({ value, battery, badge }) => {
    renderCard(value);

    expect(screen.getByText('Home Monitor')).toBeInTheDocument();
    if (battery) {
      expect(screen.getByText(battery)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(/^Battery /)).not.toBeInTheDocument();
    }
    if (badge) {
      expect(screen.getByText('Low battery')).toBeInTheDocument();
    } else {
      expect(screen.queryByText('Low battery')).not.toBeInTheDocument();
    }
  });
});
