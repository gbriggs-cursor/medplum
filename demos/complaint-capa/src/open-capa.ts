// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Complaint } from './complaint';
import { matchSop } from './triage';

export const DEMO_DISCLAIMER =
  'DEMO — synthetic data only (HTEST). Fictional device software; not a marketed or cleared device. Nothing submitted outside the demo.';

export const REVIEWER_OVERRIDE = 'A reviewer may change reportability or capa later. This run does not wait.';

export const SOURCE_FIXTURE = 'demos/complaint-capa/seed/complaint.md';

export interface CapaRecord {
  disclaimer: string;
  capa_id: string;
  complaint_id: string;
  complaint_ticket: string;
  source_fixture: string;
  synthetic_subject: string;
  device: string;
  event: string;
  event_date: string;
  displayed_reading: string;
  comparison: string;
  pairing_failure_count: number;
  sop_section: 'CMP-SOP-3';
  capa: 'open';
  capa_rationale: string;
  reportability: 'no';
  reportability_rationale: string;
  status: 'ready-for-review';
  override: string;
  submitted_externally: false;
  synthetic: true;
  htest: true;
}

export function openCapaFromComplaint(complaint: Complaint): CapaRecord {
  const match = matchSop(complaint);
  if (match.capa !== 'open' || match.section !== 'CMP-SOP-3' || match.reportability !== 'no') {
    throw new Error(`CAPA not opened for ${complaint.complaintId}: ${match.section} does not set capa open`);
  }
  if (!match.reportabilityRationale) {
    throw new Error(`CAPA not opened for ${complaint.complaintId}: reportability rationale is missing`);
  }

  return {
    disclaimer: DEMO_DISCLAIMER,
    capa_id: complaint.capaId,
    complaint_id: complaint.complaintId,
    complaint_ticket: complaint.complaintTicket,
    source_fixture: SOURCE_FIXTURE,
    synthetic_subject: complaint.syntheticSubject,
    device: complaint.device,
    event: complaint.event,
    event_date: complaint.eventDate,
    displayed_reading: complaint.displayedReading,
    comparison: complaint.comparison,
    pairing_failure_count: complaint.pairingFailureCount,
    sop_section: 'CMP-SOP-3',
    capa: 'open',
    capa_rationale: match.rationale,
    reportability: 'no',
    reportability_rationale: match.reportabilityRationale,
    status: 'ready-for-review',
    override: REVIEWER_OVERRIDE,
    submitted_externally: false,
    synthetic: true,
    htest: true,
  };
}
