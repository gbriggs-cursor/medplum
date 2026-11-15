// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Badge } from '@mantine/core';
import type { Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';

const ACME_CARDIO_MANUFACTURER = 'Acme Cardio';

export interface ActiveDeviceCountChipProps {
  readonly patient: Patient;
}

export function ActiveDeviceCountChip(props: ActiveDeviceCountChipProps): JSX.Element | null {
  const { patient } = props;
  const medplum = useMedplum();
  const patientId = patient.id;
  const [result, setResult] = useState<{ patientId: string; count: number } | undefined>();
  const count = result?.patientId === patientId ? result.count : undefined;

  useEffect(() => {
    let active = true;
    if (patientId) {
      medplum
        .search('Device', {
          patient: `Patient/${patientId}`,
          status: 'active',
          manufacturer: ACME_CARDIO_MANUFACTURER,
          _summary: 'count',
        })
        .then((bundle) => {
          if (active) {
            setResult({ patientId, count: bundle.total ?? 0 });
          }
        })
        .catch(() => {
          if (active) {
            setResult({ patientId, count: 0 });
          }
        });
    }

    return () => {
      active = false;
    };
  }, [medplum, patientId]);

  if (!count) {
    return null;
  }

  const label = `${count} ${count === 1 ? 'device' : 'devices'}`;
  return (
    <Badge
      variant="light"
      color="blue"
      size="sm"
      radius="xl"
      tt="none"
      style={{ flexShrink: 0 }}
      title="Active Acme Cardio devices"
    >
      {label}
    </Badge>
  );
}
