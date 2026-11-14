import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createIntakeStore, IntakeError } from '../lib/intake.mjs';

const input = { caller_name: 'Dana Whitfield', dob: '1958-07-02', issue: 'Patch will not pair', channel: 'voice' };

test('nothing is confirmed without the read-back token', () => {
  const store = createIntakeStore();
  const d = store.draft(input);
  assert.match(d.readback, /Dana Whitfield.*1958-07-02.*Patch will not pair/);
  assert.throws(
    () => store.confirm(d.id, 'forged', { confirmed: true }),
    (e) => e instanceof IntakeError && e.code === 'token_mismatch'
  );
  const ok = store.confirm(d.id, d.confirmToken, { confirmed: true });
  assert.equal(ok.state, 'confirmed');
  assert.equal(ok.intake.issue, 'Patch will not pair');
});

test('a confirmed draft cannot be submitted twice, and a decline writes nothing', () => {
  const store = createIntakeStore();
  const d = store.draft(input);
  store.confirm(d.id, d.confirmToken, { confirmed: true });
  assert.throws(() => store.confirm(d.id, d.confirmToken, { confirmed: true }), /already confirmed/);
  const d2 = store.draft(input);
  assert.deepEqual(store.confirm(d2.id, d2.confirmToken, { confirmed: false }), { id: d2.id, state: 'declined' });
});

test('drafts expire and require every identity field', () => {
  let clock = 0;
  const store = createIntakeStore({ now: () => clock });
  const d = store.draft(input);
  clock = 16 * 60 * 1000;
  assert.throws(() => store.confirm(d.id, d.confirmToken, { confirmed: true }), /expired/);
  assert.throws(() => store.draft({ issue: 'x' }), /caller_name, dob/);
});
