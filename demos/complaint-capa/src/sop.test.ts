import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CMP_001, ID_REGISTER } from './fixtures.ts';
import { assessComplaint } from './sop.ts';
import type { ComplaintFacts } from './types.ts';

const complaintFixture = readFileSync(new URL('../seed/complaint.md', import.meta.url), 'utf8');
const sopFixture = readFileSync(new URL('../seed/sop.md', import.meta.url), 'utf8');

test('CMP-001 is CMP-SOP-3, not reportable, with CAPA open', () => {
  assert.match(complaintFixture, /Synthetic subject: SP-014/);
  assert.match(complaintFixture, /pairing failed" three times/);
  assert.match(complaintFixture, /90\/50 mmHg/);
  assert.match(complaintFixture, /No injury was reported/);
  assert.match(sopFixture, /## CMP-SOP-3/);
  assert.match(sopFixture, /Reportability: no\. CAPA: open\./);

  const assessment = assessComplaint(CMP_001, ID_REGISTER);
  assert.deepEqual(assessment, {
    complaintId: 'CMP-001',
    capaId: 'CAPA-001',
    sopSection: 'CMP-SOP-3',
    reportability: 'no',
    capa: 'open',
    status: 'ready-for-review',
    submittedExternally: false,
    synthetic: true,
    htest: true,
  });
});

test('a pairing-only complaint stays on CMP-SOP-4 and does not open a CAPA', () => {
  const pairingOnly: ComplaintFacts = {
    deathAlleged: false,
    seriousInjuryAlleged: false,
    injuryAlleged: false,
    malfunctionAlleged: true,
    measurementDisputed: false,
    pairingFailures: 3,
  };
  const assessment = assessComplaint(pairingOnly, ID_REGISTER);
  assert.equal(assessment.sopSection, 'CMP-SOP-4');
  assert.equal(assessment.reportability, 'no');
  assert.equal(assessment.capa, 'do-not-open');
  assert.equal(assessment.capaId, null);
});

test('a death allegation matches CMP-SOP-1 before a disputed measurement', () => {
  const assessment = assessComplaint({ ...CMP_001, deathAlleged: true }, ID_REGISTER);
  assert.equal(assessment.sopSection, 'CMP-SOP-1');
  assert.equal(assessment.reportability, 'yes');
  assert.equal(assessment.capa, 'open');
});

test('a serious injury matches CMP-SOP-2 when no death is alleged', () => {
  const assessment = assessComplaint({ ...CMP_001, seriousInjuryAlleged: true }, ID_REGISTER);
  assert.equal(assessment.sopSection, 'CMP-SOP-2');
  assert.equal(assessment.reportability, 'yes');
  assert.equal(assessment.capa, 'open');
});

test('a disputed measurement with no malfunction matches no section', () => {
  const facts: ComplaintFacts = {
    deathAlleged: false,
    seriousInjuryAlleged: false,
    injuryAlleged: false,
    malfunctionAlleged: false,
    measurementDisputed: true,
    pairingFailures: 0,
  };
  assert.throws(() => assessComplaint(facts, ID_REGISTER), /No CMP-SOP section matched/);
});
