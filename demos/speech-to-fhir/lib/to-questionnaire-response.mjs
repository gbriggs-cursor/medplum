import { readFileSync } from 'node:fs';
import { storyTags } from '../../_shared/fhir/tags.mjs';

const questionnaire = JSON.parse(readFileSync(new URL('../seed/questionnaire.json', import.meta.url), 'utf8'));
export const QUESTIONNAIRE_URL = questionnaire.url;
export const INTAKE_IDENTIFIER_SYSTEM = 'https://foomedical.example/support/intake';

const option = (linkId, code) => {
  const item = questionnaire.item.find((i) => i.linkId === linkId);
  return item.answerOption.find((o) => o.valueCoding.code === code)?.valueCoding;
};

/**
 * Builds a QuestionnaireResponse for the Foo Medical support intake. The caller's identity lives here, on the
 * synthetic patient's chart, and nowhere in Jira.
 * @param {{ intakeId: string, channel?: 'voice' | 'form', fields: Record<string, string | undefined>, patient: { id: string, display?: string }, triage?: string, ticket?: string, authored?: string }} input
 */
export function toQuestionnaireResponse({
  intakeId,
  channel = 'voice',
  fields,
  patient,
  triage,
  ticket,
  authored = new Date().toISOString(),
}) {
  const answer = (linkId, value) => (value === undefined ? undefined : { linkId, answer: [value] });
  const caller = [
    answer('caller-name', fields['caller-name'] && { valueString: fields['caller-name'] }),
    answer('birth-date', fields['birth-date'] && { valueDate: fields['birth-date'] }),
    answer('callback', fields.callback && { valueString: fields.callback }),
  ].filter(Boolean);
  const productCoding = fields.product && option('product', fields.product);
  const triageCoding = triage && option('triage', triage);
  const item = [
    answer('intake-id', { valueString: intakeId }),
    answer('channel', { valueCoding: option('channel', channel) }),
    caller.length ? { linkId: 'caller', item: caller } : undefined,
    answer('product', productCoding && { valueCoding: productCoding }),
    answer('issue', fields.issue && { valueString: fields.issue }),
    answer('triage', triageCoding && { valueCoding: triageCoding }),
    answer('jira-ticket', ticket && { valueString: ticket }),
  ].filter(Boolean);
  return {
    resourceType: 'QuestionnaireResponse',
    meta: { tag: storyTags('speech-to-fhir') },
    identifier: { system: INTAKE_IDENTIFIER_SYSTEM, value: intakeId },
    questionnaire: QUESTIONNAIRE_URL,
    status: 'completed',
    subject: { reference: `Patient/${patient.id}`, display: patient.display },
    source: { reference: `Patient/${patient.id}`, display: patient.display },
    authored,
    item,
  };
}
