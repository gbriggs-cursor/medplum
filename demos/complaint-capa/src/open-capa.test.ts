// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadComplaint, parseComplaint, type Complaint } from './complaint';
import { REVIEWER_OVERRIDE, openCapaFromComplaint } from './open-capa';
import { renderCapaHtml } from './render-capa-html';
import { matchSop } from './triage';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const complaintPath = join(root, 'seed/complaint.md');

const capaRationale =
  'CMP-SOP-3 (malfunction alleged, no injury, displayed measurement disputed) sets CAPA: open. CMP-SOP-4 does not apply because the complaint is not a pairing failure only; it also disputes a displayed 90/50 mmHg reading against a home cuff.';

function complaint(overrides: Partial<Complaint> = {}): Complaint {
  return {
    complaintId: 'CMP-TEST',
    capaId: 'CAPA-TEST',
    complaintTicket: 'GIO-45',
    syntheticSubject: 'SP-TEST',
    device: 'Acme Cardio patch v2',
    event: 'Synthetic complaint.',
    eventDate: '2026-11-04',
    displayedReading: '90/50 mmHg',
    comparison: 'home cuff',
    pairingFailureCount: 1,
    injuryAlleged: false,
    deathAlleged: false,
    malfunctionAlleged: true,
    displayedMeasurementDisputed: true,
    pairingFailure: true,
    synthetic: true,
    htest: true,
    ...overrides,
  };
}

describe('CAPA-001', () => {
  it('opens CAPA-001 for CMP-001 under CMP-SOP-3 without waiting or submitting', () => {
    const parsed = loadComplaint(complaintPath);
    expect(parsed).toMatchObject({
      complaintId: 'CMP-001',
      capaId: 'CAPA-001',
      complaintTicket: 'GIO-45',
      syntheticSubject: 'SP-014',
      device: 'Acme Cardio patch v2',
      displayedReading: '90/50 mmHg',
      comparison: 'home cuff',
      pairingFailureCount: 3,
      injuryAlleged: false,
      deathAlleged: false,
      malfunctionAlleged: true,
      displayedMeasurementDisputed: true,
      pairingFailure: true,
      synthetic: true,
      htest: true,
    });

    const match = matchSop(parsed);
    expect(match.section).toBe('CMP-SOP-3');
    expect(match.capa).toBe('open');
    expect(match.reportability).toBe('no');

    const record = openCapaFromComplaint(parsed);
    expect(record).toMatchObject({
      capa_id: 'CAPA-001',
      complaint_id: 'CMP-001',
      complaint_ticket: 'GIO-45',
      synthetic_subject: 'SP-014',
      device: 'Acme Cardio patch v2',
      sop_section: 'CMP-SOP-3',
      capa: 'open',
      capa_rationale: capaRationale,
      reportability: 'no',
      status: 'ready-for-review',
      override: REVIEWER_OVERRIDE,
      submitted_externally: false,
      synthetic: true,
      htest: true,
    });
    expect(record.event).toContain('pairing failed');
    expect(record.event).toContain('90/50 mmHg');

    expect(JSON.parse(readFileSync(join(root, 'out/CAPA-001.json'), 'utf8'))).toEqual(record);
    const html = readFileSync(join(root, 'preview/CAPA-001.html'), 'utf8');
    expect(html).toBe(renderCapaHtml(record));
    expect(html).toContain('status: ready-for-review');
    expect(html).toContain('submitted_externally: false');
  });

  it('does not open a CAPA when the complaint is a pairing failure only', () => {
    const match = matchSop(
      complaint({
        displayedMeasurementDisputed: false,
        malfunctionAlleged: true,
        pairingFailure: true,
      })
    );
    expect(match.section).toBe('CMP-SOP-4');
    expect(match.capa).toBe('not-opened');
    expect(match.rationale).toContain('pairing failure only');
    expect(() => openCapaFromComplaint(complaint({ displayedMeasurementDisputed: false }))).toThrow(/CMP-SOP-4/);
  });

  it('matches CMP-SOP-1 before CMP-SOP-3 when a death is alleged', () => {
    const match = matchSop(complaint({ deathAlleged: true, displayedMeasurementDisputed: true }));
    expect(match.section).toBe('CMP-SOP-1');
    expect(match.capa).toBe('not-opened');
    expect(() => openCapaFromComplaint(complaint({ deathAlleged: true }))).toThrow(/CMP-SOP-1/);
  });

  it('matches CMP-SOP-2 before CMP-SOP-3 when a serious injury is alleged', () => {
    const match = matchSop(complaint({ injuryAlleged: true, deathAlleged: false }));
    expect(match.section).toBe('CMP-SOP-2');
    expect(match.capa).toBe('not-opened');
    expect(() => openCapaFromComplaint(complaint({ injuryAlleged: true }))).toThrow(/CMP-SOP-2/);
  });

  it('does not apply CMP-SOP-3 when no malfunction is alleged', () => {
    expect(() =>
      matchSop(
        complaint({
          malfunctionAlleged: false,
          pairingFailure: false,
          displayedMeasurementDisputed: true,
        })
      )
    ).toThrow(/No CMP-SOP section matches/);
  });

  it.each([
    { synthetic: false, htest: true },
    { synthetic: true, htest: false },
  ])('refuses a complaint that is not synthetic htest data (%o)', (flags) => {
    expect(() => matchSop(complaint(flags))).toThrow(/synthetic htest/);
    expect(() => parseComplaint(seedWith(flags))).toThrow(/synthetic htest/);
  });
});

function seedWith(flags: { synthetic: boolean; htest: boolean }): string {
  const seed = readFileSync(complaintPath, 'utf8')
    .replace('synthetic: true', `synthetic: ${flags.synthetic}`)
    .replace('htest: true', `htest: ${flags.htest}`);
  return seed;
}
