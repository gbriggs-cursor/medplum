# G11 Integration docs for a partner

**Setup line:** "Every new integration partner asks {prospect} the same four questions, and the answers live in an engineer's head."

**Wow line:** "One guide answers all four, and every claim links to the line of server code that proves it."

## Run it

1. `demos/integration-docs/reset.sh` checks that every source anchor in `anchors.txt` still holds, then prints the partner questions. It fails if the code moved.
2. Start a cloud agent in environment `67842161` from the default branch and paste `prompt.md`.
3. Show the claim-to-source table in the PR body, then the guide.
4. Gate: open the webhook-signature claim and its line in `packages/server/src/workers/subscription.ts`.

## What to click

- The new page under `packages/docs/docs/integration/`.
- `packages/docs/sidebars.ts` and `integration/index.md` in the PR.
- The drafted partner reply in the PR body. It is never sent.

## Fallback

No recorded run yet. The docs story G4 (`docs-from-questions`, PRs #3, #8, #13) shows the same pattern.

## Reset

Nothing is seeded. `reset.sh` only checks anchors and prints the questions.
