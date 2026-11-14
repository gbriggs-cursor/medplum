# Prompt: L14 Batch evidence

Variables: `{prospect}` (default `Acme Cardio`), `{seed}` (default `20261104`).

```
Requirement REQ-014: Refresh evidence for a batch of synthetic {prospect} device changes
from the P1 cohort (seed {seed}).

Work in demos/batch-evidence/.
1. Run demos/batch-evidence/reset.sh, then node demos/batch-evidence/src/refresh.mjs.
2. Read evidence/EVIDENCE.md and evidence/trace.json. Report the passed and failed
   counts from the script. Do not invent counts.
3. Do not write approval.json and do not wait for a signature. The approval gate
   writes that file only after a human decision.
4. If a cited device id is missing from seed/cohort-index.json, that trace row is
   fail and the batch result is fail. Say so.
Open a draft PR against the default branch. Synthetic data only. No Jira writes.
With no CURSOR_API_KEY, run `node demos/batch-evidence/src/demo.mjs`. The model turn is
REPLAY (no key). The refresh-evidence tool still runs, and the evidence files carry that label.
```
