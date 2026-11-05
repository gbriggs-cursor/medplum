import { defineChannel, POST } from "@grok/agent-sdk/channels";
import { z } from "zod";

type PlanState = { requestId: string; task: string };

export default defineChannel<PlanState>({
  state: { requestId: "", task: "" },
  routes: [
    POST("/request", {
      description: "Request an implementation plan for a task",
      bodySchema: z.object({
        requestId: z.string(),
        task: z.string(),
      }),
      handler: async (_request, { send, waitUntil, body }) => {
        waitUntil(
          send(`Plan this task: ${body.task}`, {
            continuationToken: `plan:${body.requestId}`,
            state: { requestId: body.requestId, task: body.task },
            title: `Plan ${body.requestId}`,
          })
        );
        return new Response(null, { status: 202 });
      },
    }),
  ],
  events: {
    async "message.completed"(event, channel, ctx) {
      if (event.data.finishReason === "tool_call" || event.data.text === "") return;
      // Host-side copy so the caller can fetch the reply by requestId even if
      // the model skipped tag_artifact.
      await ctx.artifacts.tag({
        kind: "plan",
        key: `request:${channel.state.requestId}`,
        title: `Reply for request ${channel.state.requestId}`,
        // requestId lives in the key; data.task holds the original task text.
        data: { task: channel.state.task, plan: event.data.text },
      });
    },
  },
});
