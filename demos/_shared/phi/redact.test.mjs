import assert from 'node:assert/strict';
import { test } from 'node:test';
import { phiScreen, redact } from './redact.mjs';

test('redacts each identifier type with a typed placeholder', () => {
  const note =
    'Pt: Harold Jensen, MRN: HTEST-MRN-77120, DOB 1950-02-11, SSN 912-44-0193. Lives at 42 Orchard Lane, Springfield MA 01105. ' +
    'Call (413) 555-0187 or hjensen@example.org. Patch serial SN: ACP2-00917733. Seen March 3, 2026. Member ID: HT-998812.';
  const { text, counts } = redact(note);
  for (const leaked of [
    'Harold',
    'Jensen',
    '77120',
    '1950-02-11',
    '912-44-0193',
    'Orchard',
    '01105',
    '555-0187',
    'hjensen',
    '00917733',
    'March 3',
    '998812',
  ]) {
    assert.ok(!text.includes(leaked), `leaked ${leaked}: ${text}`);
  }
  for (const type of ['NAME', 'MRN', 'DATE', 'SSN', 'ADDRESS', 'ZIP', 'PHONE', 'EMAIL', 'SERIAL', 'MEMBER_ID']) {
    assert.ok(counts[type] >= 1, `no ${type} in ${JSON.stringify(counts)}`);
  }
});

test('known identifiers are typed and caught when only part of a name is repeated', () => {
  const { text } = redact('Hi, it is Dana. Dana Whitfield, born 1958-07-02. Whitfield is my married name.', {
    known: ['Dana Whitfield', '1958-07-02'],
  });
  assert.equal(text, 'Hi, it is [NAME]. [NAME], born [DATE]. [NAME] is my married name.');
});

test('leaves product words and non-identifying numbers alone', () => {
  const input = 'My Acme Cardio patch v2 lost 24 hours of readings after the update. Battery is at 10 percent.';
  assert.equal(redact(input).text, input);
  assert.deepEqual(phiScreen(input), { clean: true, hits: [] });
});

test('labelled ids need a digit, so a resource reference is not an MRN', () => {
  assert.equal(phiScreen('Chart: QuestionnaireResponse/b10c6c14-8c85-439e-93dc-3975155958b2').clean, true);
  assert.equal(phiScreen('Chart: A1234567').clean, false);
});

test('screen ignores placeholders and flags raw identifiers', () => {
  assert.equal(phiScreen('Caller [NAME], [DATE], [PHONE]').clean, true);
  assert.deepEqual(phiScreen('call 617-555-0142').hits, ['PHONE']);
});
