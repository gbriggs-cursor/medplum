// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Coding } from '@medplum/fhirtypes';

/** Category system that distinguishes hygiene recall from treatment-plan resources. */
export const DENTAL_CARE_SYSTEM = 'http://medplum.com/fhir/CodeSystem/dental-care';

/** Active CarePlan whose `period.end` is the next hygiene recall. */
export const HYGIENE_RECALL_CODE = 'hygiene-recall';

/** ServiceRequest, Procedure, and CarePlan rows that belong on the treatment plan. */
export const TREATMENT_PLAN_CODE = 'treatment-plan';

/** ADA CDT procedure codes. */
export const CDT_SYSTEM = 'http://ada.org/cdt';

/** ADA Universal tooth numbers (1–32 permanent, A–T primary). */
export const UNIVERSAL_TOOTH_SYSTEM = 'http://terminology.hl7.org/CodeSystem/ADAUniversalToothDesignationSystem';

/** HL7 purpose-of-use label for synthetic or test health data. */
export const SYNTHETIC_SECURITY: Coding = {
  system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
  code: 'HTEST',
  display: 'test health data',
};
