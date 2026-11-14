import { defineAgent } from '@grok/agent-sdk';

export default defineAgent({
  name: 'batch-evidence',
  description: 'Refresh synthetic evidence packages for a batch of Acme Cardio device changes.',
  model: {
    id: 'grok-4.7',
    params: [
      { id: 'reasoning_effort', value: 'high' },
      { id: 'fast', value: 'true' },
    ],
  },
});
