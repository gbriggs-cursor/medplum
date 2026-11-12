import type { ComplaintFacts, IdRegister, PressureSample } from './types.ts';

export const ID_REGISTER: IdRegister = {
  nextComplaintId: 'CMP-001',
  nextCapaId: 'CAPA-001',
};

export const CMP_001: ComplaintFacts = {
  deathAlleged: false,
  seriousInjuryAlleged: false,
  injuryAlleged: false,
  malfunctionAlleged: true,
  measurementDisputed: true,
  pairingFailures: 3,
};

export const CMP_001_DISPLAY: PressureSample = {
  systolic: 90,
  diastolic: 50,
  paired: false,
  disputed: true,
};

export const CMP_001_LATER_READING: PressureSample = {
  systolic: 118,
  diastolic: 76,
  paired: true,
  disputed: false,
};
