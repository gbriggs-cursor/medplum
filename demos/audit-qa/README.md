# L17 Audit-ready Q&A

**Setup line:** "An auditor asks, in plain language, for everything on one requirement. The design-history index is a fixture, because the release job that would build it is not in this folder."

**Wow line:** "Show me the evidence for {requirement_id}. The bot returns the requirement, the hazard, the test, the run, and the approval, and it says the row was not executed here."

## Preflight

Stop, and name the blocker, when the audit Q&A Grok Bot is missing. This folder does not create or edit a bot.

No Atlassian connector is required. The bot does not write tickets.

L7 has not produced an index. `seed/trace-index.yaml` is a hand-written stand-in. Do not describe it as a live design-history file.

The run does not wait on an approval card. The approval in the default row is part of the fixture.

## Run it

1. `demos/audit-qa/reset.sh` (safe to re-run). It only checks that the index is present.
2. Paste `prompt.md` into the audit Q&A bot. `{prospect}` defaults to Acme Cardio. `{requirement_id}` defaults to REQ-012.
3. While it runs, this is factory stage 07 Release, asked after the index exists.
4. Read the answer against the REQ-012 row in the index.

Optional second question, same bot, same index: ask for REQ-011. The risk, test, run, and approval on that row are null. The answer should say those links are not in the index.

## What to click

- The REQ-012 row: requirement, HAZ-012, test, run, result, approval, commit.
- The top of the file: `executed: false` on every row.
- REQ-099, a footer-text requirement with no links, so a wrong id is obvious.

## Answer key

`answer-keys://audit-qa/` resolves to a private repo that is not created yet. The index is the corpus the bot is allowed to read. A scored key is not in this repository.

## Fallback

No recorded pull request.

## Reset

`reset.sh` checks that `seed/trace-index.yaml` exists and deletes `demos/audit-qa/run/` if a bot wrote one. The story's answer stays in chat. The script does not call Jira.
