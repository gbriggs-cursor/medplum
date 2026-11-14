#!/usr/bin/env node
// Deletes QuestionnaireResponses and Patients tagged demo-story|speech-to-fhir on the local Medplum server.
// Keeps the Questionnaire (seeded idempotently by run.mjs). Safe to re-run.

import { STORY_TAG_SYSTEM } from '../../_shared/fhir/tags.mjs';
import { connect } from '../lib/medplum.mjs';

let medplum;
try {
  medplum = await connect();
} catch (e) {
  console.log(`speech-to-fhir reset: Medplum not reachable (${e.message}); nothing to delete`);
  process.exit(0);
}
for (const type of ['QuestionnaireResponse', 'Patient']) {
  let deleted = 0;
  for (;;) {
    const batch = await medplum.searchResources(
      type,
      { _tag: `${STORY_TAG_SYSTEM}|speech-to-fhir`, _count: 100 },
      { cache: 'no-cache' }
    );
    if (!batch.length) {
      break;
    }
    for (const r of batch) {
      await medplum.deleteResource(type, r.id);
      deleted++;
    }
  }
  console.log(`speech-to-fhir reset: deleted ${deleted} ${type}`);
}
