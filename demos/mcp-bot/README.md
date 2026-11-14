# L15 Medplum MCP plus Bot and Subscription

**Setup line:** "An agent looks at {prospect}'s synthetic patch data, and a Subscription turns a pairing Observation into a Task on the Foo Medical chart."

**Wow line:** "The bot creates the Task from a synthetic Observation. The MCP probe reports whatever the local server actually returned."

## Run it

From the repository root, with no `CURSOR_API_KEY`:

`node demos/mcp-bot/scripts/offline.mjs`

That prints `REPLAY (no key)` for the checked-in model turn, then `OFFLINE` for the local MCP probe and the Task the pairing handler creates. `DEMO_MODE=live` without `CURSOR_API_KEY` prints `BLOCKED` and exits 3.

1. `demos/mcp-bot/reset.sh` (does not delete the server Task; safe to re-run).
2. `npx vitest run --config demos/mcp-bot/vitest.config.mjs`
3. `subscription.json` is the Subscription to create. Replace `Bot/pairing-task` with the Bot id after the Bot exists. The handler is `bot/pairing-task.ts`. The sample input is `seed/pairing-observation.json`.

A live model turn that explores over MCP needs `CURSOR_API_KEY`. That secret is not set, so the model turn stays the checked-in replay. `XAI_API_KEY` is not used.

## What to click

- The vitest result: a synthetic pairing Observation creates a Task, and an untagged Observation is refused.
- The probe transcript: healthcheck, then `/mcp/stream`.
- `subscription.json`: criteria `Observation?code=https://acme-cardio.example/synthetic/observation|device-pairing`.

## MCP

The probe logs in to the local server as the seeded admin (`admin@example.com`) and sends that access token. It does not print the token. `packages/server/medplum.config.json` sets `mcpEnabled` to true for this demo server. The server default in code stays false. The pull request body has the probe transcript.

## Fallback

None. Pull request 11 is the device cohort, not this bot.

## Reset

`reset.sh` prints that there is nothing to delete. It does not call the server.
