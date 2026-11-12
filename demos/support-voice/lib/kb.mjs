import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const storyDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(storyDir, '..', '..');

const STOP = new Set(
  `a an and are as at be but by can do does for from get got have how i if in into is it its me my no not of on or our so
  that the their them then there this to up was we what when where which who why will with won't you your keeps keep just
  still now again cant can't dont don't im i'm ive i've please help hi hello thanks`.split(/\s+/)
);
// The prospect's own name appears in every article, so it says nothing about the topic.
const BRAND = new Set(['foo', 'medical']);

export function tokenize(text) {
  return String(text)
    .replace(/\[[A-Z_]+\]/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !STOP.has(t) && !BRAND.has(t))
    .map(stem);
}

function stem(t) {
  return t.replace(/(ing|ed|es|s)$/, '') || t;
}

function parseFrontMatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta = {};
  if (m) {
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (kv) {
        meta[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }
  return { meta, body: m ? raw.slice(m[0].length) : raw };
}

let cached;

export function loadKb() {
  if (cached) {
    return cached;
  }
  const articles = [];
  const fmDir = join(storyDir, 'kb', 'foomedical');
  for (const name of readdirSync(fmDir)
    .filter((n) => n.endsWith('.md'))
    .sort()) {
    const { meta, body } = parseFrontMatter(readFileSync(join(fmDir, name), 'utf8'));
    articles.push({
      id: meta.id,
      title: meta.title,
      product: meta.product,
      audience: 'patient',
      source: `demos/support-voice/kb/foomedical/${name}`,
      body,
    });
  }
  const manifest = JSON.parse(readFileSync(join(storyDir, 'kb', 'medplum-docs.json'), 'utf8'));
  for (const doc of manifest.docs) {
    const rel = join(manifest.root, doc.path);
    const { meta, body } = parseFrontMatter(readFileSync(join(repoRoot, rel), 'utf8'));
    const title = meta.title || meta.sidebar_label || (body.match(/^#\s+(.+)$/m) ?? [])[1] || doc.id;
    articles.push({ id: doc.id, title, product: doc.product, audience: 'engineering', source: rel, body });
  }
  const docs = articles.map((a) => {
    // Titles carry most of the signal in short help articles, so they count three times.
    const terms = [...tokenize(a.title), ...tokenize(a.title), ...tokenize(a.title), ...tokenize(a.body)];
    const tf = new Map();
    for (const t of terms) {
      tf.set(t, (tf.get(t) ?? 0) + 1);
    }
    return { ...a, tf, length: terms.length };
  });
  const df = new Map();
  for (const d of docs) {
    for (const t of d.tf.keys()) {
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }
  const avgLen = docs.reduce((s, d) => s + d.length, 0) / docs.length;
  cached = { docs, df, avgLen };
  return cached;
}

/**
 * BM25 search over the KB. `coverage` is the share of query terms the article contains.
 * @param {string} query
 * @param {{ audience?: 'patient' | 'engineering', limit?: number }} [options]
 */
export function searchKb(query, options = {}) {
  const { docs, df, avgLen } = loadKb();
  const q = [...new Set(tokenize(query))];
  const n = docs.length;
  const k1 = 1.2;
  const b = 0.75;
  const results = docs
    .filter((d) => !options.audience || d.audience === options.audience)
    .map((d) => {
      let score = 0;
      let hit = 0;
      for (const t of q) {
        const f = d.tf.get(t) ?? 0;
        if (!f) {
          continue;
        }
        hit++;
        const idf = Math.log(1 + (n - df.get(t) + 0.5) / (df.get(t) + 0.5));
        score += (idf * f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.length) / avgLen));
      }
      return {
        id: d.id,
        title: d.title,
        product: d.product,
        audience: d.audience,
        source: d.source,
        score: +score.toFixed(3),
        coverage: q.length ? +(hit / q.length).toFixed(3) : 0,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  return results.slice(0, options.limit ?? 5);
}

export function getArticle(id) {
  const doc = loadKb().docs.find((d) => d.id === id);
  return (
    doc && {
      id: doc.id,
      title: doc.title,
      product: doc.product,
      audience: doc.audience,
      source: doc.source,
      body: doc.body,
    }
  );
}
