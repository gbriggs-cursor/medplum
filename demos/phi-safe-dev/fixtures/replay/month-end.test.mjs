// REPLAY (no key). Synthetic twin for a visit on the 31st. No ticket identifiers.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HYGIENE_CODE, recallDueDate, recallList } from './recall.mjs';

const visit = (patient, start) => ({
  resourceType: 'Encounter',
  status: 'finished',
  subject: { reference: `Patient/${patient}` },
  type: [{ coding: [{ code: HYGIENE_CODE }] }],
  period: { start },
  meta: { tag: [{ code: 'synthetic' }, { code: 'HTEST' }] },
});

test('end-of-month visit is due at the end of the sixth month', () => {
  assert.equal(recallDueDate('2026-08-31'), '2027-02-28');
  assert.deepEqual(recallList([visit('twin-e', '2026-08-31')], 2027, 2), ['Patient/twin-e']);
});
