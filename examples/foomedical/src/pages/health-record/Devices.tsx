// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Stack, Text, Title } from '@mantine/core';
import { getReferenceString } from '@medplum/core';
import type { Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import type { JSX } from 'react';
import { DeviceCard } from '../../components/DeviceCard';

export function Devices(): JSX.Element {
  const medplum = useMedplum();
  const patient = medplum.getProfile() as Patient;
  const devices = medplum.searchResources('Device', 'patient=' + getReferenceString(patient)).read();

  return (
    <Box p="xl">
      <Title mb="lg">Devices</Title>
      {devices.length === 0 ? (
        <Text c="dimmed">No devices on file.</Text>
      ) : (
        <Stack gap="md">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
