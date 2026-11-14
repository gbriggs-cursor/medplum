> REPLAY (no key). Authored from `.cursor/BUGBOT.md`; not a captured Bugbot review.

**Bugbot: high risk**

Class C: class C change with no trace ID. `evidence/EVIDENCE.md` has no `Trace:` line.

Class C files:

- `packages/react/src/PatientSummary/Vitals.utils.ts` (SI-01 Vitals capture)

Add a `Trace:` line with at least one `REQ-` ID and one `RISK-` ID from `demos/_shared/regulatory/`.
