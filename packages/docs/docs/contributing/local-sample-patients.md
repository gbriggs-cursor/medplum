---
sidebar_position: 25
sidebar_label: Sample patients on localhost
---

# Local development with sample patients

A fresh local Medplum does not include any `Patient` resources. First-boot seed creates a Super Admin user and project so you can sign in. It does not load a clinic, test patients, or sample charts.

This how-to covers the missing last mile: start the stack, sign in, create a working project, and import **synthetic** FHIR data you can search and query. Do not load PHI, production exports, or real patient charts into a local project.

## What first-boot seed creates

On the first successful server start, `packages/server/src/seed.ts` creates:

- A Super Admin `User` (defaults below)
- A Super Admin `Project` and `Practitioner`
- FHIR R4 structure definitions, value sets, and search parameters

It does **not** create a regular application project, a `ClientApplication` you can use from an SDK, or any `Patient` / clinical resources.

| Setting | Default |
| --- | --- |
| Email | `admin@example.com` |
| Password | `medplum_admin` |
| App | [http://localhost:3000/](http://localhost:3000/) |
| API | [http://localhost:8103/](http://localhost:8103/) |
| Healthcheck | [http://localhost:8103/healthcheck](http://localhost:8103/healthcheck) |
| Batch upload | [http://localhost:3000/batch](http://localhost:3000/batch) |
| Register | [http://localhost:3000/register](http://localhost:3000/register) |

Override the seed email and password with `defaultSuperAdminEmail` and `defaultSuperAdminPassword` in server config, or `MEDPLUM_DEFAULT_SUPER_ADMIN_EMAIL` and `MEDPLUM_DEFAULT_SUPER_ADMIN_PASSWORD`. These values are for local and throwaway environments only.

## Start the stack

Pick one path. Both serve the app on port `3000` and the API on port `8103`.

### From source (contributors)

Requires [Node.js](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) `22.22+` on the Node 22 line, or `24.2+` on the Node 24 line (Node 23 is not supported), plus Docker for Postgres and Redis.

```bash
git clone https://github.com/medplum/medplum.git medplum
cd medplum
npm ci
npm run build:fast
docker compose up
```

`docker compose up` starts **only** Postgres 16 and Redis 7 from the repo `docker-compose.yml`. It does not run Medplum or apply FHIR migrations. The official Postgres image creates the `medplum` database because `POSTGRES_USER=medplum`. `postgres/init_test.sql` creates the separate `medplum_test` databases used by unit tests.

Default service credentials from that compose file:

| Service | Host | Port | User / password |
| --- | --- | --- | --- |
| PostgreSQL | `localhost` | `5432` | `medplum` / `medplum` |
| Redis | `localhost` | `6379` | password `medplum` |

In two other terminals:

```bash
cd packages/server
npm run dev
```

```bash
cd packages/app
npm run dev
```

`npm run dev` in the server package runs `tsx watch` on `src/index.ts` and seeds the database on first boot. `npm run dev` in the app package starts Vite on port `3000`. Confirm the API with:

```bash
curl http://localhost:8103/healthcheck
```

You should see `"ok": true` with `"postgres": true` and `"redis": true`. First boot can take a minute while seed rebuilds definitions.

See [Run the Stack](./run-the-stack) for troubleshooting a second Postgres instance (`role "medplum" does not exist`).

### Full-stack Docker (no monorepo build)

```bash
curl https://raw.githubusercontent.com/medplum/medplum/refs/heads/main/docker-compose.full-stack.yml > docker-compose.yml
docker compose up -d
```

This starts Postgres, Redis, `medplum/medplum-server`, and `medplum/medplum-app`. First boot can take several minutes while the server migrates and seeds. Wait until [http://localhost:8103/healthcheck](http://localhost:8103/healthcheck) returns `"ok": true` before signing in.

Details: [Running the Full Medplum Stack in Docker](/docs/self-hosting/running-full-medplum-stack-in-docker).

## Sign in and create a working project

1. Open [http://localhost:3000/](http://localhost:3000/).
2. Either:
   - Sign in as `admin@example.com` / `medplum_admin`, or
   - Open [http://localhost:3000/register](http://localhost:3000/register) and create a new user plus project (registration is enabled by default).
3. If you signed in as Super Admin, create a **regular** project for app work. Super Admin is for server maintenance, not sample charts. Open [http://localhost:3000/register](http://localhost:3000/register) and create a project such as `Local Dev`, then choose that project on the profile picker.

If login fails after an interrupted first boot, drop the Docker volume or the `medplum` database and start the server again so seed can finish.

## Import synthetic patients

Stay on your regular project (not Super Admin). Open the local [batch create](http://localhost:3000/batch) page — the localhost equivalent of the hosted tool at `https://app.medplum.com/batch` — and upload a FHIR `Bundle`.

This bundle is fictional. It is safe to reload for demos.

```json
{
  "resourceType": "Bundle",
  "type": "batch",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "name": [{ "given": ["Avery"], "family": "Example" }],
        "gender": "female",
        "birthDate": "1988-04-12",
        "telecom": [{ "system": "email", "value": "avery.example@example.com" }]
      },
      "request": { "method": "POST", "url": "Patient" }
    },
    {
      "resource": {
        "resourceType": "Patient",
        "name": [{ "given": ["Jordan"], "family": "Example" }],
        "gender": "male",
        "birthDate": "1975-09-03",
        "telecom": [{ "system": "email", "value": "jordan.example@example.com" }]
      },
      "request": { "method": "POST", "url": "Patient" }
    }
  ]
}
```

Do not upload the same file twice if you only want one copy of each patient. Confirm the import at [http://localhost:3000/Patient](http://localhost:3000/Patient).

Need a larger synthetic population? Use [Synthea](https://github.com/synthetichealth/synthea) or the files in [Import Sample Data](/docs/tutorials/importing-sample-data), and upload them to `http://localhost:3000/batch` instead of `https://app.medplum.com/batch`.

### Import with the CLI

Point the CLI at the local API. Browser login opens the local app; client credentials skip the browser.

```bash
npx medplum login --base-url http://localhost:8103/
npx medplum post --base-url http://localhost:8103/ fhir/R4 "$(cat sample-patients.json)"
```

`fhir/R4` is the batch/transaction endpoint (`MedplumClient.executeBatch` posts to the same URL). Confirm the import with `npx medplum get --base-url http://localhost:8103/ 'Patient?name=example'`.

## Query local patients from an SDK

Create a `ClientApplication` **in the same project that holds the patients** (Project → Clients → create). Then set `baseUrl` to the local API — not `https://api.medplum.com`. A missing local `baseUrl` is the usual cause of `Invalid client` when the client id exists only on localhost.

```ts
import { MedplumClient } from '@medplum/core';

const medplum = new MedplumClient({
  baseUrl: 'http://localhost:8103/',
  clientId: process.env.MEDPLUM_CLIENT_ID,
  clientSecret: process.env.MEDPLUM_CLIENT_SECRET,
});

const patients = await medplum.searchResources('Patient', 'name=example');
```

`packages/app/.env.defaults` already sets `MEDPLUM_BASE_URL=http://localhost:8103/` for the web app. Example apps and scripts do not inherit that file; set `baseUrl` or `MEDPLUM_BASE_URL` yourself.

## Useful local values

| Name | Value |
| --- | --- |
| `npm ci` | Install workspace dependencies from the repo root |
| `npm run build:fast` | Build `@medplum/app` and `@medplum/server` |
| `docker compose up` | Postgres + Redis only (`docker-compose.yml`) |
| `npm run dev` (server) | API on `8103`, seed + migrate on first boot |
| `npm run dev` (app) | Vite app on `3000` |
| `MEDPLUM_BASE_URL` | `http://localhost:8103/` |
| `MEDPLUM_APP_BASE_URL` | `http://localhost:3000/` |
| `MEDPLUM_REGISTER_ENABLED` | `true` in `packages/app/.env.defaults` |

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| App shows no connection to the server | API is not up yet, or first-boot seed is still running. Wait for `/healthcheck`. |
| `admin@example.com` is rejected | Seed did not finish. Reset the database or Docker volume and start the server once, uninterrupted. |
| Patient search is empty | You are in Super Admin, or you uploaded to hosted `app.medplum.com` instead of `localhost:3000/batch`. |
| `Invalid client` from the SDK | `baseUrl` is still the hosted API, the client belongs to a different project, or the client has no secret / membership. |
| `role "medplum" does not exist` | Another Postgres is bound to `5432`. Stop it or point `packages/server/medplum.config.json` at the Docker instance. |

## Related

- [Run the Stack](./run-the-stack)
- [Import Sample Data](/docs/tutorials/importing-sample-data)
- [Browse Sample Data](/docs/tutorials/browse-sample-data)
- [Running the Full Medplum Stack in Docker](/docs/self-hosting/running-full-medplum-stack-in-docker)
- [Project $init](/docs/api/fhir/operations/project-init)
- [Medplum CLI](/docs/cli)
