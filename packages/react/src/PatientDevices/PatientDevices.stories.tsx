// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { createReference } from '@medplum/core';
import type { Device, Observation } from '@medplum/fhirtypes';
import { HomerSimpson } from '@medplum/mock';
import { useMedplum } from '@medplum/react-hooks';
import type { Meta } from '@storybook/react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { Document } from '../Document/Document';
import { PatientDevices } from './PatientDevices';
import { LOINC_DIASTOLIC, LOINC_SYSTOLIC } from './PatientDevices.utils';

export default {
  title: 'Medplum/PatientDevices',
  component: PatientDevices,
} as Meta;

const SYNTHETIC_TAG = {
  system: 'https://medplum.com/fhir/CodeSystem/synthetic',
  code: 'synthetic',
  display: 'Synthetic',
};

const READINGS: { daysAgo: number; systolic: number; diastolic: number }[] = [
  { daysAgo: 28, systolic: 128, diastolic: 82 },
  { daysAgo: 21, systolic: 124, diastolic: 80 },
  { daysAgo: 14, systolic: 130, diastolic: 84 },
  { daysAgo: 7, systolic: 122, diastolic: 78 },
  { daysAgo: 2, systolic: 118, diastolic: 76 },
];

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export const BloodPressureCuff = (): JSX.Element => {
  const medplum = useMedplum();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const device: Device = {
      resourceType: 'Device',
      id: 'story-bp-cuff',
      meta: { tag: [SYNTHETIC_TAG] },
      status: 'active',
      deviceName: [{ name: 'Omron 5 Series Upper Arm', type: 'user-friendly-name' }],
      type: { text: 'Home blood pressure monitor' },
      patient: createReference(HomerSimpson),
    };

    medplum
      .updateResource(device)
      .then(async (created) => {
        await Promise.all(
          READINGS.map((reading, index) => {
            const observation: Observation = {
              resourceType: 'Observation',
              id: `story-bp-obs-${index}`,
              meta: { tag: [SYNTHETIC_TAG] },
              status: 'final',
              code: {
                coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }],
                text: 'Blood pressure',
              },
              subject: createReference(HomerSimpson),
              effectiveDateTime: daysAgoIso(reading.daysAgo),
              device: createReference(created),
              component: [
                {
                  code: {
                    coding: [{ system: 'http://loinc.org', code: LOINC_SYSTOLIC, display: 'Systolic blood pressure' }],
                  },
                  valueQuantity: {
                    value: reading.systolic,
                    unit: 'mmHg',
                    system: 'http://unitsofmeasure.org',
                    code: 'mm[Hg]',
                  },
                },
                {
                  code: {
                    coding: [
                      { system: 'http://loinc.org', code: LOINC_DIASTOLIC, display: 'Diastolic blood pressure' },
                    ],
                  },
                  valueQuantity: {
                    value: reading.diastolic,
                    unit: 'mmHg',
                    system: 'http://unitsofmeasure.org',
                    code: 'mm[Hg]',
                  },
                },
              ],
            };
            return medplum.updateResource(observation);
          })
        );
        setReady(true);
      })
      .catch(console.error);
  }, [medplum]);

  return ready ? (
    <Document>
      <PatientDevices patient={HomerSimpson} />
    </Document>
  ) : (
    <></>
  );
};

export const Empty = (): JSX.Element => (
  <Document>
    <PatientDevices patient={{ resourceType: 'Patient', id: 'no-devices-patient' }} />
  </Document>
);
