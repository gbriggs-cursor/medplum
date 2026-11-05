import { z } from "zod";
import { defineArtifacts } from "@grok/agent-sdk/artifacts";

export default defineArtifacts({
  kinds: {
    plan: {
      description: "A structured implementation plan Mikasa produced for one task.",
      schema: z.object({ task: z.string(), plan: z.string() }),
    },
  },
  agentTool: true,
});
