---
name: complaint-capa
description: >-
  File a synthetic complaint record, a reportability call, and a CAPA
  recommendation from a fixture complaint and a fictional SOP. Use for the
  complaint-to-CAPA story. Does not submit anything outside the demo, does
  not wait for approval, and does not edit existing tickets.
---

# complaint-capa

File one complaint. Apply the SOP in the seed. Mark the result ready for review. A reviewer may override the call later. Do not wait.

This is fictional device software for a demo, not a marketed or cleared device. The SOP is a procedure written for this demo. It is not a government reporting rule, and following it does not submit a report.

## Inputs

1. `demos/complaint-capa/seed/complaint.md` — the event. It is a fixture standing in for an L9 ticket. It is not a live ticket. Do not invent a real issue key for it.
2. `demos/complaint-capa/seed/sop.md` — the only rules you apply. Cite the section id you used.
3. `demos/complaint-capa/seed/id-register.yaml` — `next_complaint_id` and `next_capa_id`.

Use subject ids from the complaint. Do not add a name, date of birth, address, or phone number.

## Output

Write `demos/complaint-capa/run/complaint.yaml`:

```yaml
complaint_id: CMP-001
capa_id: CAPA-001
source_fixture: demos/complaint-capa/seed/complaint.md
live_ticket: false
synthetic_subject: SP-014
device: "{prospect} patch v2"
event: one paragraph from the complaint, no new facts
injury_alleged: false
sop_section: CMP-SOP-3
reportability: no
reportability_rationale: which SOP section applies, and why
capa: open
capa_rationale: which SOP section applies, and why
status: ready-for-review
override: A reviewer may change reportability or capa later. This run does not wait.
submitted_externally: false
synthetic: true
htest: true
jira_keys: []
```

`capa_id` is set only when `capa` is `open`. When the SOP says not to open a CAPA, set `capa: do-not-open` and `capa_id: null`.

`reportability` is `yes` or `no`, from the SOP. Do not add a third choice.

Create one new GIO issue for the complaint. Title: `{complaint_id} {synthetic_subject}`. When `capa` is `open`, create a second issue. Title: `{capa_id} {complaint_id}`. Put the matching fields in each body, including `submitted_externally: false`. Labels exactly:

`demo`, `medplum`, `story:complaint-capa`, `track:ls`, `stage:post-market`

Do not add `automatable`, `agent-safe`, or `maintenance`. Do not transition either issue. Do not comment on other issues. Do not open a pull request. Do not write a Medplum resource. Do not email, post to Slack, or send the assessment to anyone.

Store the returned keys in `jira_keys`. Leave the list empty when the connector created none.

## When Jira cannot be written

Write the local file with `jira_keys: []`. Stop and report: `Atlassian connector cannot create GIO issues`. Do not invent a key.

## Shape sample

A pairing-only complaint, with no disputed measurement and no injury, is CMP-SOP-4 in the seed SOP. Shape only. The demo complaint is a different file. Do not copy this decision onto it without reading that file.

```yaml
complaint_id: CMP-000
capa_id: null
sop_section: CMP-SOP-4
reportability: no
capa: do-not-open
status: ready-for-review
submitted_externally: false
jira_keys: []
```
