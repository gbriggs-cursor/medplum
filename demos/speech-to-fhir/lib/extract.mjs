import { detectProduct } from '../../support-voice/lib/triage.mjs';

// Deterministic extraction from a speech-to-text transcript. Grok Voice fills the same fields through its
// two-phase confirm; this path lets the story run without a voice key.

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];
const MONTH_RE = MONTHS.map((m) => `${m[0].toUpperCase()}${m.slice(1)}`).join('|');

const pad = (n) => String(n).padStart(2, '0');

export function parseDate(text) {
  let m = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) {
    return `${m[1]}-${m[2]}-${m[3]}`;
  }
  m = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (m) {
    return `${m[3]}-${pad(m[1])}-${pad(m[2])}`;
  }
  m = text.match(new RegExp(`\\b(${MONTH_RE})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, 'i'));
  if (m) {
    return `${m[3]}-${pad(MONTHS.indexOf(m[1].toLowerCase()) + 1)}-${pad(m[2])}`;
  }
  m = text.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_RE}),?\\s+(\\d{4})\\b`, 'i'));
  if (m) {
    return `${m[3]}-${pad(MONTHS.indexOf(m[2].toLowerCase()) + 1)}-${pad(m[1])}`;
  }
  return undefined;
}

export function parsePhone(text) {
  const m = text.match(/(?:\+?1[\s.-]?)?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-](\d{4})\b/);
  return m ? `+1-${m[1]}-${m[2]}-${m[3]}` : undefined;
}

/**
 * @param {string} transcript
 * @returns {{ 'caller-name'?: string, 'birth-date'?: string, callback?: string, product: string, issue: string, missing: string[] }}
 */
export function extractIntake(transcript) {
  const text = String(transcript).replace(/\s+/g, ' ').trim();
  const name = text.match(/\b(?:[Mm]y name is|[Tt]his is|I'm|I am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z'-]+)+)/)?.[1];
  const sentences = text.split(/(?<=[.?!])\s+/);
  const dobSentence = sentences.find((s) => /\b(born|birth|dob)\b/i.test(s));
  const birthDate = dobSentence ? parseDate(dobSentence) : undefined;
  const callback = parsePhone(text);
  const identity = (s) =>
    (name && s.includes(name)) || s === dobSentence || /\b(call me|reach me|my number|call back|callback)\b/i.test(s);
  const filler = (s) =>
    /^(?:(?:hi|hello|hey|um|uh|so|okay|yes)[,.!]?\s*)+$/i.test(s) ||
    /^(?:hi|hello)[,.]?\s+(?:I'm|I am)\s+calling\b/i.test(s);
  const issue = sentences
    .filter((s) => !identity(s) && !filler(s))
    .join(' ')
    .trim();
  const out = { 'caller-name': name, 'birth-date': birthDate, callback, product: detectProduct(issue || text), issue };
  out.missing = ['caller-name', 'birth-date', 'issue'].filter((k) => !out[k]);
  return out;
}
