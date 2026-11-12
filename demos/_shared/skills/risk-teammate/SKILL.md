---
name: risk-teammate
description: >-
  File one ISO 14971-style hazard and a software safety class for an
  unassessed design input. Use for the risk-teammate story. Uses this
  demo's fictional severity rule. Does not wait for approval, does not edit
  hazards that are already filed, and does not change product code.
---

# risk-teammate

File one hazard for the single unassessed requirement. A reviewer may override the class later. Do not wait for that review.

This is fictional device software for a demo, not a marketed or cleared device. The scale below is this demo's rule so two runs can be compared. It is not a copy of ISO 14971 and it is not a claim that a real device was classified.

## Inputs

1. `demos/risk-teammate/seed/intended-use.md` — what the software is for, in the fiction.
2. `demos/risk-teammate/seed/hazard-log.yaml` — hazards already filed. Do not edit them. The next id is `next_id`.
3. `demos/risk-teammate/seed/unassessed.yaml` — the requirement to assess. It has no class on purpose.

## Scale

Severity, pick one:

- `1` — no injury is a plausible outcome. Record-keeping or inconvenience only.
- `2` — injury is possible, and serious injury is not the expected outcome.
- `3` — death or serious injury is a plausible outcome.

Probability, pick one and record it. It does not change the class in this demo: `1` remote, `2` occasional, `3` frequent.

Safety class, from severity only:

- severity `3` → class `C`
- severity `2` → class `B`
- severity `1` → class `A`

Say which severity you picked and why, in one or two sentences tied to the intended use. Do not copy HAZ-001's class onto the new requirement unless you judge the severity to be the same.

## Output

Write `demos/risk-teammate/run/hazard.yaml` for the new hazard only:

```yaml
id: HAZ-002
req_id: REQ-011
hazard: what can go wrong
situation: who is exposed and what they are doing
harm: the harm in this fiction
sequence: how the software gets from the requirement to the harm
severity: 1
probability: 1
safety_class: A
risk_control: one proposed control, not implemented
status: ready-for-review
override: A reviewer may change safety_class later. This run does not wait.
synthetic: true
htest: true
jira_key: GIO-123
```

Create one GIO issue. Title: `{id} {req_id}`. Body: the fields above, including the class and `status: ready-for-review`. Labels exactly:

`demo`, `medplum`, `story:risk-teammate`, `track:ls`, `stage:02`

Do not add `automatable`, `agent-safe`, or `maintenance`. Do not transition the issue. Do not comment on other issues. Do not change product code. Do not open a pull request.

## When Jira cannot be written

Write the local file with `jira_key: null`. Stop and report: `Atlassian connector cannot create GIO issues`. Do not invent a key.

## Shape sample

HAZ-001 is already in the log. The shape is that row. Do not write it again.
