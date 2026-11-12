import { defineTool } from '@grok/agent-sdk/tools';
import { z } from 'zod';
import { buildGioIssue, writeGioIssue } from '../../../../lib/jira.mjs';
import { searchKb } from '../../../../lib/kb.mjs';

const PRIORITY = { answered: 'Low', kb_gap: 'Medium', bug: 'High', urgent_clinical: 'Highest' } as const;

export default defineTool({
  description:
    'Record the triage decision and build the GIO ticket. Call exactly once. The PHI tripwire refuses the ticket if any identifier remains.',
  inputSchema: z.object({
    intake_id: z.string().describe('The intake id from the message, for example INTAKE-1a2b3c4d.'),
    category: z.enum(['answered', 'kb_gap', 'bug', 'urgent_clinical']),
    product: z.enum(['portal', 'patch', 'messages', 'appointments']),
    article: z.string().optional().describe('KB article id, only when category is answered.'),
    reason: z.string().max(240).describe('One sentence on why.'),
    redacted_issue: z.string().describe('The redacted issue text, unchanged.'),
  }),
  async execute(input, ctx) {
    const references = (
      searchKb(input.redacted_issue, { audience: 'engineering', limit: 10 }) as { id: string; product: string }[]
    )
      .filter((r) => r.product === input.product)
      .slice(0, 3)
      .map((r) => r.id);
    const decision = {
      category: input.category,
      product: input.product,
      article: input.category === 'answered' ? input.article : undefined,
      references: input.category === 'answered' || input.category === 'urgent_clinical' ? [] : references,
      reason: input.reason,
      priority: PRIORITY[input.category],
    };
    let built: { payload: { fields: { summary: string; labels: string[] } } };
    try {
      built = buildGioIssue({ issue: input.redacted_issue, channel: 'voice' }, decision, { intakeId: input.intake_id });
    } catch (e) {
      return { recorded: false, error: (e as Error).message };
    }
    if (ctx.session.purpose === 'eval') {
      return {
        recorded: true,
        mode: 'eval',
        summary: built.payload.fields.summary,
        labels: built.payload.fields.labels,
      };
    }
    const written = (await writeGioIssue(built.payload, { name: input.intake_id })) as { mode: string; file?: string };
    return {
      recorded: true,
      mode: written.mode,
      file: written.file,
      summary: built.payload.fields.summary,
      labels: built.payload.fields.labels,
    };
  },
});
