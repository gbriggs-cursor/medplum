import type { Assessment, ComplaintFacts, IdRegister } from './types.ts';

export function assessComplaint(facts: ComplaintFacts, ids: IdRegister): Assessment {
  const record = {
    complaintId: ids.nextComplaintId,
    status: 'ready-for-review' as const,
    submittedExternally: false as const,
    synthetic: true as const,
    htest: true as const,
  };

  if (facts.deathAlleged) {
    return { ...record, sopSection: 'CMP-SOP-1', reportability: 'yes', capa: 'open', capaId: ids.nextCapaId };
  }
  if (facts.seriousInjuryAlleged) {
    return { ...record, sopSection: 'CMP-SOP-2', reportability: 'yes', capa: 'open', capaId: ids.nextCapaId };
  }
  if (facts.malfunctionAlleged && !facts.injuryAlleged && facts.measurementDisputed) {
    return { ...record, sopSection: 'CMP-SOP-3', reportability: 'no', capa: 'open', capaId: ids.nextCapaId };
  }
  if (facts.pairingFailures > 0 && !facts.measurementDisputed && !facts.injuryAlleged) {
    return { ...record, sopSection: 'CMP-SOP-4', reportability: 'no', capa: 'do-not-open', capaId: null };
  }
  throw new Error('No CMP-SOP section matched');
}
