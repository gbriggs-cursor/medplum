// Front-office routing. Bug and clinical signals come from the L9 triage rules unchanged.
// "Answered" means a front-desk staff article covers the question, so this line searches
// kb/staff/ instead of L9's patient articles, with L9's score and coverage thresholds.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenize } from '../../support-voice/lib/kb.mjs';
import { ANSWER_MIN_COVERAGE, ANSWER_MIN_SCORE, triage } from '../../support-voice/lib/triage.mjs';

const kbDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'kb', 'staff');

function loadStaffKb() {
  const docs = readdirSync(kbDir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => {
      const raw = readFileSync(join(kbDir, name), 'utf8');
      const meta = Object.fromEntries(
        [...raw.matchAll(/^(\w+):\s*(.*)$/gm)].slice(0, 4).map((m) => [m[1], m[2].trim()])
      );
      const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
      const terms = [...tokenize(meta.title), ...tokenize(meta.title), ...tokenize(meta.title), ...tokenize(body)];
      const tf = new Map();
      for (const t of terms) {
        tf.set(t, (tf.get(t) ?? 0) + 1);
      }
      return {
        id: meta.id,
        title: meta.title,
        source: `demos/front-office-voice/kb/staff/${name}`,
        tf,
        length: terms.length,
      };
    });
  const df = new Map();
  for (const d of docs) {
    for (const t of d.tf.keys()) {
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }
  return { docs, df, avgLen: docs.reduce((s, d) => s + d.length, 0) / docs.length };
}

export function searchStaffKb(query) {
  const { docs, df, avgLen } = loadStaffKb();
  const q = [...new Set(tokenize(query))];
  const k1 = 1.2;
  const b = 0.75;
  return docs
    .map((d) => {
      let score = 0;
      let hit = 0;
      for (const t of q) {
        const f = d.tf.get(t) ?? 0;
        if (!f) {
          continue;
        }
        hit++;
        const idf = Math.log(1 + (docs.length - df.get(t) + 0.5) / (df.get(t) + 0.5));
        score += (idf * f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.length) / avgLen));
      }
      return {
        id: d.id,
        source: d.source,
        score: +score.toFixed(3),
        coverage: q.length ? +(hit / q.length).toFixed(3) : 0,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, c) => c.score - a.score);
}

export function routeFrontOffice(intake) {
  const base = triage(intake);
  if (base.category === 'bug' || base.category === 'urgent_clinical') {
    return { ...base, kb: 'L9 triage rules' };
  }
  const [top] = searchStaffKb(intake.issue);
  if (top && top.score >= ANSWER_MIN_SCORE && top.coverage >= ANSWER_MIN_COVERAGE) {
    return {
      ...base,
      category: 'answered',
      article: top.id,
      reason: `${top.id} covers it (score ${top.score}, coverage ${top.coverage}).`,
      priority: 'Low',
      kb: 'front-office staff KB',
    };
  }
  return {
    ...base,
    category: 'kb_gap',
    article: undefined,
    reason: top
      ? `Closest staff article ${top.id} is too weak (score ${top.score}, coverage ${top.coverage}).`
      : 'No staff article matches.',
    priority: 'Medium',
    kb: 'front-office staff KB',
  };
}
