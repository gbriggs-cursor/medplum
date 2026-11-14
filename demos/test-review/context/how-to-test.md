# How to test (Project Context)

Synthetic: true.

## Unit tests

- `cd packages/react && npx vitest run <path>` for components and utils. Use `MockClient` from `@medplum/mock`.
- `cd packages/app && npx vitest run <path>` for pages and routes.
- `cd examples/foomedical && npx vitest run <path>` for the Foo Medical portal.

## Local app for UAT

1. Start Postgres and Redis, then the server (`cd packages/server && npm run dev`) and the app (`cd packages/app && npm run dev`). See `packages/docs/docs/contributing/local-dev-setup/local-dev-setup.md`.
2. Sign in with the local admin account.
3. Load test data: POST `demos/_shared/data/taylor-demo-bp-cuff.json` to `/fhir/R4` as a transaction. Re-date it first with `node demos/test-review/offline.mjs --as-of <today> --write /tmp/taylor.json` so the 30-day window lines up.
4. Find Taylor Demo with `Patient?name=Taylor Demo` and open the patient.

## Acceptance tests

Run each REQ line in `demos/test-review/prd-patient-devices.md` with the `uat-from-acceptance-criteria` skill. Each check captures a screenshot or video and appends a row to `EVIDENCE.md`.

## Rules

- Synthetic data only. Every resource you create is tagged `synthetic` and `HTEST`.
- Never paste tokens or secrets into logs, screenshots, or evidence.
