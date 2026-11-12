# L15 Medplum MCP plus Bot and Subscription

**Setup line:** "An agent looks at {prospect}'s synthetic patch data, and a Subscription turns a pairing Observation into a Task on the Foo Medical chart."

**Wow line:** "The bot creates the Task from a synthetic Observation. The MCP probe reports whatever the local server actually returned."

## Run it

1. `demos/mcp-bot/reset.sh` (nothing is seeded on disk; safe to re-run).
2. From the repository root: `npx vitest run --config demos/mcp-bot/vitest.config.mjs`
3. `node demos/mcp-bot/scripts/probe-mcp.mjs` against the local server (`MEDPLUM_BASE_URL`, default `http://127.0.0.1:8103`).
4. `subscription.json` is the Subscription to create. Replace `Bot/pairing-task` with the Bot id after the Bot exists. The handler is `bot/pairing-task.ts`. The sample input is `seed/pairing-observation.json`.

A model turn that explores over MCP needs `CURSOR_API_KEY`. That secret is not set. `XAI_API_KEY` is not used.

## What to click

- The vitest result: a synthetic pairing Observation creates a Task, and an untagged Observation is refused.
- The probe transcript: healthcheck, then `/mcp/stream`.
- `subscription.json`: criteria `Observation?code=https://acme-cardio.example/synthetic/observation|device-pairing`.

## MCP

The local server in this environment was probed. See the pull request body for the exact status and error. `packages/server/medplum.config.json` has no `mcpEnabled` key. The server default is false, and the route is mounted only when that flag is true. This story does not change that config and does not restart the shared server.

## Fallback

None. Pull request 11 is the device cohort, not this bot.

## Reset

`reset.sh` prints that there is nothing to delete. It does not call the server.
