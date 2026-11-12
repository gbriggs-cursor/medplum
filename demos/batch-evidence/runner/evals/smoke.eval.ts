import { defineEval, includes } from '@grok/agent-sdk/evals';

export default defineEval({
  tags: ['smoke'],
  cases: [
    {
      id: 'refresh',
      description: 'The runner refreshes the synthetic batch and reports the tool counts.',
      async test(t) {
        await t.send('Refresh the synthetic device-change evidence batch.');
        t.succeeded();
        t.calledTool('refresh-evidence');
        t.check(t.reply, includes(/passed/));
      },
    },
  ],
});
