// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Badge, Group, Paper, Skeleton, Stack, Table, Text, Title } from '@mantine/core';
import { formatDate, getReferenceString, isOk } from '@medplum/core';
import type { OperationOutcome, Patient, Reference } from '@medplum/fhirtypes';
import { useResource, useSearchResources } from '@medplum/react-hooks';
import type { JSX } from 'react';
import { OperationOutcomeAlert } from '../OperationOutcomeAlert/OperationOutcomeAlert';
import { DENTAL_CARE_SYSTEM, HYGIENE_RECALL_CODE, TREATMENT_PLAN_CODE } from './codes';
import type { DentalItemStatus, DentalRecallSummary, DentalTreatmentItem } from './DentalRecall.utils';
import { daysPastDue, isSyntheticPatient, selectHygieneRecall, toTreatmentItems, utcToday } from './DentalRecall.utils';

export {
  CDT_SYSTEM,
  DENTAL_CARE_SYSTEM,
  HYGIENE_RECALL_CODE,
  TREATMENT_PLAN_CODE,
  UNIVERSAL_TOOTH_SYSTEM,
} from './codes';

const STATUS_LABEL: Record<DentalItemStatus, string> = {
  planned: 'Planned',
  scheduled: 'Scheduled',
  completed: 'Completed',
};

const STATUS_COLOR: Record<DentalItemStatus, string> = {
  planned: 'gray',
  scheduled: 'blue',
  completed: 'green',
};

export interface DentalRecallPanelProps {
  readonly patient: Patient | Reference<Patient>;
}

/**
 * Next hygiene recall and treatment-plan rows for one patient.
 *
 * Recall is an active CarePlan with category `hygiene-recall` and due date `period.end`.
 * Rows are ServiceRequests and Procedures with category `treatment-plan`, a CDT `code`,
 * and an ADA Universal tooth on `bodySite`. A Procedure `basedOn` a ServiceRequest replaces that request.
 * @param props - The patient whose chart is shown.
 * @returns Recall status and treatment-plan rows.
 */
export function DentalRecallPanel(props: DentalRecallPanelProps): JSX.Element {
  const reference = getReferenceString(props.patient);
  const canSearch = !!reference?.startsWith('Patient/');
  const searchOptions = { debounceMs: 0, enabled: canSearch };
  const chartPatient = useResource(props.patient);
  const [recalls, , recallsOutcome] = useSearchResources(
    'CarePlan',
    {
      subject: reference,
      category: `${DENTAL_CARE_SYSTEM}|${HYGIENE_RECALL_CODE}`,
      status: 'active,on-hold',
      _count: 100,
    },
    searchOptions
  );
  const [requests, , requestsOutcome] = useSearchResources(
    'ServiceRequest',
    {
      subject: reference,
      category: `${DENTAL_CARE_SYSTEM}|${TREATMENT_PLAN_CODE}`,
      status: 'draft,active,on-hold,completed',
      _count: 100,
    },
    searchOptions
  );
  const [procedures, , proceduresOutcome] = useSearchResources(
    'Procedure',
    {
      subject: reference,
      category: `${DENTAL_CARE_SYSTEM}|${TREATMENT_PLAN_CODE}`,
      status: 'preparation,in-progress,completed',
      _count: 100,
    },
    searchOptions
  );

  const failure = firstFailure(recallsOutcome, requestsOutcome, proceduresOutcome);
  const ready = recalls !== undefined && requests !== undefined && procedures !== undefined;

  return (
    <Stack gap="lg" data-testid="dental-recall-panel">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>Dental recall</Title>
          <Text c="dimmed" size="sm">
            Next hygiene visit and treatment-plan procedures
          </Text>
        </div>
        {isSyntheticPatient(chartPatient) && (
          <Badge variant="outline" color="gray" data-testid="dental-synthetic-badge">
            Synthetic
          </Badge>
        )}
      </Group>
      {!canSearch && <Text c="dimmed">No patient selected</Text>}
      {canSearch && failure && <OperationOutcomeAlert outcome={failure} />}
      {canSearch && !failure && !ready && <DentalRecallSkeleton />}
      {canSearch && !failure && ready && (
        <DentalRecallBody
          recall={selectHygieneRecall(recalls)}
          items={toTreatmentItems(requests, procedures)}
          today={utcToday()}
        />
      )}
    </Stack>
  );
}

function DentalRecallBody(props: {
  readonly recall: DentalRecallSummary | undefined;
  readonly items: DentalTreatmentItem[];
  readonly today: string;
}): JSX.Element {
  const { recall, items, today } = props;
  const openCount = items.filter((item) => item.status !== 'completed').length;
  const overdueDays = recall?.overdue && recall.dueDate ? daysPastDue(recall.dueDate, today) : 0;

  return (
    <>
      <Paper withBorder p="md" radius="md" bg={recall?.overdue ? 'red.0' : undefined} data-testid="dental-recall-card">
        <Group justify="space-between" mb={4}>
          <Text fw={600}>Hygiene recall</Text>
          {recall && (
            <Badge color={recallStatusColor(recall)} data-testid="dental-recall-status">
              {recallStatusLabel(recall)}
            </Badge>
          )}
        </Group>
        {recall ? (
          <Stack gap={2}>
            <Text>{recall.title}</Text>
            <Text size="sm" c="dimmed">
              Next due {recall.dueDate ? formatDate(recall.dueDate) : 'not set'}
            </Text>
            {recall.overdue && (
              <Text size="sm" c="red" fw={600}>
                {overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`}
              </Text>
            )}
            {!recall.overdue && recall.dueDate === today && (
              <Text size="sm" fw={600}>
                Due today
              </Text>
            )}
          </Stack>
        ) : (
          <Text c="dimmed">No hygiene recall on file</Text>
        )}
      </Paper>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={600}>Treatment plan</Text>
          <Text size="sm" c="dimmed" data-testid="dental-treatment-open">
            {openCount} open
          </Text>
        </Group>
        {items.length === 0 ? (
          <Text c="dimmed">No treatment plan items</Text>
        ) : (
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Code</Table.Th>
                <Table.Th>Procedure</Table.Th>
                <Table.Th>Tooth</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.code ?? '—'}</Table.Td>
                  <Table.Td>{item.display}</Table.Td>
                  <Table.Td>{item.tooth ?? '—'}</Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLOR[item.status]} variant="light">
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{item.date ? formatDate(item.date) : '—'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>
    </>
  );
}

function recallStatusLabel(recall: DentalRecallSummary): string {
  if (recall.overdue) {
    return 'Overdue';
  }
  if (recall.dueDate) {
    return 'Due';
  }
  return 'No due date';
}

function recallStatusColor(recall: DentalRecallSummary): string {
  if (recall.overdue) {
    return 'red';
  }
  if (recall.dueDate) {
    return 'blue';
  }
  return 'gray';
}

function DentalRecallSkeleton(): JSX.Element {
  return (
    <Stack gap="sm" data-testid="dental-recall-loading" aria-busy="true">
      <Skeleton height={88} radius="md" />
      <Skeleton height={28} width="40%" />
      <Skeleton height={140} radius="md" />
    </Stack>
  );
}

function firstFailure(...outcomes: (OperationOutcome | undefined)[]): OperationOutcome | undefined {
  return outcomes.find((outcome): outcome is OperationOutcome => !!outcome && !isOk(outcome));
}
