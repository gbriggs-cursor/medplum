import { defineAgent } from '@grok/agent-sdk';

// run.sh points this at a scratch copy of packages/core that holds the failing tree but
// not demos/ (so the planted patch and trace spec are out of the workspace). The sandbox
// refuses writes outside it; run.sh copies back only non-test source files.
const workspaceDir = process.env.VERIFY_LOOP_WORKSPACE;

export default defineAgent({
  name: 'verify-loop-remediator',
  description: 'Fixes source so failing packages/core tests pass, without touching tests.',
  local: { sandbox: true, ...(workspaceDir ? { workspaceDir } : {}) },
  tools: ['read', 'grep', 'glob', 'ls', 'edit', 'shell'],
});
