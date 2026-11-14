import { defineEval, includes } from '@grok/agent-sdk/evals';

export default defineEval({
  tags: ['smoke'],
  cases: [
    {
      id: 'assemble',
      description: 'The runner builds the synthetic DHF index and reports the tool counts.',
      async test(t) {
        await t.send('Build the design history index for the synthetic release records.');
        t.succeeded();
        t.calledTool('assemble-dhf');
        t.check(t.reply, includes(/passed/));
      },
    },
  ],
});
