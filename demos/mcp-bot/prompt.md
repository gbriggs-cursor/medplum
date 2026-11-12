# Prompt: L15 Medplum MCP plus Bot and Subscription

Variables: `{prospect}` (default `Acme Cardio`).

```
Requirement REQ-015: For synthetic {prospect} device pairing, a Bot creates a Task, and a
Subscription listens for that Observation. Explore the local server over Medplum MCP if it connects.

Work in demos/mcp-bot/.
1. Run node demos/mcp-bot/scripts/probe-mcp.mjs. If it does not print MCP_CONNECT: ok, stop the
   MCP portion and quote the status and error. Do not invent a connection or a tool list.
2. Keep bot/pairing-task.ts. It accepts only an Observation tagged synthetic and HTEST with code
   device-pairing, and it creates a Task. Run npx vitest run --config demos/mcp-bot/vitest.config.mjs.
3. subscription.json is the Subscription. Set channel.endpoint to the created Bot id. Do not
   wait for an approval.
Open a draft PR against the default branch. Synthetic data only. No Jira writes.
A model turn needs CURSOR_API_KEY. If that secret is missing, say so and do not pretend the
agent explored FHIR over MCP.
```
