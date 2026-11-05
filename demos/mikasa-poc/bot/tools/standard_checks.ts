import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";

export default defineTool({
  description: "Return the default verification commands every plan should include.",
  inputSchema: z.object({ area: z.string().optional() }),
  effect: "read",
  async execute({ area }) {
    return {
      area: area ?? "default",
      checks: ["npm run lint", "npm run test -- --changed", "npx tsc --noEmit"],
    };
  },
});
