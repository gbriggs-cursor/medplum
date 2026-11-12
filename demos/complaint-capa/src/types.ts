export interface ComplaintFacts {
  deathAlleged: boolean;
  seriousInjuryAlleged: boolean;
  injuryAlleged: boolean;
  malfunctionAlleged: boolean;
  measurementDisputed: boolean;
  pairingFailures: number;
}

export interface IdRegister {
  nextComplaintId: string;
  nextCapaId: string;
}

export interface Assessment {
  complaintId: string;
  capaId: string | null;
  sopSection: 'CMP-SOP-1' | 'CMP-SOP-2' | 'CMP-SOP-3' | 'CMP-SOP-4';
  reportability: 'yes' | 'no';
  capa: 'open' | 'do-not-open';
  status: 'ready-for-review';
  submittedExternally: false;
  synthetic: true;
  htest: true;
}

export interface PressureSample {
  systolic: number;
  diastolic: number;
  paired: boolean;
  disputed: boolean;
}
