# Prompt: G11 Integration docs for a partner

Variables: `{prospect}` (default `Foo Medical`).

```
An integration partner sent {prospect} the four questions in demos/integration-docs/seed/partner-questions.md.
Write one integration guide at packages/docs/docs/integration/practice-software-sync.md that answers all four
as a single walkthrough: authenticate a server job, upsert patients by the partner's own identifier, get a
webhook when an Appointment changes and verify it is genuine, and run a bulk export. Include a short
TypeScript snippet per step using @medplum/core.

Verify every claim against the source, starting from the files in demos/integration-docs/anchors.txt (grant
type handling, the upsert method, how the webhook signature header is computed, the bulk export operation).
Use only files in this repository. Link the guide from packages/docs/docs/integration/index.md and add it to
packages/docs/sidebars.ts next to the integration index. In the PR body add a table of each claim and the
file and line that backs it, and a drafted reply to the partner; do not send it. Open a draft PR against the
default branch.
```
