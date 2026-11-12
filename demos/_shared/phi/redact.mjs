// Pattern-based PHI redaction for demo text (support intake, pasted notes) before it reaches Jira.
// It is a demo control, not a certified de-identification method. All demo data is synthetic.

const MONTHS =
  'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';

// Common US given names. Used only to spot "Firstname Lastname" in free text; known caller names are passed in.
const GIVEN_NAMES = new Set(
  `aaron adam alan albert alex alexander alice amanda amy andrea andrew angela anna anne anthony arthur ashley barbara
  benjamin betty beverly bobby brandon brenda brian bruce carl carol carolyn catherine charles cheryl christina christine
  christopher cynthia daniel david deborah debra denise dennis diana diane donald donna dorothy douglas edward elizabeth
  emily emma eric eugene evelyn frances frank gary george gerald gloria grace gregory hannah harold heather helen henry
  jack jacob jacqueline james janet janice jason jean jeffrey jennifer jeremy jerry jessica joan joe john jonathan jose
  joseph joshua joyce juan judith judy julia julie justin karen katherine kathleen kathryn keith kelly kenneth kevin
  kimberly larry laura lauren lawrence linda lisa louis lucas luis margaret maria marie marilyn mark martha mary matthew
  megan melissa michael michelle nancy natalie nathan nicholas nicole noah olivia pamela patricia patrick paul peter
  philip rachel ralph randy raymond rebecca richard robert roger ronald rose roy russell ruth ryan samantha samuel sandra
  sara sarah scott sean sharon shirley sophia stephanie stephen steven susan teresa terry theresa thomas timothy tyler
  victoria vincent virginia walter wayne william willie zachary`.split(/\s+/)
);

const STREET = 'Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Court|Ct|Way|Place|Pl|Terrace|Circle';

// Order matters: specific, labelled identifiers first so a generic rule cannot split them.
const RULES = [
  { type: 'EMAIL', re: /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g },
  { type: 'SSN', re: /\b\d{3}-\d{2}-\d{4}\b/g },
  {
    type: 'MRN',
    re: /\b(?:MRN|medical record(?: number| no\.?)?|chart(?: number| no\.?)?)\s*[:#]?\s*[A-Z0-9][A-Z0-9-]{4,}\b/gi,
  },
  { type: 'MRN', re: /\bHTEST-MRN-\d{4,}\b/g },
  { type: 'SERIAL', re: /\b(?:serial(?: number| no\.?)?|S\/N|SN)\s*[:#]?\s*[A-Z0-9][A-Z0-9-]{5,}\b/gi },
  { type: 'MEMBER_ID', re: /\b(?:member|policy|insurance)(?: id| number| no\.?)\s*[:#]?\s*[A-Z0-9][A-Z0-9-]{4,}\b/gi },
  { type: 'PHONE', re: /(?<![\w-])(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]\d{4}\b/g },
  { type: 'DATE', re: new RegExp(`\\b(?:${MONTHS})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}\\b`, 'gi') },
  { type: 'DATE', re: new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTHS})\\.?,?\\s+\\d{4}\\b`, 'gi') },
  { type: 'DATE', re: /\b\d{4}-\d{2}-\d{2}\b/g },
  { type: 'DATE', re: /\b\d{1,2}[/-]\d{1,2}[/-](?:\d{4}|\d{2})\b/g },
  {
    type: 'ADDRESS',
    re: new RegExp(
      `\\b\\d{1,5}\\s+(?:[A-Z][a-z]+\\s+){1,3}(?:${STREET})\\b\\.?(?:,?\\s+(?:Apt|Unit|Suite)\\.?\\s*\\w+)?`,
      'g'
    ),
  },
  { type: 'ZIP', re: /\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/g },
  { type: 'NAME', re: /\b(?:Mr|Mrs|Ms|Miss|Dr)\.?\s+[A-Z][a-z]+(?:[-'][A-Z][a-z]+)?(?:\s+[A-Z][a-z]+)?\b/g },
  {
    type: 'NAME',
    re: /\b(?:my name is|name is|this is|patient(?: name)?:?|pt:?|caller:?|daughter|son|husband|wife|mother|father)\s+([A-Z][a-z]+(?:\s+[A-Z]\.)?(?:\s+[A-Z][a-z]+(?:[-'][A-Z][a-z]+)?)?)/g,
    group: 1,
  },
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function knownType(value) {
  if (/@/.test(value)) {
    return 'EMAIL';
  }
  if (/^\d{4}-\d{2}-\d{2}$|^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$|[A-Za-z]{3,}\.?\s+\d{1,2},?\s+\d{4}/.test(value)) {
    return 'DATE';
  }
  if (/^[\d\s()+.-]{7,}$/.test(value)) {
    return 'PHONE';
  }
  return /\d/.test(value) ? 'ID' : 'NAME';
}

function knownRules(known = []) {
  const rules = [];
  for (const raw of known) {
    const value = String(raw ?? '').trim();
    if (value.length < 2) {
      continue;
    }
    const type = knownType(value);
    rules.push({ type, re: new RegExp(`(?<![\\w])${escapeRegExp(value)}(?![\\w])`, 'gi') });
    if (type !== 'NAME') {
      continue;
    }
    // Callers often say only their first or last name later in the call.
    for (const part of value.split(/\s+/)) {
      if (part.length >= 3 && /^[A-Za-z][A-Za-z'-]+$/.test(part)) {
        rules.push({ type: 'NAME', re: new RegExp(`\\b${escapeRegExp(part)}\\b`, 'gi') });
      }
    }
  }
  return rules;
}

function givenNameSpans(text) {
  const spans = [];
  const re = /\b([A-Z][a-z]+)\s+([A-Z][a-z]+(?:[-'][A-Z][a-z]+)?)\b/g;
  for (const m of text.matchAll(re)) {
    if (GIVEN_NAMES.has(m[1].toLowerCase())) {
      spans.push({ type: 'NAME', start: m.index, end: m.index + m[0].length });
    }
  }
  return spans;
}

/**
 * Finds identifier spans without changing the text.
 * @param {string} text
 * @param {{ known?: string[] }} [options] known identifiers (for example the caller's name from the intake form)
 * @returns {{ type: string, start: number, end: number }[]} non-overlapping spans, sorted by start
 */
export function findPhi(text, options = {}) {
  const spans = [];
  for (const rule of [...knownRules(options.known), ...RULES]) {
    for (const m of text.matchAll(rule.re)) {
      if (rule.group) {
        const offset = m[0].indexOf(m[rule.group]);
        spans.push({ type: rule.type, start: m.index + offset, end: m.index + offset + m[rule.group].length });
      } else {
        spans.push({ type: rule.type, start: m.index, end: m.index + m[0].length });
      }
    }
  }
  spans.push(...givenNameSpans(text));
  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s.start < last.end) {
      last.end = Math.max(last.end, s.end);
      continue;
    }
    merged.push({ ...s });
  }
  return merged;
}

/**
 * Replaces identifiers with typed placeholders such as [NAME] or [DATE].
 * The result never carries the original values; only counts per type.
 * @param {string} text
 * @param {{ known?: string[] }} [options]
 * @returns {{ text: string, counts: Record<string, number>, total: number }}
 */
export function redact(text, options = {}) {
  const input = String(text ?? '');
  const spans = findPhi(input, options);
  let out = '';
  let cursor = 0;
  const counts = {};
  for (const s of spans) {
    out += input.slice(cursor, s.start) + `[${s.type}]`;
    cursor = s.end;
    counts[s.type] = (counts[s.type] ?? 0) + 1;
  }
  out += input.slice(cursor);
  return { text: out, counts, total: spans.length };
}

/**
 * The tripwire: true when text still looks like it carries an identifier.
 * Placeholders like [NAME] are ignored.
 * @param {string} text
 * @param {{ known?: string[] }} [options]
 */
export function phiScreen(text, options = {}) {
  const hits = findPhi(String(text ?? ''), options).map((s) => s.type);
  return { clean: hits.length === 0, hits: [...new Set(hits)] };
}
