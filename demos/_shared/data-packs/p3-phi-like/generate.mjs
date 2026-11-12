#!/usr/bin/env node
// P3 PHI-like pack: invented patients and free-text support notes with identifiers planted at known offsets.
// Deterministic from the seed. Every identifier is fake by construction:
//   MRNs are HTEST-MRN-*, phones are 555-01xx, SSNs start with 9 (never issued), emails use example.* domains.
//
//   node generate.mjs          write patients.json and notes.json
//   node generate.mjs --check  fail if the committed files differ from a fresh run

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyTags } from '../../fhir/tags.mjs';

const SEED = 20261112;
const PATIENTS = 24;
const dir = dirname(fileURLToPath(import.meta.url));

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const pick = (xs) => xs[Math.floor(rand() * xs.length)];
const int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pad = (n, w = 2) => String(n).padStart(w, '0');

// About half of these given names are outside the redactor's common-name list on purpose, so blind recall is honest.
const GIVEN = [
  'Thaddeus',
  'Marisol',
  'Oluwaseun',
  'Ingrid',
  'Rafael',
  'Keiko',
  'Siobhan',
  'Dmitri',
  'Anika',
  'Tomasz',
  'Yusuf',
  'Esperanza',
  'Lorcan',
  'Priyanka',
  'Hamish',
  'Ximena',
  'Kwame',
  'Signe',
  'Margaret',
  'Robert',
  'Linda',
  'James',
  'Susan',
  'Walter',
  'Dorothy',
  'Henry',
];
const FAMILY = [
  'Okonkwo',
  'Lindqvist',
  'Castellanos',
  'Haverford',
  'Nakamura',
  'Brightwater',
  'Fitzroy',
  'Delacroix',
  'Abernathy',
  'Vasquez',
  'Kowalczyk',
  'Thorne',
  'Sorensen',
  'Achterberg',
  'Quillan',
  'Marchetti',
  'Ellsworth',
  'Pemberton',
  'Szabo',
  'Calloway',
];
const STREETS = [
  'Orchard Lane',
  'Juniper Street',
  'Harbor View Drive',
  'Maple Avenue',
  'Quarry Road',
  'Wexford Court',
  'Linden Way',
  'Bluebell Terrace',
];
const TOWNS = [
  ['Fairhaven', 'MA', '027'],
  ['Millbrook', 'NY', '125'],
  ['Cedar Falls', 'IA', '506'],
  ['Rockport', 'ME', '048'],
  ['Glenwood', 'IL', '604'],
  ['Ashford', 'CT', '062'],
];
const RELATIONS = ['daughter', 'son', 'husband', 'wife'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function person(i) {
  const given = pick(GIVEN);
  const family = pick(FAMILY);
  const y = int(1938, 1990);
  const m = int(1, 12);
  const d = int(1, 28);
  const [town, state, zip3] = pick(TOWNS);
  const area = pick(['413', '617', '508', '845', '319', '207']);
  return {
    id: `p3-${pad(i, 3)}`,
    given,
    family,
    birthDate: `${y}-${pad(m)}-${pad(d)}`,
    dobUs: `${pad(m)}/${pad(d)}/${y}`,
    mrn: `HTEST-MRN-${pad(int(10000, 99999), 5)}`,
    phone: `(${area}) 555-01${pad(int(0, 99))}`,
    email: `${given.toLowerCase()}.${family.toLowerCase()}@example.${pick(['com', 'org', 'net'])}`,
    line: `${int(2, 980)} ${pick(STREETS)}`,
    town,
    state,
    zip: `${zip3}${pad(int(0, 99))}`,
    ssn: `9${pad(int(0, 99))}-${pad(int(10, 99))}-${pad(int(1000, 9999), 4)}`,
    serial: `ACP2-${pad(int(0, 99999999), 8)}`,
    member: `HT-${pad(int(100000, 999999), 6)}`,
    relation: pick(RELATIONS),
    relative: pick(GIVEN),
  };
}

// Each template is a list of literal text and [type, value] parts, so offsets are exact.
const TEMPLATES = [
  (p) => [
    'Pt ',
    ['NAME', `${p.given} ${p.family}`],
    ' (MRN ',
    ['MRN', p.mrn],
    ', DOB ',
    ['DATE', p.dobUs],
    ') called about the Acme Cardio patch v2, SN ',
    ['SERIAL', p.serial],
    '. Reports redness under the adhesive. Callback ',
    ['PHONE', p.phone],
    '.',
  ],
  (p) => [
    ['NAME', `${p.family}, ${p.given}`],
    ' - DOB ',
    ['DATE', p.birthDate],
    ' - readings stopped syncing on ',
    ['DATE', `${pick(MONTHS)} ${int(1, 28)}, 2026`],
    '. Their ',
    p.relation,
    ' ',
    ['NAME', p.relative],
    ' helped her re-pair it. Email ',
    ['EMAIL', p.email],
    '.',
  ],
  (p) => [
    'Spoke with ',
    ['NAME', p.given],
    ' at ',
    ['ADDRESS', p.line],
    ', ',
    ['CITY', p.town],
    ' ',
    ['ZIP', `${p.state} ${p.zip}`],
    '. Portal shows a blank Appointments page since the update. Insurance member ID ',
    ['MEMBER_ID', p.member],
    '.',
  ],
  (p) => [
    'Mrs. ',
    ['NAME', p.family],
    ' says the two-factor code is always rejected. SSN on file ',
    ['SSN', p.ssn],
    ' (verify before reset). Alt number ',
    ['PHONE', p.phone.replace(/[()]/g, '').replace(' ', '-')],
    '.',
  ],
  (p) => [
    'Caller: ',
    ['NAME', `${p.given} ${p.family}`],
    ', MRN: ',
    ['MRN', p.mrn],
    '. Wants to know if the patch is safe through airport security. Lives in ',
    ['CITY', p.town],
    '. Prefers email ',
    ['EMAIL', p.email],
    '.',
  ],
];

function render(parts) {
  let text = '';
  const spans = [];
  for (const part of parts) {
    if (typeof part === 'string') {
      text += part;
    } else {
      const [type, value] = part;
      spans.push({ type, start: text.length, end: text.length + value.length, value });
      text += value;
    }
  }
  return { text, spans };
}

const people = Array.from({ length: PATIENTS }, (_, i) => person(i + 1));
const notes = [];
people.forEach((p, i) => {
  for (const k of [i % TEMPLATES.length, (i + 2) % TEMPLATES.length]) {
    notes.push({ id: `P3-N-${pad(notes.length + 1, 3)}`, patient: p.id, template: k, ...render(TEMPLATES[k](p)) });
  }
});

// No chart match and identifiers the patterns do not know. The tripwire must refuse these, not pass them.
const REFUSE = [
  [
    'Walk-in, no chart yet. Says the patch app crashes. Account ',
    ['ACCOUNT', `${int(10000000, 99999999)}`],
    ', will bring paperwork.',
  ],
  [
    'Traveller from abroad, patch will not pair. Reach on ',
    ['PHONE', `+44 20 7946 ${pad(int(0, 999), 3)}`],
    ' while in the UK.',
  ],
];
REFUSE.forEach((parts, i) =>
  notes.push({ id: `P3-R-${pad(i + 1, 3)}`, patient: null, expect: 'refuse', ...render(parts) })
);

const bundle = {
  resourceType: 'Bundle',
  type: 'transaction',
  meta: { tag: storyTags('p3-phi-like') },
  entry: people.map((p) => ({
    fullUrl: `urn:uuid:${p.id}`,
    request: {
      method: 'POST',
      url: 'Patient',
      ifNoneExist: `identifier=https://foomedical.example/synthetic/p3|${p.id}`,
    },
    resource: {
      resourceType: 'Patient',
      meta: { tag: storyTags('p3-phi-like') },
      identifier: [
        { system: 'https://foomedical.example/synthetic/p3', value: p.id },
        { system: 'https://foomedical.example/mrn', value: p.mrn },
        { system: 'http://hl7.org/fhir/sid/us-ssn', value: p.ssn },
      ],
      name: [{ given: [p.given], family: p.family }],
      birthDate: p.birthDate,
      telecom: [
        { system: 'phone', value: p.phone },
        { system: 'email', value: p.email },
      ],
      address: [{ line: [p.line], city: p.town, state: p.state, postalCode: p.zip }],
      contact: [{ relationship: [{ text: p.relation }], name: { given: [p.relative], family: p.family } }],
    },
  })),
};

const out = {
  'patients.json': JSON.stringify(bundle, null, 2) + '\n',
  'notes.json': JSON.stringify({ seed: SEED, synthetic: true, notes }, null, 2) + '\n',
};

if (process.argv.includes('--check')) {
  const stale = Object.entries(out).filter(([name, body]) => {
    try {
      return readFileSync(join(dir, name), 'utf8') !== body;
    } catch {
      return true;
    }
  });
  if (stale.length) {
    console.error(`FAIL: ${stale.map(([n]) => n).join(', ')} differ from seed ${SEED}. Run: node generate.mjs`);
    process.exit(1);
  }
  console.log(`PASS: P3 pack matches seed ${SEED} (${people.length} patients, ${notes.length} notes)`);
} else {
  for (const [name, body] of Object.entries(out)) {
    writeFileSync(join(dir, name), body);
  }
  console.log(`Wrote P3 pack: ${people.length} patients, ${notes.length} notes, seed ${SEED}`);
}
