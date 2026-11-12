#!/usr/bin/env node
// On-stage tripwire for one pasted note. Jira is dry-run only.
//   node scripts/tripwire.mjs --note P3-N-001 [--blind]
//   node scripts/tripwire.mjs --text "pasted note" [--patient p3-001]

import { buildTicket, chartContext, loadPack, tripwire, writeTicket } from '../lib/tripwire.mjs';

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const { patients, notes } = loadPack();
const note = arg('--text')
  ? { id: 'PASTED', text: arg('--text'), patient: arg('--patient') ?? null }
  : notes.find((n) => n.id === (arg('--note') ?? 'P3-N-001'));
if (!note) {
  console.error(`Unknown note. Use --note ${notes[0].id}..${notes.at(-1).id} or --text "..."`);
  process.exit(2);
}
const blind = process.argv.includes('--blind');
const known = blind ? [] : chartContext(patients.get(note.patient));
const r = tripwire(note.text, { known });

console.log(
  `note ${note.id}${note.patient ? ` (chart ${note.patient}${blind ? ', ignored: --blind' : ''})` : ' (no chart match)'}`
);
console.log(`raw:      ${note.text}`);
console.log(`1. PHI screen on raw text: ${r.rawHits.length ? `REFUSE to store (${r.rawHits.join(', ')})` : 'clean'}`);
console.log(`2. redacted: ${r.redacted}`);
console.log(`3. tripwire after redaction: ${r.allowed ? 'clean' : `BLOCKED (${r.blocked.join(', ')})`}`);
if (!r.allowed) {
  console.log('4. Jira: nothing written. Route the note to a human reviewer.');
  process.exit(3);
}
const file = writeTicket(note.id, buildTicket(note.id, r));
console.log(`4. Jira (dry-run): demos/phi-tripwire/${file}`);
