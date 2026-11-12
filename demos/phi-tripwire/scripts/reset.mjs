#!/usr/bin/env node
// Deletes P3 patients from the local Medplum server. Safe to re-run; skips when the server is not reachable.

import { STORY_TAG_SYSTEM } from '../../_shared/fhir/tags.mjs';
import { connect } from '../../speech-to-fhir/lib/medplum.mjs';

let medplum;
try {
  medplum = await connect();
} catch (e) {
  console.log(`P3 reset: Medplum not reachable (${e.message}); nothing to delete`);
  process.exit(0);
}
let deleted = 0;
for (;;) {
  const batch = await medplum.searchResources(
    'Patient',
    { _tag: `${STORY_TAG_SYSTEM}|p3-phi-like`, _count: 100 },
    { cache: 'no-cache' }
  );
  if (!batch.length) {
    break;
  }
  for (const p of batch) {
    await medplum.deleteResource('Patient', p.id);
    deleted++;
  }
}
console.log(`P3 reset: deleted ${deleted} Patient`);
