// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Alert } from '@mantine/core';
import type { ResourceType } from '@medplum/fhirtypes';
import { Document, PatientDevices, useResource } from '@medplum/react';
import { IconAlertCircle } from '@tabler/icons-react';
import type { JSX } from 'react';
import { useParams } from 'react-router';

export function DevicesPage(): JSX.Element | null {
  const { resourceType, id } = useParams() as { resourceType: ResourceType; id: string };
  const resource = useResource({ reference: resourceType + '/' + id });

  if (!resource) {
    return null;
  }

  return (
    <Document>
      {resource.resourceType === 'Patient' ? (
        <PatientDevices patient={resource} />
      ) : (
        <Alert icon={<IconAlertCircle size={16} />} title="Unsupported resource type" color="red">
          Devices is only supported for Patient resources
        </Alert>
      )}
    </Document>
  );
}
