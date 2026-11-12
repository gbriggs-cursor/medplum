import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HYGIENE_CODE, recallDueDate, recallList } from './recall.mjs';

// Synthetic twins only. Never copy a name, DOB, MRN, or phone number from a ticket into this file.
const visit = (patient, start, status = 'finished') => ({
  resourceType: 'Encounter',
  status,
  subject: { reference: `Patient/${patient}` },
  type: [{ coding: [{ code: HYGIENE_CODE }] }],
  period: { start },
  meta: { tag: [{ code: 'synthetic' }, { code: 'HTEST' }] },
});

test('due date is six months after the visit', () => {
  assert.equal(recallDueDate('2026-08-15'), '2027-02-15');
});

test('recall list uses the latest finished hygiene visit', () => {
  const encounters = [
    visit('twin-a', '2026-02-10'),
    visit('twin-a', '2026-08-12'),
    visit('twin-b', '2026-08-20'),
    visit('twin-c', '2026-08-25', 'cancelled'),
  ];
  assert.deepEqual(recallList(encounters, 2027, 2), ['Patient/twin-a', 'Patient/twin-b']);
});

test('non-hygiene encounters are ignored', () => {
  const encounters = [{ ...visit('twin-d', '2026-08-14'), type: [{ coding: [{ code: 'exam' }] }] }];
  assert.deepEqual(recallList(encounters, 2027, 2), []);
});
