// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from 'node:fs';

export interface Complaint {
  complaintId: string;
  capaId: string;
  complaintTicket: string;
  syntheticSubject: string;
  device: string;
  event: string;
  eventDate: string;
  displayedReading: string;
  comparison: string;
  pairingFailureCount: number;
  injuryAlleged: boolean;
  deathAlleged: boolean;
  malfunctionAlleged: boolean;
  displayedMeasurementDisputed: boolean;
  pairingFailure: boolean;
  synthetic: boolean;
  htest: boolean;
}

const REQUIRED_KEYS = [
  'complaint_id',
  'capa_id',
  'complaint_ticket',
  'synthetic_subject',
  'device',
  'event',
  'event_date',
  'displayed_reading',
  'comparison',
  'pairing_failure_count',
  'injury_alleged',
  'death_alleged',
  'malfunction_alleged',
  'displayed_measurement_disputed',
  'pairing_failure',
  'synthetic',
  'htest',
] as const;

export function parseComplaint(markdown: string): Complaint {
  const values = new Map<string, string>();
  for (const line of markdown.split('\n')) {
    const match = /^-\s+([a-z0-9_]+):\s*(.*)$/.exec(line.trim());
    if (match) {
      values.set(match[1], match[2].trim());
    }
  }

  const raw = (key: string): string => {
    const value = values.get(key);
    if (value === undefined || value.length === 0) {
      throw new Error(`Complaint seed is missing ${key}`);
    }
    return value;
  };

  for (const key of REQUIRED_KEYS) {
    raw(key);
  }

  const bool = (key: string): boolean => {
    const value = raw(key);
    if (value !== 'true' && value !== 'false') {
      throw new Error(`Complaint seed ${key} must be true or false`);
    }
    return value === 'true';
  };

  const pairingFailureCount = Number(raw('pairing_failure_count'));
  if (!Number.isInteger(pairingFailureCount) || pairingFailureCount < 0) {
    throw new Error('Complaint seed pairing_failure_count must be a non-negative integer');
  }

  for (const key of values.keys()) {
    if (!REQUIRED_KEYS.includes(key as (typeof REQUIRED_KEYS)[number])) {
      throw new Error(`Complaint seed has unknown field ${key}`);
    }
  }

  const complaint: Complaint = {
    complaintId: raw('complaint_id'),
    capaId: raw('capa_id'),
    complaintTicket: raw('complaint_ticket'),
    syntheticSubject: raw('synthetic_subject'),
    device: raw('device'),
    event: raw('event'),
    eventDate: raw('event_date'),
    displayedReading: raw('displayed_reading'),
    comparison: raw('comparison'),
    pairingFailureCount,
    injuryAlleged: bool('injury_alleged'),
    deathAlleged: bool('death_alleged'),
    malfunctionAlleged: bool('malfunction_alleged'),
    displayedMeasurementDisputed: bool('displayed_measurement_disputed'),
    pairingFailure: bool('pairing_failure'),
    synthetic: bool('synthetic'),
    htest: bool('htest'),
  };

  if (complaint.synthetic !== true || complaint.htest !== true) {
    throw new Error('This demo only triages synthetic htest complaints');
  }
  return complaint;
}

export function loadComplaint(path: string): Complaint {
  return parseComplaint(readFileSync(path, 'utf8'));
}
