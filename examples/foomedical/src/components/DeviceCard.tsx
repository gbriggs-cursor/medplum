// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import { getDisplayString } from '@medplum/core';
import type { Device } from '@medplum/fhirtypes';
import type { JSX } from 'react';

const BATTERY_SYSTEM = 'https://foo-medical.example/device-property';
const BATTERY_CODE = 'battery-percent';
const BATTERY_UNIT = '%';
const LOW_BATTERY_BELOW = 20;

function readBatteryPercent(device: Device): number | undefined {
  for (const property of device.property ?? []) {
    const matches = property.type?.coding?.some(
      (coding) => coding.system === BATTERY_SYSTEM && coding.code === BATTERY_CODE
    );
    if (!matches) {
      continue;
    }
    for (const quantity of property.valueQuantity ?? []) {
      if (quantity.unit === BATTERY_UNIT && typeof quantity.value === 'number' && Number.isFinite(quantity.value)) {
        return quantity.value;
      }
    }
  }
  return undefined;
}

export interface DeviceCardProps {
  readonly device: Device;
}

export function DeviceCard({ device }: DeviceCardProps): JSX.Element {
  const battery = readBatteryPercent(device);
  const lowBattery = battery !== undefined && battery < LOW_BATTERY_BELOW;

  return (
    <Card withBorder radius="md" shadow="sm" p="lg" data-testid="patient-device-card">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4}>
          <Text fw={600}>{getDisplayString(device)}</Text>
          {device.manufacturer && (
            <Text size="sm" c="dimmed">
              {device.manufacturer}
            </Text>
          )}
          {battery !== undefined && <Text size="sm">Battery {battery}%</Text>}
        </Stack>
        {lowBattery && (
          <Badge color="red" variant="light" tt="none">
            Low battery
          </Badge>
        )}
      </Group>
    </Card>
  );
}
