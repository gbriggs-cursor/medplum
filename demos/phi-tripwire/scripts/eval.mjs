#!/usr/bin/env node
// Scores the tripwire on every P3 note against the planted spans.
//   Gate: no planted identifier reaches an allowed ticket (chart-context mode), and every raw note is flagged.
//   Reported, not gated: blind recall (no chart context) and the refusal count.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { phiScreen } from '../../_shared/phi/redact.mjs';
import { chartContext, loadPack, strictScreen, tripwire } from '../lib/tripwire.mjs';

const storyDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const { patients, notes } = loadPack();
const json = process.argv.includes('--json');

const leaked = (text, spans) => spans.filter((s) => text.includes(s.value));
const byType = {};
let total = 0;
let blindMissed = 0;
let contextMissed = 0;
let leakedThrough = 0;
let refused = 0;
let rawUnflagged = 0;
const failures = [];

for (const n of notes) {
  const ctx = tripwire(n.text, { known: chartContext(patients.get(n.patient)) });
  const blind = tripwire(n.text);
  total += n.spans.length;
  const missBlind = leaked(blind.redacted, n.spans);
  const missCtx = leaked(ctx.redacted, n.spans);
  blindMissed += missBlind.length;
  contextMissed += missCtx.length;
  for (const s of n.spans) {
    byType[s.type] ??= { total: 0, blindMissed: 0, contextMissed: 0 };
    byType[s.type].total++;
  }
  missBlind.forEach((s) => byType[s.type].blindMissed++);
  missCtx.forEach((s) => byType[s.type].contextMissed++);
  if (blind.allowed) {
    failures.push(`${n.id}: allowed without chart context`);
  }
  if (n.expect === 'refuse' && ctx.allowed) {
    failures.push(`${n.id}: should be refused, was allowed`);
  }
  if (!ctx.allowed) {
    refused++;
  } else if (missCtx.length) {
    leakedThrough += missCtx.length;
    failures.push(`${n.id}: allowed with ${missCtx.map((s) => `${s.type} "${s.value}"`).join(', ')}`);
  }
  if (ctx.rawHits.length === 0) {
    rawUnflagged++;
    failures.push(`${n.id}: raw note not flagged by the PHI screen`);
  }
}

// False positives: KB articles hold no identifiers, so neither screen may fire on them.
const kbDir = join(storyDir, '..', 'support-voice', 'kb', 'foomedical');
const falsePositives = readdirSync(kbDir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ f, text: readFileSync(join(kbDir, f), 'utf8').replace(/^---[\s\S]*?---\n/, '') }))
  .filter(({ text }) => !phiScreen(text).clean || strictScreen(text).length)
  .map(({ f, text }) => `${f}: ${[...phiScreen(text).hits, ...strictScreen(text)].join(', ')}`);
failures.push(...falsePositives.map((f) => `false positive on ${f}`));

const pct = (missed, of) => `${(((of - missed) / of) * 100).toFixed(1)}%`;
const summary = {
  notes: notes.length,
  planted: total,
  recall_blind: pct(blindMissed, total),
  recall_chart_context: pct(contextMissed, total),
  allowed: notes.length - refused,
  refused,
  leaked_through: leakedThrough,
  raw_unflagged: rawUnflagged,
  kb_false_positives: falsePositives.length,
  by_type: byType,
};

if (json) {
  console.log(JSON.stringify({ ...summary, failures }, null, 2));
} else {
  console.log(`P3 notes: ${summary.notes}, planted identifiers: ${total}`);
  console.log(`recall blind:         ${summary.recall_blind} (${blindMissed} missed)`);
  console.log(`recall chart context: ${summary.recall_chart_context} (${contextMissed} missed)`);
  console.log(`tickets allowed: ${summary.allowed}, refused by the tripwire: ${refused}`);
  console.log(
    `identifiers in allowed tickets: ${leakedThrough}; raw notes not flagged: ${rawUnflagged}; KB false positives: ${falsePositives.length}`
  );
  console.log('by type (total / blind missed / context missed):');
  for (const [t, v] of Object.entries(byType).sort()) {
    console.log(
      `  ${t.padEnd(10)} ${String(v.total).padStart(3)} / ${String(v.blindMissed).padStart(3)} / ${String(v.contextMissed).padStart(3)}`
    );
  }
  for (const f of failures) {
    console.log(`FAIL  ${f}`);
  }
  console.log(
    failures.length
      ? `FAIL: ${failures.length} gate failure(s)`
      : 'PASS: no identifier reached an allowed ticket, nothing allowed without chart context, every raw note flagged, no KB false positives'
  );
}
process.exit(failures.length ? 1 : 0);
