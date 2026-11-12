import { writeGioIssue } from '../../support-voice/lib/jira.mjs';
import { prepare } from '../../support-voice/lib/pipeline.mjs';
import { writeIntake } from './medplum.mjs';

/**
 * Confirmed intake -> QuestionnaireResponse on the chart (identity stays in Medplum) -> redacted GIO ticket that
 * points at the response by id only.
 */
export async function recordIntake(medplum, intake, { intakeId, live = false } = {}) {
  const prepared = prepare(intake, { intakeId });
  const fields = {
    'caller-name': intake.caller_name,
    'birth-date': intake.dob,
    callback: intake.callback,
    product: prepared.decision.product,
    issue: intake.issue,
  };
  const { patient, questionnaireResponse } = await writeIntake(medplum, {
    intakeId,
    channel: intake.channel,
    fields,
    triage: prepared.decision.category,
  });
  prepared.payload.fields.description += `\nChart: QuestionnaireResponse/${questionnaireResponse.id} (caller identity is kept in Medplum only)`;
  const written = await writeGioIssue(prepared.payload, { live, name: intakeId });
  return { ...prepared, written, patient, questionnaireResponse };
}
