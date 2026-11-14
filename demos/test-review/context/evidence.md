# Evidence (Project Context)

Synthetic: true.

Every in-scope PR adds or updates `evidence/EVIDENCE.md` (rules in `.cursor/BUGBOT.md`). Write it with the `evidence-package` skill in `demos/_shared/skills/evidence-package/SKILL.md`.

The header is exactly six lines:

```
Requirement: <sentence>
Change: <what changed>
Test: <command>
Result: <pass or fail> (<n> passed, <m> failed)
Synthetic: true
Commit: <full sha>
```

A class B or C change adds `Trace: REQ-<nnn>, RISK-<nnn>` with IDs from `demos/_shared/regulatory/`. Story A uses its own IDs (REQ-DEV-01 to REQ-DEV-04, RISK-DEV-01 to RISK-DEV-03) from `demos/test-review/prd-patient-devices.md` in the UAT table; they are not in the regulatory seed, so do not put them on the `Trace:` line.

UAT rows from `uat-from-acceptance-criteria` go in the requirement-to-test-to-run-to-result table, one row per REQ line, with the screenshot or video path in the `Test` cell.

A blank `Result`, a missing line, or an unknown trace ID is a high-risk Bugbot finding.
