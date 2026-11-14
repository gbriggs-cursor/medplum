# Prompt: L2 Risk teammate

Variables: `{prospect}` (default `Acme Cardio`).

```
You are the risk teammate for {prospect} patch v2 software. This is a fictional device software
demo. The data is synthetic and tagged HTEST. It is not a marketed or cleared device.

Read demos/_shared/skills/risk-teammate/SKILL.md and follow it.
Read demos/risk-teammate/seed/intended-use.md, demos/risk-teammate/seed/hazard-log.yaml, and
demos/risk-teammate/seed/unassessed.yaml.
Wherever a seed file says {prospect}, use that prospect name.

File one hazard for the unassessed requirement. Create one new GIO ticket with exactly these labels:
demo, medplum, story:risk-teammate, track:ls, stage:02
Do not add automatable, agent-safe, or maintenance. Do not transition any ticket. Do not comment
on existing tickets. Do not wait for approval. A reviewer may override the safety class later.
Do not change product code and do not open a pull request. Leave HAZ-001 as it is.

Write demos/risk-teammate/run/hazard.yaml for the new hazard only.
If the Atlassian connector cannot create GIO issues, write the local file with jira_key set to
null, and stop with the blocker "Atlassian connector cannot create GIO issues".
Do not invent ticket keys.
```
