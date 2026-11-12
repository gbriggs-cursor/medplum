import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { phiScreen, redact } from '../../_shared/phi/redact.mjs';
import { assertSafe } from '../../support-voice/lib/jira.mjs';

const storyDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const packDir = join(storyDir, '..', '_shared', 'data-packs', 'p3-phi-like');

export const LABELS = ['demo', 'medplum', 'story:phi-tripwire', 'track:ls', 'stage:floor'];

export function loadPack() {
  const bundle = JSON.parse(readFileSync(join(packDir, 'patients.json'), 'utf8'));
  const { notes } = JSON.parse(readFileSync(join(packDir, 'notes.json'), 'utf8'));
  const patients = new Map(
    bundle.entry.map((e) => [e.resource.identifier.find((i) => i.system.endsWith('/p3')).value, e.resource])
  );
  return { patients, notes };
}

/** Identifiers the chart already holds for this patient. Redaction removes them wherever they appear. */
export function chartContext(patient) {
  if (!patient) {
    return [];
  }
  const name = patient.name?.[0] ?? {};
  const addr = patient.address?.[0] ?? {};
  return [
    [...(name.given ?? []), name.family].join(' '),
    ...(name.given ?? []),
    name.family,
    patient.birthDate,
    ...(patient.identifier ?? []).filter((i) => !i.system.endsWith('/p3')).map((i) => i.value),
    ...(patient.telecom ?? []).map((t) => t.value),
    ...(addr.line ?? []),
    addr.city,
    addr.postalCode,
    ...(patient.contact ?? []).flatMap((c) => c.name?.given ?? []),
  ].filter(Boolean);
}

// Independent of the pattern list: any long digit run or address-like token left after redaction blocks the write.
export function strictScreen(text) {
  const stripped = text.replace(/\[[A-Z_]+\]/g, ' ');
  const hits = [];
  if (/\d{5,}/.test(stripped.replace(/[\s()-]/g, ''))) {
    hits.push('DIGITS');
  }
  if (/@/.test(stripped)) {
    hits.push('AT_SIGN');
  }
  return hits;
}

/**
 * The L11 tripwire. Raw text is screened (and would be refused by the bot PHI screen), redacted with chart context,
 * then screened again by both the pattern screen and the strict screen before anything may reach Jira.
 */
export function tripwire(text, { known = [] } = {}) {
  const rawHits = [...phiScreen(text, { known }).hits, ...strictScreen(text)];
  const red = redact(text, { known });
  // Blind recall on P3 is about 74% (uncommon names and towns slip through), so without the chart's identifiers
  // nothing is written automatically.
  const blocked = [
    ...phiScreen(red.text, { known }).hits,
    ...strictScreen(red.text),
    ...(known.length ? [] : ['NO_CHART_CONTEXT']),
  ];
  return {
    rawHits: [...new Set(rawHits)],
    redacted: red.text,
    counts: red.counts,
    blocked,
    allowed: blocked.length === 0,
  };
}

export function buildTicket(noteId, result) {
  const payload = {
    fields: {
      project: { key: 'GIO' },
      issuetype: { name: 'Task' },
      summary: `[PHI tripwire] Pasted note ${noteId} (redacted)`,
      description: [
        `Source: pasted note ${noteId}. Synthetic demo data only.`,
        `Redacted: ${Object.entries(result.counts)
          .map(([k, v]) => `${v} ${k}`)
          .join(', ')}`,
        '',
        result.redacted,
      ].join('\n'),
      labels: [...LABELS],
      priority: { name: 'Medium' },
    },
  };
  assertSafe(payload);
  return payload;
}

/** Dry run only: this story never writes to Jira. */
export function writeTicket(noteId, payload) {
  const dir = join(storyDir, 'run', 'outbox');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${noteId}.json`);
  writeFileSync(file, JSON.stringify(payload, null, 2) + '\n');
  return file.slice(storyDir.length + 1);
}
