// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Complaint } from './complaint';

export type SopSection = 'CMP-SOP-1' | 'CMP-SOP-2' | 'CMP-SOP-3' | 'CMP-SOP-4';

export interface SopMatch {
  section: SopSection;
  capa: 'open' | 'not-opened';
  reportability?: 'no';
  rationale: string;
  reportabilityRationale?: string;
}

export function matchSop(complaint: Complaint): SopMatch {
  if (complaint.synthetic !== true || complaint.htest !== true) {
    throw new Error('This demo only triages synthetic htest complaints');
  }

  if (complaint.deathAlleged) {
    return {
      section: 'CMP-SOP-1',
      capa: 'not-opened',
      rationale: 'CMP-SOP-1 matches because a death was alleged. CMP-SOP-3 does not apply.',
    };
  }

  if (complaint.injuryAlleged) {
    return {
      section: 'CMP-SOP-2',
      capa: 'not-opened',
      rationale: 'CMP-SOP-2 matches because a serious injury was alleged. CMP-SOP-3 does not apply.',
    };
  }

  if (
    complaint.malfunctionAlleged &&
    !complaint.deathAlleged &&
    !complaint.injuryAlleged &&
    complaint.displayedMeasurementDisputed
  ) {
    return {
      section: 'CMP-SOP-3',
      capa: 'open',
      reportability: 'no',
      rationale: capaRationale(complaint),
      reportabilityRationale: reportabilityRationale(complaint),
    };
  }

  if (complaint.pairingFailure && !complaint.displayedMeasurementDisputed) {
    return {
      section: 'CMP-SOP-4',
      capa: 'not-opened',
      rationale: 'CMP-SOP-4 matches because the complaint is a pairing failure only.',
    };
  }

  throw new Error(`No CMP-SOP section matches complaint ${complaint.complaintId}`);
}

function capaRationale(complaint: Complaint): string {
  return `CMP-SOP-3 (malfunction alleged, no injury, displayed measurement disputed) sets CAPA: open. CMP-SOP-4 does not apply because the complaint is not a pairing failure only; it also disputes a displayed ${complaint.displayedReading} reading against a ${complaint.comparison}.`;
}

function reportabilityRationale(complaint: Complaint): string {
  return `CMP-SOP-3 is the first matching section. CMP-SOP-1 (death) and CMP-SOP-2 (serious injury) do not apply because no injury was reported. The complaint alleges a malfunction (repeated "pairing failed") and disputes a displayed measurement (${complaint.displayedReading} vs. a ${complaint.comparison}), with no injury alleged.`;
}
