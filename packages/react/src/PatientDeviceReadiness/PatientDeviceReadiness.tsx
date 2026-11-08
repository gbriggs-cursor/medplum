// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Alert, Badge, Button, Center, Group, Loader, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import {
  formatDate,
  formatDateTime,
  getReferenceString,
  isOk,
  normalizeErrorString,
  normalizeOperationOutcome,
} from '@medplum/core';
import type { Device, DeviceMetric, OperationOutcome, Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react-hooks';
import { IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MedplumLink } from '../MedplumLink/MedplumLink';
import { OperationOutcomeAlert } from '../OperationOutcomeAlert/OperationOutcomeAlert';
import type { ClassifiedDevice, DeviceReadinessStatus } from './deviceReadiness';
import {
  DEVICE_EXPIRING_WITHIN_MS,
  DEVICE_STALE_AFTER_MS,
  countDeviceReadiness,
  filterDeviceReadiness,
  summarizeDeviceReadiness,
} from './deviceReadiness';
import {
  isSyntheticDevice,
  loadSyntheticDeviceReadiness,
  syntheticLoadMessage,
  syntheticSampleComplete,
} from './syntheticDevices';

export interface PatientDeviceReadinessProps {
  readonly patient: Patient;
  /** When true, offer to write the labeled sample devices into this project. */
  readonly allowSyntheticSample?: boolean;
}

const READINESS_LABEL: Record<DeviceReadinessStatus, string> = {
  ready: 'Ready',
  attention: 'Needs attention',
  offline: 'Offline',
  unknown: 'Unknown',
};

const READINESS_COLOR: Record<DeviceReadinessStatus, string> = {
  ready: 'green',
  attention: 'yellow',
  offline: 'red',
  unknown: 'gray',
};

const FILTERS: DeviceReadinessStatus[] = ['offline', 'attention', 'unknown', 'ready'];

const DAY_MS = 24 * 60 * 60 * 1000;

export function PatientDeviceReadiness(props: PatientDeviceReadinessProps): JSX.Element {
  const { patient, allowSyntheticSample = false } = props;
  const medplum = useMedplum();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState<DeviceReadinessStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleMessage, setSampleMessage] = useState<string>();
  const [sampleError, setSampleError] = useState<string>();
  const { devices, metrics, loading, outcome } = usePatientDevices(patient.id, refreshKey);
  const model = useMemo(() => summarizeDeviceReadiness(devices, metrics, new Date()), [devices, metrics]);
  const visible = useMemo(() => filterDeviceReadiness(model.items, filter, query), [model.items, filter, query]);
  const counts = useMemo(() => countDeviceReadiness(model.items), [model.items]);
  const sampleComplete = syntheticSampleComplete(devices);
  const filtersActive = filter !== 'all' || query.trim().length > 0;

  const loadSample = useCallback(async () => {
    if (!patient.id) {
      return;
    }
    setSampleLoading(true);
    setSampleError(undefined);
    try {
      const result = await loadSyntheticDeviceReadiness(medplum, patient);
      setSampleMessage(syntheticLoadMessage(result));
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setSampleError(normalizeErrorString(err));
    } finally {
      setSampleLoading(false);
    }
  }, [medplum, patient]);

  let body: JSX.Element;
  if (!patient.id) {
    body = <Alert color="yellow">Save the patient before reviewing devices.</Alert>;
  } else if (loading) {
    body = (
      <Center mih={140}>
        <Loader />
      </Center>
    );
  } else if (outcome && !isOk(outcome)) {
    body = <OperationOutcomeAlert outcome={outcome} />;
  } else if (model.items.length === 0) {
    body = <EmptyDevices excludedCount={model.excludedCount} allowSyntheticSample={allowSyntheticSample} />;
  } else {
    body = (
      <Stack gap="sm">
        <Group gap="xs">
          {FILTERS.map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'filled' : 'light'}
              color={READINESS_COLOR[status]}
              aria-pressed={filter === status}
              aria-label={`${READINESS_LABEL[status]}: ${counts[status]}`}
              onClick={() => setFilter((current) => (current === status ? 'all' : status))}
            >
              {READINESS_LABEL[status]} {counts[status]}
            </Button>
          ))}
        </Group>
        <Group align="flex-end">
          <TextInput
            label="Filter devices"
            placeholder="Name, manufacturer, or serial"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          {filtersActive && (
            <Button
              variant="subtle"
              onClick={() => {
                setFilter('all');
                setQuery('');
              }}
            >
              Clear filters
            </Button>
          )}
        </Group>
        {model.excludedCount > 0 && (
          <Text size="sm" c="dimmed">
            {hiddenDeviceCopy(model.excludedCount)}
          </Text>
        )}
        {visible.length === 0 ? <EmptyMatch /> : <DeviceTable items={visible} />}
        {model.items.some((item) => isSyntheticDevice(item.device)) && (
          <Text size="sm" c="dimmed">
            Rows named Synthetic are labeled fixtures stored in this project. They are not live equipment.
          </Text>
        )}
      </Stack>
    );
  }

  return (
    <Stack gap="md" component="section" aria-label="Device readiness">
      <Group justify="space-between" align="flex-start">
        <Title order={3}>Device readiness</Title>
        {allowSyntheticSample && patient.id && (
          <Button
            variant="light"
            loading={sampleLoading}
            disabled={sampleComplete}
            onClick={() => {
              loadSample().catch(console.error);
            }}
          >
            {sampleComplete ? 'Synthetic sample loaded' : 'Load synthetic sample'}
          </Button>
        )}
      </Group>
      <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />} title="How status is decided">
        {readinessExplanation()}
      </Alert>
      {sampleMessage && (
        <Text size="sm" c="dimmed">
          {sampleMessage}
        </Text>
      )}
      {sampleError && (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          {sampleError}
        </Alert>
      )}
      {body}
    </Stack>
  );
}

function readinessExplanation(): string {
  const hours = DEVICE_STALE_AFTER_MS / (60 * 60 * 1000);
  const days = DEVICE_EXPIRING_WITHIN_MS / DAY_MS;
  return `Reads Device and DeviceMetric records in this project. No device gateway is contacted. Ready means active, not expired, and reporting on within ${hours} hours. Needs attention means expiring within ${days} days, a stale or standby connection, or no connection. Offline means inactive, expired, or reporting off.`;
}

function hiddenDeviceCopy(count: number): string {
  return count === 1
    ? '1 device is hidden because its status is entered-in-error.'
    : `${count} devices are hidden because their status is entered-in-error.`;
}

function EmptyDevices(props: { readonly excludedCount: number; readonly allowSyntheticSample: boolean }): JSX.Element {
  const title = props.excludedCount > 0 ? 'No devices to review' : 'No devices linked to this patient';
  return (
    <Stack gap="xs" role="status">
      <Text fw={600}>{title}</Text>
      {props.excludedCount > 0 ? (
        <Text size="sm" c="dimmed">
          {hiddenDeviceCopy(props.excludedCount)}
        </Text>
      ) : (
        <Text size="sm" c="dimmed">
          Link a Device to this patient to see whether it is ready, needs attention, or is offline. Connection comes
          from DeviceMetric operational status.
          {props.allowSyntheticSample
            ? ' Load synthetic sample writes four labeled examples into this project: ready, expiring, offline, and unknown.'
            : ''}
        </Text>
      )}
    </Stack>
  );
}

function EmptyMatch(): JSX.Element {
  return (
    <Stack gap="xs" role="status">
      <Text fw={600}>No devices match</Text>
      <Text size="sm" c="dimmed">
        No linked device fits this status or text.
      </Text>
    </Stack>
  );
}

function DeviceTable(props: { readonly items: ClassifiedDevice[] }): JSX.Element {
  return (
    <Table highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Device</Table.Th>
          <Table.Th style={{ width: '1%' }}>Readiness</Table.Th>
          <Table.Th>Why</Table.Th>
          <Table.Th>Connection</Table.Th>
          <Table.Th>Expires</Table.Th>
          <Table.Th>Last contact</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {props.items.map((item) => (
          <Table.Tr key={item.device.id ?? item.name}>
            <Table.Td>
              {item.device.id ? <MedplumLink to={item.device}>{item.name}</MedplumLink> : item.name}
              <Text size="xs" c="dimmed">
                {[item.device.manufacturer, item.device.modelNumber, item.device.serialNumber]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </Table.Td>
            <Table.Td style={{ width: '1%', whiteSpace: 'nowrap' }}>
              <Badge
                color={READINESS_COLOR[item.status]}
                variant="light"
                styles={{ root: { maxWidth: 'none' }, label: { overflow: 'visible', textOverflow: 'clip' } }}
              >
                {READINESS_LABEL[item.status]}
              </Badge>
            </Table.Td>
            <Table.Td>{item.reason}</Table.Td>
            <Table.Td>{connectionLabel(item.connection)}</Table.Td>
            <Table.Td>{item.device.expirationDate ? formatDate(item.device.expirationDate) : '—'}</Table.Td>
            <Table.Td>{item.lastContact ? formatDateTime(item.lastContact) : 'Not reported'}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function connectionLabel(connection: ClassifiedDevice['connection']): string {
  if (connection === 'on') {
    return 'On';
  }
  if (connection === 'off') {
    return 'Off';
  }
  if (connection === 'standby') {
    return 'Standby';
  }
  return 'Not reported';
}

interface DeviceLoadState {
  readonly devices: Device[];
  readonly metrics: DeviceMetric[];
  readonly loading: boolean;
  readonly outcome?: OperationOutcome;
}

function usePatientDevices(patientId: string | undefined, refreshKey: number): DeviceLoadState {
  const medplum = useMedplum();
  const [state, setState] = useState<DeviceLoadState>({ devices: [], metrics: [], loading: !!patientId });

  useEffect(() => {
    if (!patientId) {
      return () => {};
    }
    let active = true;
    medplum
      .searchResources('Device', { patient: `Patient/${patientId}`, _count: 100 })
      .then(async (devices) => {
        const source = devices.map((device) => getReferenceString(device)).join(',');
        const metrics = source ? await medplum.searchResources('DeviceMetric', { source, _count: 200 }) : [];
        return { devices, metrics };
      })
      .then((result) => {
        if (active) {
          setState({ ...result, loading: false });
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setState({ devices: [], metrics: [], loading: false, outcome: normalizeOperationOutcome(err) });
        }
      });
    return () => {
      active = false;
    };
  }, [medplum, patientId, refreshKey]);

  return state;
}
