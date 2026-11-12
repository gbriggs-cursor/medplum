import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { isSynthetic } from '../../_shared/fhir/tags.mjs';
import { extractIntake, parseDate } from '../lib/extract.mjs';
import { QUESTIONNAIRE_URL, toQuestionnaireResponse } from '../lib/to-questionnaire-response.mjs';

const { transcripts } = JSON.parse(readFileSync(new URL('../seed/transcripts.json', import.meta.url), 'utf8'));

for (const t of transcripts) {
  test(`extracts identity and issue from transcript ${t.id}`, () => {
    const out = extractIntake(t.text);
    for (const [k, v] of Object.entries(t.expect)) {
      assert.equal(out[k], v, k);
    }
    assert.deepEqual(out.missing, []);
    assert.ok(!out.issue.includes(t.expect['caller-name']), 'issue text carries the name');
    assert.ok(!/^(um|hi|hello)\b/i.test(out.issue), `issue starts with filler: ${out.issue}`);
  });
}

test('date forms a speech engine returns', () => {
  assert.equal(parseDate('born 3rd of March, 1947'), '1947-03-03');
  assert.equal(parseDate('dob 7/2/1958'), '1958-07-02');
  assert.equal(parseDate('no date here'), undefined);
});

test('a transcript without a birth date is reported, not guessed', () => {
  assert.deepEqual(extractIntake('My name is Grace Liu. How do I reschedule my appointment?').missing, ['birth-date']);
});

test('QuestionnaireResponse links the patient, answers by linkId, and is tagged synthetic', () => {
  const qr = toQuestionnaireResponse({
    intakeId: 'INTAKE-test',
    fields: extractIntake(transcripts[0].text),
    patient: { id: 'p1', display: 'Dana Whitfield' },
    triage: 'answered',
    authored: '2026-11-12T16:00:00.000Z',
  });
  assert.equal(qr.questionnaire, QUESTIONNAIRE_URL);
  assert.equal(qr.subject.reference, 'Patient/p1');
  assert.ok(isSynthetic(qr));
  const caller = qr.item.find((i) => i.linkId === 'caller').item;
  assert.deepEqual(
    caller.map((i) => [i.linkId, Object.values(i.answer[0])[0]]),
    [
      ['caller-name', 'Dana Whitfield'],
      ['birth-date', '1958-07-02'],
      ['callback', '+1-617-555-0100'],
    ]
  );
  assert.equal(qr.item.find((i) => i.linkId === 'triage').answer[0].valueCoding.code, 'answered');
  assert.equal(qr.item.find((i) => i.linkId === 'product').answer[0].valueCoding.code, 'patch');
});
