// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Card, Group, Loader, Stack, Table, Text, Title } from '@mantine/core';
import type { WithId } from '@medplum/core';
import { formatDateTime, getDisplayString, getReferenceString } from '@medplum/core';
import type { CodeableConcept, Device, Observation, Patient, Quantity, Reference } from '@medplum/fhirtypes';
import { useSearchResources } from '@medplum/react-hooks';
import type { JSX } from 'react';
import { useMemo } from 'react';
import { MedplumLink } from '../MedplumLink/MedplumLink';
import { OperationOutcomeAlert } from '../OperationOutcomeAlert/OperationOutcomeAlert';
import { StatusBadge } from '../StatusBadge/StatusBadge';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAYS = 30;
const CHART_WIDTH = 240;
const CHART_HEIGHT = 48;
const CHART_PADDING = 4;

export interface PatientDevicesProps {
  readonly patient: Patient | Reference<Patient>;
  /** Number of days of readings to chart, ending now. Defaults to 30. */
  readonly days?: number;
}

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

interface ReadingWindow {
  readonly start: number;
  readonly end: number;
}

/**
 * Lists the Device resources linked to a patient and charts each device's
 * Observation readings (matched by `Observation.device`) over a recent window.
 * @param props - The component props.
 * @returns The patient devices element.
 */
export function PatientDevices(props: PatientDevicesProps): JSX.Element {
  const patientRef = getReferenceString(props.patient) ?? '';
  const days = props.days ?? DEFAULT_DAYS;
  // Computed once per `days` so the search URL, and therefore the search, stays stable across renders.
  const range = useMemo<ReadingWindow>(() => {
    const end = Date.now();
    return { start: end - days * DAY_MS, end };
  }, [days]);

  const [devices, loading, outcome] = useSearchResources('Device', { patient: patientRef, _count: '100' });

  if (outcome && outcome.id !== 'ok') {
    return <OperationOutcomeAlert outcome={outcome} />;
  }

  if (!devices || loading) {
    return <Loader />;
  }

  if (devices.length === 0) {
    return <Text c="dimmed">No devices are linked to this patient.</Text>;
  }

  return (
    <Stack>
      {devices.map((device) => (
        <DeviceReadingsCard key={device.id} device={device} patientRef={patientRef} days={days} range={range} />
      ))}
    </Stack>
  );
}

interface DeviceReadingsCardProps {
  readonly device: WithId<Device>;
  readonly patientRef: string;
  readonly days: number;
  readonly range: ReadingWindow;
}

function DeviceReadingsCard(props: DeviceReadingsCardProps): JSX.Element {
  const { device, patientRef, days, range } = props;
  const [observations, loading, outcome] = useSearchResources('Observation', {
    device: getReferenceString(device),
    subject: patientRef,
    date: 'ge' + new Date(range.start).toISOString(),
    _sort: 'date',
    _count: '1000',
  });
  const series = useMemo(() => getDeviceReadingSeries(observations ?? []), [observations]);
  const name = getDisplayString(device);
  const details = [device.type?.text ?? device.type?.coding?.[0]?.display, device.manufacturer, device.serialNumber]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card withBorder data-testid="patient-device-card">
      <Group justify="space-between" mb="xs">
        <div>
          <Title order={4}>
            <MedplumLink to={device}>{name}</MedplumLink>
          </Title>
          {details && (
            <Text size="sm" c="dimmed">
              {details}
            </Text>
          )}
        </div>
        {device.status && <StatusBadge status={device.status} />}
      </Group>
      {outcome && outcome.id !== 'ok' && <OperationOutcomeAlert outcome={outcome} />}
      {(!observations || loading) && !(outcome && outcome.id !== 'ok') && <Loader size="sm" />}
      {observations && !loading && series.length === 0 && (
        <Text size="sm" c="dimmed">
          No readings in the last {days} days.
        </Text>
      )}
      {series.length > 0 && (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Measurement</Table.Th>
              <Table.Th>Latest</Table.Th>
              <Table.Th>Range</Table.Th>
              <Table.Th>Readings</Table.Th>
              <Table.Th>Last {days} days</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {series.map((s) => (
              <ReadingRow key={s.key} series={s} range={range} />
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}

function ReadingRow(props: { readonly series: DeviceReadingSeries; readonly range: ReadingWindow }): JSX.Element {
  const { series, range } = props;
  const latest = series.points[series.points.length - 1];
  const values = series.points.map((p) => p.value);
  return (
    <Table.Tr>
      <Table.Td>{series.label}</Table.Td>
      <Table.Td>
        <Text size="sm" fw={500}>
          {formatValue(latest.value, series.unit)}
        </Text>
        <Text size="xs" c="dimmed">
          {formatDateTime(new Date(latest.time).toISOString())}
        </Text>
      </Table.Td>
      <Table.Td>
        {formatValue(Math.min(...values), '')} – {formatValue(Math.max(...values), series.unit)}
      </Table.Td>
      <Table.Td>{series.points.length}</Table.Td>
      <Table.Td>
        <ReadingChart series={series} range={range} />
      </Table.Td>
    </Table.Tr>
  );
}

function ReadingChart(props: { readonly series: DeviceReadingSeries; readonly range: ReadingWindow }): JSX.Element {
  const { series, range } = props;
  const values = series.points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = range.end - range.start || 1;
  const innerWidth = CHART_WIDTH - 2 * CHART_PADDING;
  const innerHeight = CHART_HEIGHT - 2 * CHART_PADDING;
  const coords = series.points.map((p) => {
    const x = CHART_PADDING + ((p.time - range.start) / span) * innerWidth;
    const y = max === min ? CHART_HEIGHT / 2 : CHART_PADDING + (1 - (p.value - min) / (max - min)) * innerHeight;
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as const;
  });
  const last = coords[coords.length - 1];
  const label = `${series.label} trend, ${series.points.length} readings from ${formatValue(min, '')} to ${formatValue(max, series.unit)}`;

  return (
    <svg
      role="img"
      aria-label={label}
      width={CHART_WIDTH}
      height={CHART_HEIGHT}
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
    >
      <polyline
        fill="none"
        stroke="var(--mantine-color-blue-6)"
        strokeWidth={1.5}
        points={coords.map(([x, y]) => `${x},${y}`).join(' ')}
      />
      <circle cx={last[0]} cy={last[1]} r={2.5} fill="var(--mantine-color-blue-6)" />
    </svg>
  );
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
      entry = { label: code.text ?? coding?.display ?? coding?.code ?? key, unit: quantity.unit ?? quantity.code ?? '', points: [] };
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

function formatValue(value: number, unit: string): string {
  const rounded = Math.round(value * 10) / 10;
  return unit ? `${rounded} ${unit}` : String(rounded);
}
