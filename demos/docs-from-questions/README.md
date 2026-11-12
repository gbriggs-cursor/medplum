# G4 Docs from repeat questions

**Setup line:** "{prospect}'s support queue keeps getting the same three questions. Each one costs an engineer an hour."

**Wow line:** "One PR answers all three. The agent checked ports and script names against the code, and drafted the replies."

## Run it

1. `demos/docs-from-questions/reset.sh` prints the seeded questions (safe to re-run).
2. Start a cloud agent in environment `67842161` from the default branch and paste `prompt.md`.
3. Show the clustered questions in the PR body, the new how-to, and the sidebar diff.
4. Read one drafted reply aloud. Replies are never posted.

## What to click

- `packages/docs/sidebars.ts` in the PR.
- The new page under `packages/docs/docs/`.
- The "verified against" notes in the PR body (ports, `package.json` scripts).

## Fallback

[PR #3](https://github.com/gbriggs-cursor/medplum/pull/3), [PR #8](https://github.com/gbriggs-cursor/medplum/pull/8) (local sample patients), [PR #13](https://github.com/gbriggs-cursor/medplum/pull/13) (terminology not preloaded).

## Reset

The questions are static files. `reset.sh` only prints them.
