# G1 Net-new feature

**Setup line:** "Here's a product idea from {prospect}'s backlog. No spec, no ticket grooming. Watch the agent plan it against a real FHIR codebase."

**Wow line:** "That component didn't exist ten minutes ago. It's built on the same `@medplum/react` primitives the product uses, with tests."

## Run it

1. Start a cloud agent in environment `67842161` from the repository's default branch.
2. Paste `prompt.md`. Replace `{prospect}` and `{feature_idea}` or leave the defaults.
3. Show the plan on screen before it executes (the on-stage gate; it never waits).
4. When the draft PR opens, show the Devices tab screenshot and the Vitest output.

## What to click

- The plan in the agent panel: it should name `Device`, `Observation.device`, and FHIR search with no new backend.
- The draft PR's Files tab: new component under `packages/react/src/`, tab under `packages/app/src/resource/`.
- Bugbot's review on the PR.

## Fallback

Show [PR #10](https://github.com/gbriggs-cursor/medplum/pull/10) (Devices tab with 30-day BP trends) or [PR #14](https://github.com/gbriggs-cursor/medplum/pull/14) (device readiness summary).

## Reset

Nothing is seeded. Leave the draft PR open as a recorded take.
