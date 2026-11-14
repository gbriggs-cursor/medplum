import { defineTool } from '@grok/agent-sdk/tools';
import { z } from 'zod';
import { searchKb } from '../../../../lib/kb.mjs';

export default defineTool({
  description:
    'Search the Foo Medical help articles (audience patient) and the curated Medplum docs subset (audience engineering). Returns the best matches with score and coverage.',
  inputSchema: z.object({
    query: z.string().min(2).describe('The caller problem in a few plain words.'),
    audience: z.enum(['patient', 'engineering']).optional().describe('Restrict to one audience. Omit for both.'),
  }),
  async execute({ query, audience }) {
    const results = searchKb(query, { audience, limit: 5 }) as {
      id: string;
      title: string;
      product: string;
      audience: string;
      source: string;
      score: number;
      coverage: number;
    }[];
    return { results };
  },
});
