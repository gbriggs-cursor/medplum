---
sidebar_position: 25
sidebar_label: Local Dev with Sample Data
---

# Run Medplum locally with synthetic test patients

This how-to gets a local Medplum stack running, signs you in with the seeded admin account, and loads **synthetic** FHIR patients you can query from the app or the SDK.

Use this page when you want a disposable environment for client libraries, bots, or UI work. It is not a production install. For production, see [Self-hosting](/docs/self-hosting).

:::danger[Synthetic data only]

Never load real patient data, exports from a production EHR, or any PHI into a local or demo project. Use the bundle on this page, [Synthea](https://github.com/synthetichealth/synthea), or another synthetic generator.

:::

## What you get

| Piece | Value |
| ----- | ----- |
| App | [http://localhost:3000](http://localhost:3000) |
| API / FHIR | [http://localhost:8103](http://localhost:8103) |
| Health check | [http://localhost:8103/healthcheck](http://localhost:8103/healthcheck) |
| Seeded admin email | `admin@example.com` |
| Seeded admin password | `medplum_admin` |
| Postgres | `localhost:5432`, user/password/database `medplum` / `medplum` / `medplum` |
| Redis | `localhost:6379`, password `medplum` |

The first server start creates the Super Admin user and project. It does **not** create sample patients. Those come from the import step below.

## Choose a path

- **From source** — you are changing Medplum itself. Follow [Run the Stack](/docs/contributing/run-the-stack), then come back here at [Sign in](#sign-in).
- **Full-stack Docker** — you want a running API and app without cloning the monorepo. Use the next section.

## Start with Docker Compose

The published compose file starts Postgres, Redis, `medplum-server`, and `medplum-app`.

```bash
curl -fsSL https://raw.githubusercontent.com/medplum/medplum/refs/heads/main/docker-compose.full-stack.yml -o docker-compose.yml
docker compose up -d
```

First boot runs database seed work (structure definitions, value sets, search parameters). That often takes a few minutes. Do not sign in until the health check is green:

```bash
curl -s http://localhost:8103/healthcheck
```

A ready server returns JSON like `{"ok":true,"postgres":true,"redis":true}`.

If `docker compose` cannot bind `5432`, `6379`, `8103`, or `3000`, another process is already using that port. Stop the other process or change the host ports in the compose file.

## Sign in

Open [http://localhost:3000](http://localhost:3000) and sign in with:

| | |
| --- | --- |
| **Email** | `admin@example.com` |
| **Password** | `medplum_admin` |

Those values come from `packages/server/src/seed.ts`. The server uses them when `defaultSuperAdminEmail` and `defaultSuperAdminPassword` are unset. You can override them in `medplum.config.json` or with `MEDPLUM_DEFAULT_SUPER_ADMIN_EMAIL` and `MEDPLUM_DEFAULT_SUPER_ADMIN_PASSWORD` **before** the first start. Changing them later does not rewrite an already-seeded user.

If sign-in fails on a brand-new database, the first seed likely did not finish. Wait for `/healthcheck`, or reset the Docker volume and start again. Do not treat this account as a production password.

## Create a regular project

The seeded account lands in the **Super Admin** project. That project is for server maintenance, not sample charts.

1. Open [http://localhost:3000/signin?project=new](http://localhost:3000/signin?project=new).
2. Create a project such as `Local Dev`.
3. Work in that project for patients, clients, and SDK calls.

You can also register a separate user at [http://localhost:3000/register](http://localhost:3000/register) while `MEDPLUM_REGISTER_ENABLED` is `true` (the default in `packages/app/.env.defaults`).

## Create client credentials

The seed does **not** create a usable `ClientApplication` unless you set `defaultSuperAdminClientId` and `defaultSuperAdminClientSecret` before first start. For local SDK work, create a client in your regular project:

1. Open **Project** → **Clients** ([http://localhost:3000/admin/clients/new](http://localhost:3000/admin/clients/new)).
2. Name it `Local Dev Client` and create it.
3. Copy the client ID and secret.

Point the SDK at the **local** API. A client created on localhost is not valid against `https://api.medplum.com`, and the hosted defaults are not valid against `http://localhost:8103`.

```ts
import { getDisplayString, MedplumClient } from '@medplum/core';

const medplum = new MedplumClient({
  baseUrl: 'http://localhost:8103/',
});

await medplum.startClientLogin(process.env.MEDPLUM_CLIENT_ID, process.env.MEDPLUM_CLIENT_SECRET);

const patients = await medplum.searchResources('Patient');
console.log(patients.map((patient) => getDisplayString(patient)));
```

`Invalid client` on a fresh Docker stack almost always means `baseUrl` is still the hosted API, or the client ID/secret belong to a different project.

## Load synthetic patients

Download the small batch bundle of two fictional patients (Avery Patel and Jordan Kim) plus a practitioner, condition, and blood-pressure observation:

- [local-dev-sample-patients.json](/examples/local-dev-sample-patients.json)

Then either:

**App.** Open [http://localhost:3000/batch](http://localhost:3000/batch) and upload the file once. Confirm on [http://localhost:3000/Patient](http://localhost:3000/Patient). Uploading twice with `PUT` on the same IDs overwrites the same resources; it does not duplicate them.

**SDK** (after `startClientLogin`):

```ts
import { readFile } from 'node:fs/promises';

const bundle = JSON.parse(await readFile('local-dev-sample-patients.json', 'utf8'));
await medplum.executeBatch(bundle);
```

Browse the imported resources with the [sample data map](/docs/tutorials/browse-sample-data). On localhost, replace `https://app.medplum.com` in those links with `http://localhost:3000`.

### Larger Synthea populations

The two-patient file is enough to prove login, search, and SDK wiring. For a bigger cohort, generate [Synthea](https://github.com/synthetichealth/synthea) FHIR R4 bundles or follow [Import Sample Data](/docs/tutorials/importing-sample-data).

The full-stack compose file sets `MEDPLUM_MAX_JSON_SIZE=1mb`. A typical Synthea patient history is larger than that and the request fails before FHIR processing starts. For a local import, raise the limit (and restart the server):

```bash
# docker-compose.full-stack.yml, under medplum-server.environment
MEDPLUM_MAX_JSON_SIZE: '50mb'
```

From source, set `maxJsonSize` in `packages/server/medplum.config.json`. For very large batches, prefer [asynchronous batch requests](/docs/fhir-datastore/processing-async-bundles) (`maxBatchSize`, default `50mb`).

## Default env vars and commands

These are the values the repo actually uses today. They are the source of truth if a blog post or older guide disagrees.

| What | Command or value |
| ---- | ---------------- |
| Install workspaces | `npm ci` from the repo root (not `npm install` inside a package) |
| Fast build | `npm run build:fast` (`@medplum/app` and `@medplum/server` only) |
| Docs build | `npm run build:docs` |
| Server | `cd packages/server && npm run dev` — `tsx watch` on `src/index.ts` |
| App | `cd packages/app && npm run dev` — Vite on port `3000` |
| App API URL | `MEDPLUM_BASE_URL=http://localhost:8103/` in `packages/app/.env.defaults` |
| Server port / URLs | `port` `8103`, `baseUrl` `http://localhost:8103/`, `appBaseUrl` `http://localhost:3000/` in `packages/server/medplum.config.json` |
| Node | `>=22.22.0 <23.0.0` or `>=24.2.0 <25.0.0` (root `package.json` `engines`) |
| Background services | `docker compose up` — Postgres **16** and Redis **7** in `docker-compose.yml` |

The root `docker-compose.yml` starts **only** Postgres and Redis. It does not start the API or app. Use `docker-compose.full-stack.yml` when you want those too.

`postgres/init_test.sql` creates `medplum_test` and `medplum_test_shard_1` for unit tests. The application database `medplum` is created by Postgres because `POSTGRES_USER=medplum`.

## Troubleshooting

| Symptom | What to check |
| ------- | ------------- |
| Sign-in form rejects `admin@example.com` | `/healthcheck` is not `ok` yet; seed did not finish; or another Postgres already owns port `5432` with a different password |
| `role "medplum" does not exist` | A non-Medplum Postgres is bound to `5432`. Stop it or point `packages/server/medplum.config.json` at the Docker instance |
| `Invalid client` from the SDK | Set `baseUrl: 'http://localhost:8103/'` and use a client created **on that server** |
| Empty Patient search | You are still in Super Admin, imported into a different project, or the batch never ran |
| Large JSON import fails immediately | Raise `maxJsonSize` / `MEDPLUM_MAX_JSON_SIZE`; see [Larger Synthea populations](#larger-synthea-populations) |
| App loads but cannot reach the API | App `MEDPLUM_BASE_URL` must match the server `baseUrl` (both default to `http://localhost:8103/`) |
