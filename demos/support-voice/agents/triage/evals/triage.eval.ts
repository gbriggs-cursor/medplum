import { defineEval, satisfies } from '@grok/agent-sdk/evals';
import { readFileSync } from 'node:fs';
import { redact } from '../../../../_shared/phi/redact.mjs';

type Case = {
  id: string;
  caller_name: string;
  dob: string;
  callback?: string;
  issue: string;
  expect: { category: string; article?: string; must_not_contain?: string[] };
};

const { cases } = JSON.parse(readFileSync(new URL('../../../evals/cases.json', import.meta.url), 'utf8')) as {
  cases: Case[];
};

export default defineEval({
  tags: ['support-voice'],
  cases: cases.map((c) => ({
    id: c.id,
    description: `Synthetic intake ${c.id} is triaged as ${c.expect.category}.`,
    async test(t) {
      const known = [c.caller_name, c.dob, c.callback].filter((v): v is string => Boolean(v));
      const issue = (redact(c.issue, { known }) as { text: string }).text;
      await t.send(`Intake INTAKE-eval-${c.id} (channel: voice).\nCaller description (redacted):\n${issue}`);
      t.succeeded();
      t.calledTool('search_kb');
      t.calledTool('record_triage', {
        count: 1,
        input: c.expect.article
          ? { category: c.expect.category, article: c.expect.article }
          : { category: c.expect.category },
        output: { recorded: true },
      });
      const leaked = [c.caller_name, c.dob, c.callback, ...(c.expect.must_not_contain ?? [])].filter(
        Boolean
      ) as string[];
      t.check(
        t.reply,
        satisfies((reply) => !leaked.some((s) => String(reply).includes(s)), 'reply carries no caller identifier')
      );
    },
  })),
});
