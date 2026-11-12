import { searchKb } from './kb.mjs';

// Deterministic baseline triage. The @grok/agent-sdk agent in agents/triage makes the same decision with a model;
// both are scored against evals/cases.json.

export const CATEGORIES = ['answered', 'kb_gap', 'bug', 'urgent_clinical'];

const CLINICAL =
  /\b(chest pain|chest hurts|faint(?:ed|ing)?|passed out|can'?t breathe|trouble breathing|short(?:ness)? of breath|stroke|numb(?:ness)?|suicid\w*|overdose|heart (?:is )?racing|bleeding (?:a lot|heavily))\b/i;

const BUG = [
  /\bblank (?:page|screen|white)\b/i,
  /\b(?:page|screen|app|portal) (?:is|stays|goes|went) (?:blank|white|empty)\b/i,
  /\bcrash(?:es|ed|ing)?\b/i,
  /\berror (?:code|message)\b/i,
  /\b(?:500|404) error\b/i,
  /\bspinn(?:er|ing) (?:forever|never stops)\b/i,
  /\b(?:won'?t|doesn'?t|does not|will not) (?:load|open)\b/i,
  /\bnothing happens when\b/i,
  /\b(?:shows?|showing|display(?:s|ing)?) (?:the )?wrong (?:time|date|patient|reading)/i,
  /\bduplicate(?:d)? (?:messages?|appointments?|readings?)\b/i,
  /\bsince the (?:latest |last |new )?update\b/i,
];

const PRODUCTS = [
  ['patch', /\b(patch|acme cardio|bluetooth|pair\w*|ecg|blood pressure|readings?|adhesive|sensor)\b/i],
  ['appointments', /\b(appointments?|reschedul\w*|cancel\w*|visit|booking|book)\b/i],
  ['messages', /\b(messages?|care team|inbox|reply|replies|attachment)\b/i],
  ['portal', /\b(sign ?in|log ?in|password|two-factor|2fa|code|account|portal|app|privacy|caregiver|share)\b/i],
];

export const ANSWER_MIN_SCORE = 4;
export const ANSWER_MIN_COVERAGE = 0.5;

export function detectProduct(text) {
  for (const [id, re] of PRODUCTS) {
    if (re.test(text)) {
      return id;
    }
  }
  return 'portal';
}

/**
 * @param {{ issue: string, product?: string }} intake redacted or raw issue text; triage never needs identity
 * @returns {{ category: string, product: string, article?: string, references: string[], reason: string, priority: string }}
 */
export function triage(intake) {
  const text = String(intake.issue ?? '');
  const product = intake.product || detectProduct(text);
  const references = searchKb(text, { audience: 'engineering', limit: 10 })
    .filter((r) => r.product === product)
    .slice(0, 3)
    .map((r) => r.id);

  if (CLINICAL.test(text)) {
    return {
      category: 'urgent_clinical',
      product,
      references: [],
      reason: 'Clinical red flag in the caller description. Route to emergency guidance, not support.',
      priority: 'Highest',
    };
  }
  const bug = BUG.find((re) => re.test(text));
  if (bug) {
    return { category: 'bug', product, references, reason: `Product defect signal (${bug.source}).`, priority: 'High' };
  }
  const [top] = searchKb(text, { audience: 'patient', limit: 1 });
  if (top && top.score >= ANSWER_MIN_SCORE && top.coverage >= ANSWER_MIN_COVERAGE) {
    return {
      category: 'answered',
      product,
      article: top.id,
      references,
      reason: `${top.id} covers it (score ${top.score}, coverage ${top.coverage}).`,
      priority: 'Low',
    };
  }
  return {
    category: 'kb_gap',
    product,
    references,
    reason: top
      ? `Closest article ${top.id} is too weak (score ${top.score}, coverage ${top.coverage}).`
      : 'No article matches.',
    priority: 'Medium',
  };
}
