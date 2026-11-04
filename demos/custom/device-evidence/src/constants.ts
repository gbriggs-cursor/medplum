// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { LOINC } from '@medplum/core';

/** Fixed generator seed for the Acme Cardio patch v2 synthetic cohort. */
export const GENERATOR_SEED = 20251104;
export const GENERATOR_SEED_LABEL = 'acme-cardio-v2-20251104';
export const PATIENT_COUNT = 20;

export const SYNTHETIC_TAG_SYSTEM = 'https://medplum.com/fhir/CodeSystem/synthetic';
export const ACME_IDENTIFIER_SYSTEM = 'https://acme-cardio.example/fhir/sid';
export const ACME_ECG_CODE_SYSTEM = 'https://acme-cardio.example/fhir/CodeSystem/ecg-summary';
export const ACME_DEVICE_TYPE_SYSTEM = 'https://acme-cardio.example/fhir/CodeSystem/device-type';

export const BP_PANEL_CODE = '85354-9';
export const SYSTOLIC_CODE = '8480-6';
export const DIASTOLIC_CODE = '8462-4';
export const HEART_RATE_CODE = '8867-4';
export const EKG_STUDY_CODE = '11524-6';

export const LOINC_DISPLAY: Record<string, string> = {
  [BP_PANEL_CODE]: 'Blood pressure panel',
  [SYSTOLIC_CODE]: 'Systolic blood pressure',
  [DIASTOLIC_CODE]: 'Diastolic blood pressure',
  [HEART_RATE_CODE]: 'Heart rate',
  [EKG_STUDY_CODE]: 'EKG study',
};

export const ACME_ECG_CODES = {
  prInterval: 'pr-interval',
  qrsDuration: 'qrs-duration',
  qtInterval: 'qt-interval',
  interpretation: 'interpretation',
  leadII: 'lead-ii-waveform',
} as const;

export { LOINC };
