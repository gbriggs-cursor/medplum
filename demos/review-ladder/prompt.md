# Prompt: L18 Review ladder

Variables: `{prospect}` (default `Acme Cardio`).

The PRs come from `seed.sh`, not from an agent. Use this prompt after both reviewers have commented, to show an agent closing the findings on stage.

```
These two draft PRs are synthetic {prospect} demo seeds labeled demo-do-not-merge. Read every
Bugbot and Security Reviewer comment on them. For each finding, say whether it is real and which
line causes it. Do not push, merge, or change either PR. Use only synthetic data.
```

Expected: the agent lists the five Bugbot findings and four security findings tabled in `README.md`.
