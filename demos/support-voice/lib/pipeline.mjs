import { redact } from '../../_shared/phi/redact.mjs';
import { buildGioIssue, writeGioIssue } from './jira.mjs';
import { triage } from './triage.mjs';

// Confirmed intake -> redact -> triage -> GIO ticket. Triage only ever sees redacted text.
export function prepare(intake, { intakeId } = {}) {
  const known = [intake.caller_name, intake.dob, intake.callback].filter(Boolean);
  const redactedIssue = redact(intake.issue, { known }).text;
  const decision = triage({ issue: redactedIssue, product: intake.product });
  const { payload, redaction } = buildGioIssue(intake, decision, { intakeId });
  return { redactedIssue, decision, payload, redaction };
}

export async function submit(intake, { intakeId, live = false, offline = false, env } = {}) {
  const prepared = prepare(intake, { intakeId });
  const written = await writeGioIssue(prepared.payload, { live: live && !offline, offline, env, name: intakeId });
  return { ...prepared, written };
}
