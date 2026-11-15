// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Group, Menu } from '@mantine/core';
import { HomerSimpson } from '@medplum/mock';
import type { Meta } from '@storybook/react';
import type { JSX } from 'react';
import { PatientSummary, PatientSummarySkeleton } from './PatientSummary';

export default {
  title: 'Medplum/PatientSummary',
  component: PatientSummary,
} as Meta;

export const Patient = (): JSX.Element => (
  <Box w={350}>
    <PatientSummary patient={HomerSimpson} />
  </Box>
);

export const Loading = (): JSX.Element => (
  <Box w={350}>
    <PatientSummarySkeleton />
  </Box>
);

const headerMenuItems = (
  <>
    <Menu.Item>Edit Patient Profile</Menu.Item>
    <Menu.Item>Import Patient Records</Menu.Item>
  </>
);

export const WithHeaderMenu = (): JSX.Element => (
  <Box w={350}>
    <PatientSummary patient={HomerSimpson} headerMenuItems={headerMenuItems} />
  </Box>
);

export const LastUpdatedBadge = (): JSX.Element => (
  <Group align="flex-start" gap="md" p="md" wrap="nowrap">
    <Box w={320}>
      <PatientSummary
        patient={{ ...HomerSimpson, meta: { ...HomerSimpson.meta, lastUpdated: '2020-01-02T00:00:00.000Z' } }}
        sections={[]}
      />
    </Box>
    <Box w={320}>
      <PatientSummary
        patient={{ ...HomerSimpson, meta: { ...HomerSimpson.meta, lastUpdated: undefined } }}
        sections={[]}
      />
    </Box>
    <Box w={320}>
      <PatientSummary
        patient={{ ...HomerSimpson, meta: { ...HomerSimpson.meta, lastUpdated: '2099-01-01T00:00:00.000Z' } }}
        sections={[]}
      />
    </Box>
  </Group>
);

export const WithHeaderMenuTruncatedName = (): JSX.Element => (
  <Box w={260}>
    <PatientSummary
      patient={{
        ...HomerSimpson,
        name: [{ given: ['Bartholomew', 'Jonathan'], family: 'Simpson-Vandermeerschen' }],
      }}
      headerMenuItems={headerMenuItems}
    />
  </Box>
);
