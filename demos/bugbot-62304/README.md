# L4 IEC 62304 Bugbot rules

**Setup line:** "In {prospect}'s world, a change to a class C software item without a trace to a requirement and a risk is a finding at audit. Let's make that change on purpose."

**Wow line:** "Bugbot caught it, named the class C file, and the agent closed the gap with the right IDs from the hazard log. No human edited anything."

## Run it

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
