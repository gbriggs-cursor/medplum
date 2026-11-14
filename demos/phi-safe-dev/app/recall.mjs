// Hygiene recall list for a practice-management app built on Medplum.
// Input is FHIR Encounter resources; a patient is due `months` after their latest hygiene visit.

export const HYGIENE_CODE = 'hygiene-visit';

export function isHygieneVisit(encounter) {
  return (encounter.type ?? []).some((t) => (t.coding ?? []).some((c) => c.code === HYGIENE_CODE));
}

export function lastHygieneVisits(encounters) {
  const latest = new Map();
  for (const enc of encounters) {
    if (enc.status !== 'finished' || !isHygieneVisit(enc) || !enc.period?.start) {
      continue;
    }
    const patient = enc.subject?.reference;
    const start = enc.period.start.slice(0, 10);
    if (patient && (!latest.has(patient) || latest.get(patient) < start)) {
      latest.set(patient, start);
    }
  }
  return latest;
}

export function recallDueDate(lastVisit, months = 6) {
  const [year, month, day] = lastVisit.split('-').map(Number);
  // Anchor on day 1: setUTCMonth would roll a 31st into the next month when that month is shorter.
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const due = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(day, lastDay)));
  return due.toISOString().slice(0, 10);
}

// month is 1-12
export function recallList(encounters, year, month, months = 6) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return [...lastHygieneVisits(encounters)]
    .filter(([, last]) => recallDueDate(last, months).startsWith(prefix))
    .map(([patient]) => patient)
    .sort();
}
