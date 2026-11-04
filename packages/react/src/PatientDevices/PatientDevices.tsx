// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Alert, Center, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import type { WithId } from '@medplum/core';
import { formatDate, getReferenceString, normalizeErrorString, resolveId } from '@medplum/core';
import type { Device, Observation, Patient, Reference } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react-hooks';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { CodeableConceptDisplay } from '../CodeableConceptDisplay/CodeableConceptDisplay';
import { ResourceName } from '../ResourceName/ResourceName';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import type { BloodPressurePoint } from './PatientDevices.utils';
import { LOOKBACK_DAYS, filterRecentObservations, getLookbackIso, toBloodPressureSeries } from './PatientDevices.utils';

export interface PatientDevicesProps {
  readonly patient: Patient | Reference<Patient>;
}

export function PatientDevices(props: PatientDevicesProps): JSX.Element {
  const medplum = useMedplum();
  const patientId = resolveId(props.patient);
  const [devices, setDevices] = useState<WithId<Device>[]>([]);
  const [observationsByDevice, setObservationsByDevice] = useState<Record<string, Observation[]>>({});
  const [loading, setLoading] = useState(!!patientId);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    if (patientId) {
      setLoading(true);
      setError(undefined);

      const since = getLookbackIso();
      medplum
        .searchResources('Device', { patient: `Patient/${patientId}`, _count: '100' })
        .then(async (found) => {
          const grouped: Record<string, Observation[]> = {};
          await Promise.all(
            found.map(async (device) => {
              const observations = await medplum.searchResources('Observation', {
                device: getReferenceString(device),
                date: `ge${since}`,
                _sort: 'date',
                _count: '200',
              });
              grouped[device.id] = filterRecentObservations(observations, since);
            })
          );
          if (!cancelled) {
            setDevices(found);
            setObservationsByDevice(grouped);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(normalizeErrorString(err));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [medplum, patientId]);

  if (loading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Unable to load devices">
        {error}
      </Alert>
    );
  }

  if (devices.length === 0) {
    return <Text c="dimmed">No devices connected for this patient</Text>;
  }

  return (
    <Stack gap="md">
      <Title order={3}>Devices</Title>
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} observations={observationsByDevice[device.id] ?? []} />
      ))}
    </Stack>
  );
}

function DeviceCard(props: { readonly device: WithId<Device>; readonly observations: Observation[] }): JSX.Element {
  const { device, observations } = props;
  const series = toBloodPressureSeries(observations);
  const latest = series.at(-1);

  return (
    <Paper withBorder p="md" radius="sm">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={2}>
            <ResourceName value={device} fw={600} />
            {device.type && (
              <Text size="sm" c="dimmed">
                <CodeableConceptDisplay value={device.type} />
              </Text>
            )}
          </Stack>
          {device.status && <StatusBadge status={device.status} />}
        </Group>
        {latest ? (
          <Group gap="lg" align="flex-end">
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Latest
              </Text>
              <Text fz="xl" fw={700}>
                {latest.systolic} / {latest.diastolic} mmHg
              </Text>
              <Text size="xs" c="dimmed">
                {formatDate(latest.date)}
              </Text>
            </Stack>
            <Text size="sm" c="dimmed">
              {LOOKBACK_DAYS}-day trend
            </Text>
          </Group>
        ) : (
          <Text c="dimmed">No readings in the last {LOOKBACK_DAYS} days</Text>
        )}
        {series.length > 0 && <BloodPressureChart points={series} />}
      </Stack>
    </Paper>
  );
}

function BloodPressureChart(props: { readonly points: BloodPressurePoint[] }): JSX.Element {
  const { points } = props;
  const width = 480;
  const height = 160;
  const padding = { top: 12, right: 12, bottom: 24, left: 36 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const values = points.flatMap((point) => [point.systolic, point.diastolic]);
  const min = Math.min(...values) - 10;
  const max = Math.max(...values) + 10;
  const range = Math.max(max - min, 1);

  const xFor = (index: number): number =>
    padding.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const yFor = (value: number): number => padding.top + ((max - value) / range) * plotHeight;

  const systolicPath = points.map(
    (point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(point.systolic)}`
  );
  const diastolicPath = points.map(
    (point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(point.diastolic)}`
  );
  const latest = points.at(-1);

  return (
    <Stack gap={4}>
      <svg
        role="img"
        aria-label={`30-day blood pressure trend, latest ${latest?.systolic} over ${latest?.diastolic} millimeters of mercury`}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
      >
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="var(--mantine-color-gray-4)"
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="var(--mantine-color-gray-4)"
        />
        <text x={4} y={padding.top + 4} fontSize="10" fill="var(--mantine-color-gray-6)">
          {Math.round(max)}
        </text>
        <text x={4} y={height - padding.bottom} fontSize="10" fill="var(--mantine-color-gray-6)">
          {Math.round(min)}
        </text>
        <text x={padding.left} y={height - 6} fontSize="10" fill="var(--mantine-color-gray-6)">
          {formatDate(points[0].date)}
        </text>
        <text
          x={width - padding.right}
          y={height - 6}
          fontSize="10"
          textAnchor="end"
          fill="var(--mantine-color-gray-6)"
        >
          {formatDate(points[points.length - 1].date)}
        </text>
        <path d={systolicPath.join(' ')} fill="none" stroke="var(--mantine-color-red-6)" strokeWidth="2" />
        <path d={diastolicPath.join(' ')} fill="none" stroke="var(--mantine-color-blue-6)" strokeWidth="2" />
        {points.map((point, index) => (
          <g key={point.date}>
            <circle cx={xFor(index)} cy={yFor(point.systolic)} r="3" fill="var(--mantine-color-red-6)" />
            <circle cx={xFor(index)} cy={yFor(point.diastolic)} r="3" fill="var(--mantine-color-blue-6)" />
          </g>
        ))}
      </svg>
      <Group gap="md">
        <Text size="xs" c="red">
          Systolic
        </Text>
        <Text size="xs" c="blue">
          Diastolic
        </Text>
        <Text size="xs" c="dimmed">
          mmHg
        </Text>
      </Group>
    </Stack>
  );
}
