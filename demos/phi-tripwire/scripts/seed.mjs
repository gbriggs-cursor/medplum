#!/usr/bin/env node
// Loads the P3 patients into the local Medplum server. Each entry has ifNoneExist, so re-running creates nothing new.

import { readFileSync } from 'node:fs';
import { connect } from '../../speech-to-fhir/lib/medplum.mjs';

const bundle = JSON.parse(
  readFileSync(new URL('../../_shared/data-packs/p3-phi-like/patients.json', import.meta.url), 'utf8')
);
const medplum = await connect();
const result = await medplum.executeBatch(bundle);
const statuses = result.entry.map((e) => e.response.status);
const created = statuses.filter((s) => s.startsWith('201')).length;
console.log(`P3 seed: ${statuses.length} entries, ${created} created, ${statuses.length - created} already present`);
