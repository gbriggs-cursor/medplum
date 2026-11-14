// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { indexSearchParameterBundle, indexStructureDefinitionBundle } from '@medplum/core';
import { readJson, SEARCH_PARAMETER_BUNDLE_FILES } from '@medplum/definitions';
import type { Bundle, Resource, SearchParameter } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CohortManifest } from './cohort';
import { BUNDLE_PATH } from './cohort';

export const RUN_DIR = join(import.meta.dirname, '..');

export function readBundle(): Bundle {
  return JSON.parse(readFileSync(join(RUN_DIR, BUNDLE_PATH), 'utf8')) as Bundle;
}

export function readManifest(): CohortManifest & { bundleSha256: string } {
  return JSON.parse(readFileSync(join(RUN_DIR, 'manifest.json'), 'utf8'));
}

export function bundleResources(bundle: Bundle): Resource[] {
  return (bundle.entry ?? []).map((e) => e.resource).filter((r): r is Resource => !!r);
}

let definitionsIndexed = false;

/** MockClient only matches `_id` until the R4 search parameters are indexed in this process. */
export function indexFhirDefinitions(): void {
  if (definitionsIndexed) {
    return;
  }
  indexStructureDefinitionBundle(readJson('fhir/r4/profiles-types.json') as Bundle);
  indexStructureDefinitionBundle(readJson('fhir/r4/profiles-resources.json') as Bundle);
  for (const filename of SEARCH_PARAMETER_BUNDLE_FILES) {
    indexSearchParameterBundle(readJson(filename) as Bundle<SearchParameter>);
  }
  definitionsIndexed = true;
}

/**
 * Posts the transaction bundle to a fresh MockClient and fails on any non-2xx entry.
 * @param bundle - Transaction bundle to load.
 * @param medplum - Optional client to load into; defaults to a new MockClient.
 * @returns The loaded client.
 */
export async function loadIntoMockClient(bundle: Bundle, medplum?: MockClient): Promise<MockClient> {
  indexFhirDefinitions();
  medplum ??= new MockClient();
  const response = await medplum.executeBatch(bundle);
  const failed = (response.entry ?? []).filter((e) => !e.response?.status?.startsWith('2'));
  if (failed.length > 0 || (response.entry?.length ?? 0) !== (bundle.entry?.length ?? 0)) {
    throw new Error(`Bundle load failed: ${JSON.stringify(failed.map((e) => e.response))}`);
  }
  return medplum;
}
