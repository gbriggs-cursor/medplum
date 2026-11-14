import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertSafe, buildGioIssue, GIO_LABELS, PhiTripwireError } from '../lib/jira.mjs';
import { prepare } from '../lib/pipeline.mjs';

const intake = {
  caller_name: 'Victor Chen',
  dob: '1952-06-19',
  callback: '(312) 555-0166',
  issue: 'Victor here, (312) 555-0166. Every message I send shows up as duplicate messages in my inbox.',
};

test('GIO payload carries support labels, no automation labels, and no caller identity', () => {
  const { payload, decision } = prepare(intake, { intakeId: 'INTAKE-test' });
  assert.equal(decision.category, 'bug');
  assert.equal(payload.fields.project.key, 'GIO');
  assert.deepEqual(payload.fields.labels, GIO_LABELS);
  assert.ok(!payload.fields.labels.some((l) => ['automatable', 'agent-safe'].includes(l)));
  const text = JSON.stringify(payload);
  for (const s of ['Victor', 'Chen', '1952-06-19', '555-0166']) {
    assert.ok(!text.includes(s), `payload leaks ${s}`);
  }
  assert.match(payload.fields.description, /INTAKE-test/);
});

test('tripwire refuses a payload that still holds an identifier', () => {
  const { payload } = buildGioIssue(intake, {
    category: 'bug',
    product: 'messages',
    references: [],
    reason: 'r',
    priority: 'High',
  });
  payload.fields.description += '\nCall back 312-555-0166';
  assert.throws(() => assertSafe(payload), PhiTripwireError);
});

test('automation labels are refused on support tickets', () => {
  const { payload } = buildGioIssue(intake, {
    category: 'bug',
    product: 'messages',
    references: [],
    reason: 'r',
    priority: 'High',
  });
  payload.fields.labels.push('automatable');
  assert.throws(() => assertSafe(payload), /never carry automation labels/);
});
