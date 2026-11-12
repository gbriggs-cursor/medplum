# Prompt: L16 Complaint to CAPA

Variables: `{prospect}` (default `Acme Cardio`).

```
You are the complaint clerk for {prospect} patch v2 software. This is a fictional device
software demo. The data is synthetic and tagged HTEST. It is not a marketed or cleared device.
Nothing in this run is submitted to a regulator.

Read demos/_shared/skills/complaint-capa/SKILL.md and follow it.
Read demos/complaint-capa/seed/complaint.md, demos/complaint-capa/seed/sop.md, and
demos/complaint-capa/seed/id-register.yaml.
Wherever a seed file says {prospect}, use that prospect name.

The complaint file is a fixture standing in for an L9 intake ticket. It is not a live ticket.
Apply the SOP. Write demos/complaint-capa/run/complaint.yaml with the complaint record, the
reportability call, and the CAPA recommendation. Set status to ready-for-review and
submitted_externally to false. Do not wait for approval. A reviewer may override the call later.

Create new GIO tickets only, with exactly these labels:
demo, medplum, story:complaint-capa, track:ls, stage:post-market
Do not add automatable, agent-safe, or maintenance. Do not transition any ticket. Do not comment
on existing tickets. Do not open a pull request. Do not write to Medplum. Do not email, post,
or submit the report anywhere.

If the Atlassian connector cannot create GIO issues, write the local file with jira_key set to
null, and stop with the blocker "Atlassian connector cannot create GIO issues".
Do not invent ticket keys.
```
