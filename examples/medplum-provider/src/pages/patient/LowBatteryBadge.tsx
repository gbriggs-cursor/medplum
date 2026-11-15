// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Badge } from '@mantine/core';
import type { MedplumClient } from '@medplum/core';
import type { Observation, Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { ACME_CARDIO_MANUFACTURER, hasLowBatteryDevice, LOW_BATTERY_THRESHOLD_PERCENT } from './lowBattery';

export interface LowBatteryBadgeProps {
  readonly patient: Patient;
}

export function LowBatteryBadge(props: LowBatteryBadgeProps): JSX.Element | null {
  const { patient } = props;
  const medplum = useMedplum();
  const patientId = patient.id;
  const [result, setResult] = useState<{ patientId: string; low: boolean } | undefined>();
  const low = result !== undefined && result.patientId === patientId ? result.low : false;

  useEffect(() => {
    if (!patientId) {
      return undefined;
    }
    let active = true;

    const run = async (): Promise<void> => {
      try {
        const isLow = await loadLowBattery(medplum, patientId);
        if (active) {
          setResult({ patientId, low: isLow });
        }
      } catch {
        if (active) {
          setResult({ patientId, low: false });
        }
      }
    };

    run().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [medplum, patientId]);

  if (!low) {
    return null;
  }

  return (
    <Badge
      variant="light"
      color="orange"
      size="sm"
      radius="xl"
      tt="none"
      style={{ flexShrink: 0 }}
      title={`Acme Cardio battery below ${LOW_BATTERY_THRESHOLD_PERCENT}%`}
      leftSection={<IconAlertTriangle size={12} aria-hidden />}
    >
      Low battery
    </Badge>
  );
}

async function loadLowBattery(medplum: MedplumClient, patientId: string): Promise<boolean> {
  const devices = await medplum.searchResources('Device', {
    patient: `Patient/${patientId}`,
    status: 'active',
    manufacturer: ACME_CARDIO_MANUFACTURER,
    _count: '100',
  });
  if (devices.length === 0) {
    return false;
  }

  const deviceQuery = devices.map((device) => `Device/${device.id}`).join(',');
  let observations: Observation[] = [];
  try {
    observations = await medplum.searchResources('Observation', {
      subject: `Patient/${patientId}`,
      device: deviceQuery,
      _count: '100',
      _sort: '-date',
    });
  } catch {
    observations = [];
  }
  return hasLowBatteryDevice(devices, observations);
}
