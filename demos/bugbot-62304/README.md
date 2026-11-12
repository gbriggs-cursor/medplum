# L4 IEC 62304 Bugbot rules

**Setup line:** "In {prospect}'s world, a change to a class C software item without a trace to a requirement and a risk is a finding at audit. Let's make that change on purpose."

**Wow line:** "Bugbot caught it, named the class C file, and the agent closed the gap with the right IDs from the hazard log. No human edited anything."

## Run it (default: REPLAY (no key))

Bugbot isn't enabled on this repository, so the default path needs no key and no Bugbot:

```
node demos/bugbot-62304/offline.mjs
```

1. **OFFLINE:** the regulatory seed check runs for real (`42 passed, 0 failed`).
2. **OFFLINE:** a local evaluator applies the IEC 62304 rules to four fixture rounds in `fixtures/replay/rounds.json`: class C with no trace ID, the trace added, a missing SOUP update, and an unknown ID.
3. **REPLAY (no key):** for each round, it prints the checked-in Bugbot-style review. The evaluator's findings must match the review, or the run fails.

The replayed reviews were authored from `.cursor/BUGBOT.md`, not captured from Bugbot, and every one is labeled `REPLAY (no key)`. Say so on stage.

`DEMO_MODE=live` exits 3 with a `BLOCKED` line, because live mode needs Bugbot enabled.

## Live mode (once Bugbot is enabled)

1. Start a cloud agent in environment `67842161` from the default branch and paste part 1 of `prompt.md`.
2. When the draft PR opens, wait for Bugbot (a few minutes). If Bugbot skips draft PRs on this repo, mark the PR ready for review on stage, then back to draft afterwards.
3. Show the `Class C:` flag. Paste part 2 into the same agent.
4. Show the follow-up commit and Bugbot's clean re-review.

## What to click

- `demos/_shared/regulatory/software-items.md`: why `Vitals.utils.ts` is class C.
- `.cursor/BUGBOT.md`, section "IEC 62304": the rule is plain English in the repo.
- The `Trace:` line in `evidence/EVIDENCE.md` after the fix.

## Rules this story exercises

| Rule | Level |
| --- | --- |
| Class C change with no `Trace:` line | high |
| Class B change with no `Trace:` line | medium |
| `Trace:` ID not in the regulatory seed | at class level |
| Dependency change without a `SOUP.md` update | high |

## Fallback

None yet. See `fallback_note` in `story.yaml`.

## Reset

Nothing is seeded. Leave the draft PR open as a recorded take.
