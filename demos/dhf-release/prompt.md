# Prompt: L7 DHF release

Variables: `{prospect}` (default `Acme Cardio`).

```
Requirement REQ-007: Build the design history index and trace matrix for the synthetic
{prospect} patch v2 release records.

Work in demos/dhf-release/.
1. Run demos/dhf-release/reset.sh, then node demos/dhf-release/src/assemble.mjs.
2. Read evidence/DHF-INDEX.md and evidence/trace.json. Report the passed and failed
   counts from the script. Do not invent counts, and do not claim the named tests were re-run.
3. Do not write approval.json and do not wait for a signature.
Open a draft PR against the default branch. Synthetic data only. No Jira writes.
With no CURSOR_API_KEY, run `node demos/dhf-release/src/demo.mjs`. The model turn is
REPLAY (no key). The assemble-dhf tool still runs, and the evidence files carry that label.
Do not claim the named tests were re-run.
```
