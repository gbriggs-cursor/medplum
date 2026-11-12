# Prompt: L4 IEC 62304 Bugbot rules

Variables: `{prospect}` (default `Acme Cardio`).

## 1. Make a class C change (the agent is not told about trace IDs)

```
{prospect} reports that a blood-pressure entry with diastolic 120 and systolic 80 was saved. In
packages/react/src/PatientSummary/Vitals.utils.ts, make createCompoundObservation return undefined
for a blood-pressure panel (LOINC 85354-9) whose diastolic value (8462-4) is greater than or equal
to its systolic value (8480-6). Add Vitest tests next to it with synthetic values, run the
packages/react tests for that file, use the evidence-package skill, and open a draft PR against the
default branch.
```

Wait for Bugbot. It flags the PR high risk: `Class C: class C change with no trace ID`.

## 2. Address the finding

```
Read Bugbot's review on this PR and fix every finding. Use demos/_shared/regulatory/ for IDs. Do not
change product code or tests to do it. Push to this PR.
```

Expected: one commit that adds `Trace: REQ-006, RISK-001` to `evidence/EVIDENCE.md`. Bugbot's next review has no IEC 62304 flag.

## Optional: SOUP beat

```
Add a runtime dependency on date-fns to packages/react for this change and push. Then read Bugbot's
review and fix every finding.
```

Expected: Bugbot flags `date-fns` missing from `demos/_shared/regulatory/SOUP.md`; the agent adds a row. Leave this commit out of any PR you plan to keep.
