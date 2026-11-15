// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Paper } from '@mantine/core';
import type { SearchRequest } from '@medplum/core';
import { DEFAULT_SEARCH_COUNT, formatDate, formatSearchQuery, parseSearchRequest } from '@medplum/core';
import type { SearchControlAdditionalColumn } from '@medplum/react';
import { Loading, SearchControl, useMedplum } from '@medplum/react';
import type { JSX } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { usePatient } from '../../hooks/usePatient';
import { useResourceType } from '../resource/useResourceType';
import { bloodPressureObservationQuery, latestBloodPressureDatesByDevice } from './deviceBloodPressure';
import { prependPatientPath } from './PatientPage.utils';

export function PatientSearchPage(): JSX.Element {
  const medplum = useMedplum();
  const patient = usePatient();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState<SearchRequest>();
  const [lastBpDates, setLastBpDates] = useState<ReadonlyMap<string, string>>(() => new Map());

  useResourceType(search?.resourceType, { onInvalidResourceType: () => navigate('..')?.catch(console.error) });

  useEffect(() => {
    if (!patient) {
      return;
    }

    const parsedSearch = parseSearchRequest(location.pathname + location.search);
    const populatedSearch = addDefaultSearchValues(parsedSearch);

    if (
      location.pathname === `/Patient/${patient.id}/${populatedSearch.resourceType}` &&
      location.search === formatSearchQuery(populatedSearch)
    ) {
      setSearch(populatedSearch);
    } else {
      navigate(`/Patient/${patient.id}/${populatedSearch.resourceType}${formatSearchQuery(populatedSearch)}`)?.catch(
        console.error
      );
    }
  }, [medplum, patient, navigate, location]);

  useEffect(() => {
    let active = true;
    if (patient?.id && search?.resourceType === 'Device') {
      medplum
        .searchResources('Observation', bloodPressureObservationQuery(patient.id))
        .then((observations) => {
          if (active) {
            setLastBpDates(latestBloodPressureDatesByDevice(observations));
          }
        })
        .catch(() => {
          if (active) {
            setLastBpDates(new Map());
          }
        });
    }

    return () => {
      active = false;
    };
  }, [medplum, patient?.id, search?.resourceType]);

  const additionalColumns = useMemo<SearchControlAdditionalColumn[] | undefined>(() => {
    if (search?.resourceType !== 'Device') {
      return undefined;
    }
    return [
      {
        name: 'Last BP date',
        renderCell: (resource) => {
          if (resource.resourceType !== 'Device' || !resource.id) {
            return '—';
          }
          const date = lastBpDates.get(resource.id);
          return date ? formatDate(date) : '—';
        },
      },
    ];
  }, [lastBpDates, search?.resourceType]);

  if (!patient || !search?.resourceType || !search.fields || search.fields.length === 0) {
    return <Loading />;
  }

  return (
    <Paper shadow="xs" m="md" p="xs">
      <SearchControl
        checkboxesEnabled={true}
        search={search}
        additionalColumns={additionalColumns}
        onClick={(e) =>
          navigate(`/Patient/${patient.id}/${e.resource.resourceType}/${e.resource.id}`)?.catch(console.error)
        }
        onAuxClick={(e) => window.open(`/Patient/${patient.id}/${e.resource.resourceType}/${e.resource.id}`, '_blank')}
        onNew={() => {
          navigate(prependPatientPath(patient, `/${search.resourceType}/new`))?.catch(console.error);
        }}
        onChange={(e) => {
          navigate(`/Patient/${patient.id}/${search.resourceType}${formatSearchQuery(e.definition)}`)?.catch(
            console.error
          );
        }}
      />
    </Paper>
  );
}

function addDefaultSearchValues(search: SearchRequest): SearchRequest {
  const fields = search.fields ?? ['_id', '_lastUpdated'];
  const offset = search.offset ?? 0;
  const count = search.count ?? DEFAULT_SEARCH_COUNT;
  return {
    ...search,
    fields,
    offset,
    count,
  };
}
