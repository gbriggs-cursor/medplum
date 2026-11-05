import { defineEval } from "@grok/agent-sdk/evals";

export default defineEval({
  tags: ["smoke"],
  description: "Mikasa returns a plan and tags it as an artifact.",
  async test(t) {
    await t.send("Add a Devices tab to the patient page");
    t.succeeded();
    t.calledTool("tag_artifact");
  },
});
