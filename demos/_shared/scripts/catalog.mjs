#!/usr/bin/env node
// Validates every demos/<story>/story.yaml and rebuilds demos/catalog.yaml.
//
//   node demos/_shared/scripts/catalog.mjs          validate, then write catalog.yaml
//   node demos/_shared/scripts/catalog.mjs --check  validate, and fail if catalog.yaml is stale
//
// Exit code 1 on any validation error or a stale catalog.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const demosDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const repoRoot = join(demosDir, '..');
const catalogPath = join(demosDir, 'catalog.yaml');
const checkOnly = process.argv.includes('--check');

const ENVIRONMENT = '67842161';
const JIRA_PROJECT = 'GIO';
const TRACKS = ['generic', 'ls'];
const STAGES = ['generic', '01', '02', '03', '04', '05', '06', '07', 'post-market'];
const READINESS = ['exists', 'adapt', 'new', 'planned'];
const GENERIC_PROSPECTS = ['Acme Cardio', 'Foo Medical'];
const BASE_LABELS = ['demo', 'medplum'];
const AUTOMATION_LABELS = ['automatable', 'agent-safe'];
// The ticket-to-PR automation was proven on tickets that also carried `maintenance`.
const LEGACY_LABELS = ['maintenance'];

const REQUIRED_TEXT = [
  'id',
  'code',
  'title',
  'track',
  'stage',
  'readiness',
  'persona',
  'trigger',
  'surface',
  'data_pack',
  'artifact',
  'gate',
  'wow',
  'blast_radius',
  'runtime',
  'environment',
];
const REQUIRED_LISTS = ['actors', 'proof', 'fallback'];

// Agents start from the repository's default branch. These patterns pin a demo to a branch.
const BRANCH_PINNING = [
  /\btake-\d+\b/,
  /\bdemo-base\b/,
  /\bdemo-kb\b/,
  /\bdemo\/support-kb\b/,
  /\bcustom\/device-evidence\b/,
  /--base[ =]\S+/,
  /\bgit (checkout|switch)\s+(?!-b\b|-c\b)[\w./-]+/,
];
const PIN_SCAN_DIRS = ['demos', '.cursor'];
const PIN_SCAN_SKIP = new Set(['node_modules', 'coverage', 'dist']);
const PIN_SCAN_EXT = /\.(md|mdc|yaml|yml|json|sh|mjs|ts|tsx|txt)$/;

const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

function storyDirs() {
  return readdirSync(demosDir)
    .filter((name) => !name.startsWith('_') && !name.startsWith('.'))
    .filter((name) => statSync(join(demosDir, name)).isDirectory())
    .sort();
}

function validateStory(dir) {
  const where = `demos/${dir}/story.yaml`;
  const file = join(demosDir, dir, 'story.yaml');
  if (!existsSync(file)) {
    err(`demos/${dir}`, 'missing story.yaml');
    return undefined;
  }
  let card;
  try {
    card = YAML.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    err(where, `invalid YAML: ${e.message}`);
    return undefined;
  }
  if (!card || typeof card !== 'object') {
    err(where, 'not a mapping');
    return undefined;
  }

  for (const key of REQUIRED_TEXT) {
    if (typeof card[key] !== 'string' || !card[key].trim()) {
      err(where, `\`${key}\` must be a non-empty string`);
    }
  }
  for (const key of REQUIRED_LISTS) {
    if (!Array.isArray(card[key])) {
      err(where, `\`${key}\` must be a list`);
    }
  }
  if (card.id !== dir) {
    err(where, `\`id\` (${card.id}) must match the folder name (${dir})`);
  }
  if (!TRACKS.includes(card.track)) {
    err(where, `\`track\` must be one of ${TRACKS.join(', ')}`);
  }
  if (!STAGES.includes(card.stage)) {
    err(where, `\`stage\` must be one of ${STAGES.join(', ')}`);
  }
  if (card.track === 'generic' && card.stage !== 'generic') {
    err(where, 'generic-track stories use `stage: generic`');
  }
  if (!READINESS.includes(card.readiness)) {
    err(where, `\`readiness\` must be one of ${READINESS.join(', ')}`);
  }
  if (card.environment !== ENVIRONMENT) {
    err(where, `\`environment\` must be ${ENVIRONMENT}`);
  }
  if (Array.isArray(card.proof) && card.proof.length === 0) {
    err(where, '`proof` needs at least one item');
  }
  if (Array.isArray(card.actors) && card.actors.length === 0) {
    err(where, '`actors` needs at least one item');
  }

  if (Array.isArray(card.fallback)) {
    for (const pr of card.fallback) {
      if (!Number.isInteger(pr) || pr < 1) {
        err(where, `\`fallback\` holds PR numbers only, got ${JSON.stringify(pr)}`);
      }
    }
    if (card.fallback.length === 0 && !card.fallback_note) {
      err(where, 'an empty `fallback` needs a `fallback_note`');
    }
  }

  if (card.reset !== null && card.reset !== undefined) {
    if (card.reset !== `demos/${dir}/reset.sh`) {
      err(where, `\`reset\` must be demos/${dir}/reset.sh or null`);
    } else if (!existsSync(join(repoRoot, card.reset))) {
      err(where, `\`reset\` points at a missing file: ${card.reset}`);
    } else if ((statSync(join(repoRoot, card.reset)).mode & 0o111) === 0) {
      err(where, `${card.reset} is not executable`);
    }
  } else if (!('reset' in card)) {
    err(where, '`reset` is required (a path, or null when the story seeds nothing)');
  }

  if (card.answer_key !== undefined && !/^answer-keys:\/\/[a-z0-9-]+\/$/.test(card.answer_key)) {
    err(where, '`answer_key` must look like answer-keys://<story>/');
  }

  validateGate(where, card);
  validateVariables(where, dir, card);
  validateJira(where, dir, card);
  validateKeyFree(where, dir, card);

  for (const doc of ['README.md', 'prompt.md']) {
    if (!existsSync(join(demosDir, dir, doc))) {
      err(`demos/${dir}`, `missing ${doc}`);
    }
  }
  return card;
}

const KEY_FREE_MODES = ['replay', 'offline', 'live'];

function validateKeyFree(where, dir, card) {
  const present = ['offline', 'default_mode', 'live_mode_note'].filter((key) => card[key] != null);
  if (present.length === 0) {
    return;
  }
  if (present.length !== 3) {
    err(where, '`offline`, `default_mode`, and `live_mode_note` are set together');
  }
  const command = `node demos/${dir}/offline.mjs`;
  if (card.offline !== command) {
    err(where, `\`offline\` must be ${command}`);
  } else if (!existsSync(join(repoRoot, 'demos', dir, 'offline.mjs'))) {
    err(where, `missing ${command}`);
  }
  if (!KEY_FREE_MODES.includes(card.default_mode)) {
    err(where, '`default_mode` must be replay, offline, or live');
  } else if (card.default_mode === 'live') {
    err(where, '`default_mode` must be replay or offline so the demo runs without keys');
  }
  if (typeof card.live_mode_note !== 'string' || !card.live_mode_note.startsWith('Live mode available once keys are added:')) {
    err(where, '`live_mode_note` must start with "Live mode available once keys are added:"');
  }
}

function validateGate(where, card) {
  if (card.gate_blocks !== false) {
    err(where, '`gate_blocks` must be false: gates are an on-stage moment and never block a run');
  }
}

function validateVariables(where, dir, card) {
  const vars = card.variables ?? {};
  if (typeof vars !== 'object' || Array.isArray(vars)) {
    err(where, '`variables` must be a mapping of name to default');
    return;
  }
  if (!GENERIC_PROSPECTS.includes(vars.prospect)) {
    err(where, `\`variables.prospect\` must default to a generic account (${GENERIC_PROSPECTS.join(' or ')})`);
  }
  const promptFile = join(demosDir, dir, 'prompt.md');
  if (!existsSync(promptFile)) {
    return;
  }
  const used = new Set([...readFileSync(promptFile, 'utf8').matchAll(/\{([a-z_]+)\}/g)].map((m) => m[1]));
  for (const name of used) {
    if (!(name in vars)) {
      err(`demos/${dir}/prompt.md`, `{${name}} has no default in story.yaml \`variables\``);
    }
  }
  if (!used.has('prospect')) {
    err(`demos/${dir}/prompt.md`, 'prompt must use {prospect}');
  }
}

function validateJira(where, dir, card) {
  const jira = card.jira;
  if (!jira || typeof jira !== 'object') {
    err(where, '`jira` is required (project, labels, automation)');
    return;
  }
  if (jira.project !== JIRA_PROJECT) {
    err(where, `\`jira.project\` must be ${JIRA_PROJECT}`);
  }
  const labels = Array.isArray(jira.labels) ? jira.labels : [];
  const expected = [...BASE_LABELS, `story:${dir}`, `track:${card.track}`];
  if (card.stage !== 'generic') {
    expected.push(`stage:${card.stage}`);
  }
  for (const label of expected) {
    if (!labels.includes(label)) {
      err(where, `\`jira.labels\` is missing ${label}`);
    }
  }
  const automated = jira.automation === true;
  for (const label of AUTOMATION_LABELS) {
    if (automated && !labels.includes(label)) {
      err(where, `automation stories need the ${label} label`);
    }
    if (!automated && labels.includes(label)) {
      err(where, `${label} fires the ticket-to-PR automation; only use it with \`jira.automation: true\``);
    }
  }
  const allowed = new Set([...expected, ...AUTOMATION_LABELS, ...LEGACY_LABELS]);
  for (const label of labels) {
    if (!allowed.has(label)) {
      err(where, `label ${label} is not in demos/_shared/labels.md`);
    }
    if (LEGACY_LABELS.includes(label) && !automated) {
      err(where, `${label} is only for automation stories`);
    }
  }
}

function scanBranchPinning() {
  const walk = (abs) => {
    for (const name of readdirSync(abs)) {
      if (PIN_SCAN_SKIP.has(name)) {
        continue;
      }
      const path = join(abs, name);
      if (statSync(path).isDirectory()) {
        walk(path);
        continue;
      }
      const rel = relative(repoRoot, path);
      if (!PIN_SCAN_EXT.test(name) || rel === relative(repoRoot, fileURLToPath(import.meta.url))) {
        continue;
      }
      readFileSync(path, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/pin-ok/.test(line)) {
            return;
          }
          for (const re of BRANCH_PINNING) {
            if (re.test(line)) {
              err(`${rel}:${i + 1}`, `branch pinning (${re.source}); start from the default branch`);
            }
          }
        });
    }
  };
  for (const dir of PIN_SCAN_DIRS) {
    if (existsSync(join(repoRoot, dir))) {
      walk(join(repoRoot, dir));
    }
  }
}

function buildCatalog(cards) {
  const stories = cards.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    track: c.track,
    stage: c.stage,
    readiness: c.readiness,
    runtime: c.runtime,
    wow: c.wow,
    trigger: c.trigger,
    data_pack: c.data_pack,
    fallback: c.fallback,
    reset: c.reset ?? null,
    automation: c.jira?.automation === true,
    labels: c.jira?.labels ?? [],
    card: `demos/${c.id}/story.yaml`,
    prompt: `demos/${c.id}/prompt.md`,
    readme: `demos/${c.id}/README.md`,
    ...(c.offline
      ? { offline: c.offline, default_mode: c.default_mode, live_mode_note: c.live_mode_note }
      : {}),
  }));
  const header = [
    '# Generated by demos/_shared/scripts/catalog.mjs. Do not edit by hand.',
    '# Edit demos/<story>/story.yaml, then run: node demos/_shared/scripts/catalog.mjs',
    '',
  ].join('\n');
  return (
    header +
    YAML.stringify(
      {
        environment: ENVIRONMENT,
        jira_project: JIRA_PROJECT,
        default_prospect: 'Acme Cardio',
        answer_keys: 'answer-keys:// resolves to a separate private repo (placeholder; see demos/README.md)',
        stories,
      },
      { lineWidth: 0 }
    )
  );
}

const cards = storyDirs().map(validateStory).filter(Boolean);

const codes = new Map();
for (const card of cards) {
  if (codes.has(card.code)) {
    err(`demos/${card.id}/story.yaml`, `code ${card.code} is also used by ${codes.get(card.code)}`);
  }
  codes.set(card.code, card.id);
}
scanBranchPinning();

if (errors.length) {
  console.error(`FAIL: ${errors.length} problem(s) (0 passed, ${errors.length} failed)`);
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
}

const next = buildCatalog(cards);
const current = existsSync(catalogPath) ? readFileSync(catalogPath, 'utf8') : '';
for (const c of cards) {
  console.log(`ok  ${c.code.padEnd(4)} ${c.id.padEnd(22)} ${c.track.padEnd(8)} stage=${c.stage}`);
}
if (checkOnly) {
  if (current !== next) {
    console.error('FAIL: demos/catalog.yaml is stale. Run: node demos/_shared/scripts/catalog.mjs');
    process.exit(1);
  }
  console.log(
    `PASS: ${cards.length} stories valid (${cards.length} passed, 0 failed), catalog.yaml up to date, no branch pinning`
  );
} else {
  writeFileSync(catalogPath, next);
  console.log(
    `PASS: ${cards.length} stories valid (${cards.length} passed, 0 failed), no branch pinning. Wrote demos/catalog.yaml`
  );
}
