// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Group, Stack, Table, Text, Title } from '@mantine/core';
import { formatDateTime, formatObservationValue, getReferenceString } from '@medplum/core';
import type { Device, Observation, Patient } from '@medplum/fhirtypes';
import { Document, StatusBadge, useMedplum } from '@medplum/react';
import type { ChartData } from 'chart.js';
import type { JSX } from 'react';
import { LineChart } from '../../components/LineChart';
import {
  buildBloodPressureSeries,
  getDeviceName,
  getDeviceType,
  getThirtyDayDateParam,
  isWithinLastThirtyDays,
  observationsForDevice,
} from './Devices.utils';
import { measurementsMeta } from './Measurement.data';

const bloodPressureMeta = measurementsMeta['blood-pressure'];

function toChartData(observations: Observation[]): ChartData<'line', number[]> | undefined {
  const series = buildBloodPressureSeries(observations);
  if (series.labels.length === 0) {
    return undefined;
  }

  const [diastolicMeta, systolicMeta] = bloodPressureMeta.chartDatasets;
  return {
    labels: series.labels,
    datasets: [
      { ...diastolicMeta, data: series.diastolic },
      { ...systolicMeta, data: series.systolic },
    ],
  };
}

function DeviceReadings(props: { readonly device: Device; readonly observations: Observation[] }): JSX.Element {
  const { device, observations } = props;
  const chartData = toChartData(observations);

  return (
    <Stack gap="md" mt="md">
      {chartData ? (
        <LineChart chartData={chartData} />
      ) : (
        <Text c="dimmed">No blood pressure readings in the last 30 days.</Text>
      )}
      {observations.length > 0 && (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Reading</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {observations.map((observation) => (
              <Table.Tr key={observation.id}>
                <Table.Td>{formatDateTime(observation.effectiveDateTime as string)}</Table.Td>
                <Table.Td>{formatObservationValue(observation)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
      <Text size="sm" c="dimmed">
        {getDeviceName(device)} · last 30 days · mmHg
      </Text>
    </Stack>
  );
}

export function Devices(): JSX.Element {
  const medplum = useMedplum();
  const patient = medplum.getProfile() as Patient;
  const since = getThirtyDayDateParam();
  const devices = medplum.searchResources('Device', 'patient=' + getReferenceString(patient)).read();
  const observations = medplum
    .searchResources('Observation', `patient=${getReferenceString(patient)}&date=ge${since}&_sort=date`)
    .read()
    .filter((observation) => isWithinLastThirtyDays(observation.effectiveDateTime));

  return (
    <Document>
      <Title mb="sm">My Devices</Title>
      <Text mb="xl" c="dimmed">
        Connected medical devices and the readings they sent in the last 30 days.
      </Text>
      {devices.length === 0 ? (
        <Text>You do not have any connected devices yet.</Text>
      ) : (
        <Stack gap="xl">
          {devices.map((device) => {
            const deviceObservations = observationsForDevice(observations, device);
            return (
              <Stack key={device.id} gap="xs">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Title order={3}>{getDeviceName(device)}</Title>
                    <Text c="dimmed">{getDeviceType(device)}</Text>
                  </div>
                  {device.status && <StatusBadge status={device.status} />}
                </Group>
                <DeviceReadings device={device} observations={deviceObservations} />
              </Stack>
            );
          })}
        </Stack>
      )}
    </Document>
  );
}
