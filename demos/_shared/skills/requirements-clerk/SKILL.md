---
name: requirements-clerk
description: >-
  Turn synthetic design-review notes into traced design inputs (REQ-xxx) and
  file each one as a new GIO ticket. Use for the requirements-clerk story.
  Does not assign a safety class, does not wait for approval, and does not
  edit existing tickets.
---

# requirements-clerk

File design inputs from the meeting notes. The notes are prose. You assign the ids and the "shall" sentences.

The product is fictional device software for this demo. It is not a marketed or cleared device. Every record stays synthetic.

## Inputs

1. `demos/requirements-clerk/seed/meeting-notes.md`
2. `demos/requirements-clerk/seed/id-register.yaml` — `allocated` ids are already used. Start at `next_id` and count upward. Do not reuse an allocated id.

## What becomes a design input

File a design input only when the notes ask the software to do something a tester could observe.

Do not file:

- Branding, color, or logo remarks.
- A request to pick a safety class. Leave `safety_class` empty. The risk teammate owns that.
- Anything already listed under `allocated`.

File the inputs in the order they appear in the notes.

## Output

Write `demos/requirements-clerk/run/requirements.yaml`. One list item per new input:

```yaml
- req_id: REQ-010
  title: short name
  design_input: The software shall ...
  source: meeting-notes.md, the paragraph you used
  acceptance: one check a tester could run on synthetic data
  safety_class: null
  synthetic: true
  htest: true
  jira_key: GIO-123
  labels: [demo, medplum, story:requirements-clerk, track:ls, stage:01]
```

`design_input` is one sentence and uses "shall". `acceptance` names the observable result, the input data (synthetic), and the pass condition. `jira_key` is the key the connector returned. Leave it null when the connector did not create a ticket.

Create one new GIO issue per row. Title: `{req_id} {title}`. Body: the design input, the acceptance line, `Synthetic: true`, and `HTEST`. Labels are exactly the list above. Do not add `automatable`, `agent-safe`, or `maintenance`.

Do not transition the new issue. Do not comment on any other issue. Do not open a pull request. Do not wait for approval.

## When Jira cannot be written

Write the local file anyway, with `jira_key: null` on every row. Stop and report: `Atlassian connector cannot create GIO issues`. Do not invent a key.

## Shape sample

REQ-001 is already allocated. This shows the shape only. Do not write a row for it.

```yaml
- req_id: REQ-001
  title: Ingest patch readings
  design_input: The software shall store and display the patch blood-pressure panel and ECG summary.
  source: id-register.yaml, allocated
  acceptance: A synthetic bundle of 20 subjects loads, and each subject has one panel and one summary.
  safety_class: null
  synthetic: true
  htest: true
  jira_key: null
  labels: [demo, medplum, story:requirements-clerk, track:ls, stage:01]
```
