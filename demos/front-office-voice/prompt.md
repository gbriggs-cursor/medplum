# Prompt: G9 Voice front-office support

Variables: `{prospect}` (default `Foo Medical`), `{call}` (default `reschedule`; one of `reschedule`, `kb_gap`, `bug` from `seed/calls.md`).

This story is started by a phone call, not by pasting a prompt. Demo Setup uses the text below to configure
the support-voice line (L9) before the call.

```
Configure the support-voice line from demos/support-voice/ for {prospect}'s front-office support: load the
profile in demos/front-office-voice/seed/front-office-profile.md, keep the two-phase confirm, and redact
caller and patient identifiers before any Jira write (L11). File intake tickets on GIO with exactly the
labels in demos/front-office-voice/story.yaml. Never add automatable. The presenter will play the {call}
caller from demos/front-office-voice/seed/calls.md. Bots act without waiting for approval. KB article and
fix PRs are drafts against the default branch.
```
