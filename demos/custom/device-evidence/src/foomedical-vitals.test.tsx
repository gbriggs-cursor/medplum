// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider } from '@mantine/core';
import { formatObservationValue } from '@medplum/core';
import type { Observation } from '@medplum/fhirtypes';
import { MedplumProvider } from '@medplum/react';
import { getObservationValue } from '../../../../packages/react/src/PatientSummary/Vitals.utils';
import { Vitals as PatientSummaryVitals } from '../../../../packages/react/src/PatientSummary/Vitals';
import { act, render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { Vitals } from '../../../../examples/foomedical/src/pages/health-record/Vitals';
import { loadPatientCohort } from './ingest';

describe('Foo Medical Vitals ingest', () => {
  test('MockClient ingest makes BP and ECG searchable for a synthetic patient', async () => {
    const { observations } = await loadPatientCohort();
    expect(observations).toHaveLength(2);
    const bp = observations.find((obs) => obs.code?.coding?.[0]?.code === '85354-9');
    const ecg = observations.find((obs) => obs.code?.coding?.[0]?.code === '11524-6');
    expect(bp?.component).toHaveLength(2);
    expect(formatObservationValue(bp)).toMatch(/mm\[Hg].*mm\[Hg]/);
    expect(ecg?.valueSampledData?.data).toBeTruthy();
    expect(formatObservationValue(ecg)).toMatch(/\/min/);
  });

  test('Foo Medical Vitals table renders ingested BP and ECG rows', async () => {
    const { medplum } = await loadPatientCohort();

    await act(async () => {
      render(
        <MedplumProvider medplum={medplum}>
          <MantineProvider>
            <Suspense fallback={<div>Loading</div>}>
              <Vitals />
            </Suspense>
          </MantineProvider>
        </MedplumProvider>
      );
    });

    expect(await screen.findByText('Vitals')).toBeInTheDocument();
    expect(screen.getByText('Blood pressure panel')).toBeInTheDocument();
    expect(screen.getByText('EKG study')).toBeInTheDocument();
    expect(screen.getByText(/mm\[Hg]/)).toBeInTheDocument();
  });

  test('PatientSummary Vitals reads systolic and diastolic from the ingested panel', async () => {
    const { medplum, patient, observations } = await loadPatientCohort();
    const bp = observations.find((obs) => obs.code?.coding?.[0]?.code === '85354-9');
    expect(bp).toBeDefined();
    expect(getObservationValue(bp as Observation, '8480-6')?.value).toBeGreaterThan(100);
    expect(getObservationValue(bp as Observation, '8462-4')?.value).toBeGreaterThan(60);

    await act(async () => {
      render(
        <MedplumProvider medplum={medplum}>
          <MantineProvider>
            <PatientSummaryVitals patient={patient} vitals={observations} />
          </MantineProvider>
        </MedplumProvider>
      );
    });

    expect(screen.getByText('BP Sys')).toBeInTheDocument();
    expect(screen.getByText('BP Dias')).toBeInTheDocument();
    expect(screen.getAllByText(/mm\[Hg]/)).toHaveLength(2);
  });
});
