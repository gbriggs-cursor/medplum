# Architecture (Project Context)

Synthetic context for Test & Review demos on `gbriggs-cursor/medplum`. Synthetic: true.

- **App:** `packages/app`, the Medplum admin app (React, Vite, Mantine). Resource pages and tabs are in `packages/app/src/resource/`; routes in `packages/app/src/AppRoutes.tsx`.
- **Components:** `packages/react` (`@medplum/react`). Reusable patient views live here and are exported from `packages/react/src/index.ts`.
- **Data access:** the browser uses `MedplumClient` from `@medplum/core` and FHIR search. Features in this track add no backend code, server operation, or database index.
- **Server:** `packages/server`. Requests run under the user's AccessPolicy. Code that uses a system repository skips AccessPolicy and needs a security review.
- **Safety classes:** `demos/_shared/regulatory/software-items.md`. Vitals capture (`packages/react/src/PatientSummary/Vitals*`) is class C; Foo Medical vitals display is class B; search matching in `packages/core/src/search/` is class B; everything else is class A.
- **Reviews:** Bugbot reads `.cursor/BUGBOT.md` (evidence and IEC 62304 rules). Security Reviewer reviews PRs for PHI, secrets, injection, and access control.
