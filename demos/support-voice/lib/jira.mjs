import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { phiScreen, redact } from '../../_shared/phi/redact.mjs';

const storyDir = join(dirname(fileURLToPath(import.meta.url)), '..');

export const GIO_LABELS = [
  'demo',
  'medplum',
  'story:support-voice',
  'track:ls',
  'stage:post-market',
  'support',
  'platform-demo',
];
const FORBIDDEN_LABELS = ['automatable', 'agent-safe', 'maintenance'];

const ROUTE = {
  answered: 'Answered on the call from the KB. No bot action needed.',
  kb_gap: 'Ticket Triage bot: write a KB article, then move to Escalated.',
  bug: 'Ticket Triage bot: move to Escalated. Fix Orchestrator: cloud agent opens a fix PR against the default branch.',
  urgent_clinical: 'Caller was told to call 911. Care team follow-up. No bot action.',
};

export class PhiTripwireError extends Error {
  constructor(hits) {
    super(`PHI tripwire: refusing to write to Jira, identifiers remain after redaction (${hits.join(', ')})`);
    this.code = 'phi_tripwire';
    this.hits = hits;
  }
}

/**
 * Builds the GIO issue. Identity (name, DOB, callback) never leaves this function: the issue text is redacted with
 * those values as known identifiers, and only the intake id links back to the caller (L10 keeps identity in Medplum).
 */
export function buildGioIssue(intake, triage, { intakeId } = {}) {
  const known = [intake.caller_name, intake.dob, intake.callback].filter(Boolean);
  const issue = redact(intake.issue, { known });
  const transcript = intake.transcript ? redact(intake.transcript, { known }) : undefined;
  const short = issue.text.replace(/\s+/g, ' ').slice(0, 80);
  const lines = [
    `Intake: ${intakeId ?? 'n/a'} (channel: ${intake.channel ?? 'form'})`,
    `Product: ${triage.product}`,
    `Triage: ${triage.category}. ${triage.reason}`,
    triage.article ? `Answered with: ${triage.article}` : undefined,
    triage.references?.length ? `Medplum docs references: ${triage.references.join(', ')}` : undefined,
    `Next: ${ROUTE[triage.category]}`,
    '',
    'Caller description (redacted):',
    issue.text,
    transcript ? '\nTranscript (redacted):\n' + transcript.text : undefined,
    '',
    `Redaction: ${issue.total + (transcript?.total ?? 0)} identifier(s) replaced. Synthetic demo data only.`,
  ].filter((l) => l !== undefined);

  const payload = {
    fields: {
      project: { key: 'GIO' },
      issuetype: { name: 'Task' },
      summary: `[Foo Medical support] ${triage.category}: ${short}`,
      description: lines.join('\n'),
      labels: [...GIO_LABELS],
      priority: { name: triage.priority },
    },
  };
  assertSafe(payload, known);
  return {
    payload,
    redaction: { counts: mergeCounts(issue.counts, transcript?.counts), total: issue.total + (transcript?.total ?? 0) },
  };
}

function mergeCounts(a = {}, b = {}) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    out[k] = (out[k] ?? 0) + v;
  }
  return out;
}

export function assertSafe(payload, known = []) {
  const bad = payload.fields.labels.filter((l) => FORBIDDEN_LABELS.includes(l));
  if (bad.length) {
    throw new Error(`Support intake tickets never carry automation labels: ${bad.join(', ')}`);
  }
  if (payload.fields.project.key !== 'GIO') {
    throw new Error('Support intake tickets go to GIO only');
  }
  const screen = phiScreen(`${payload.fields.summary}\n${payload.fields.description}`, { known });
  if (!screen.clean) {
    throw new PhiTripwireError(screen.hits);
  }
}

/**
 * Dry run (default) writes the payload to run/outbox/. Key-free mode writes the same payload with mode OFFLINE.
 * Live needs --live plus JIRA_BASE_URL, JIRA_EMAIL and JIRA_API_KEY, creates the issue, and never changes status
 * or adds comments.
 * @param {object} payload
 * @param {{ live?: boolean, offline?: boolean, env?: Record<string, string | undefined>, name?: string }} [options]
 */
export async function writeGioIssue(payload, { live = false, offline = false, env = process.env, name } = {}) {
  assertSafe(payload);
  if (!live) {
    const dir = join(storyDir, 'run', 'outbox');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${name ?? Date.now()}.json`);
    const body = offline ? { mode: 'OFFLINE', ...payload } : payload;
    writeFileSync(file, JSON.stringify(body, null, 2) + '\n');
    return { mode: offline ? 'OFFLINE' : 'dry-run', file: file.slice(storyDir.length + 1) };
  }
  const missing = ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_KEY'].filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`Live Jira write needs ${missing.join(', ')}`);
  }
  const body = {
    fields: {
      ...payload.fields,
      description: {
        type: 'doc',
        version: 1,
        content: payload.fields.description
          .split('\n')
          .map((t) => ({ type: 'paragraph', content: t ? [{ type: 'text', text: t }] : [] })),
      },
    },
  };
  const res = await fetch(`${env.JIRA_BASE_URL.replace(/\/$/, '')}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${env.JIRA_EMAIL}:${env.JIRA_API_KEY}`).toString('base64')}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Jira create failed: HTTP ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return { mode: 'live', key: json.key };
}
