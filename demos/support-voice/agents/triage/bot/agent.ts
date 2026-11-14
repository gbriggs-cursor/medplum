import { defineAgent } from '@grok/agent-sdk';

export default defineAgent({
  description: 'Foo Medical patient support triage over a redacted intake.',
  tools: [],
  local: {
    sandbox: true,
  },
});
