---
sidebar_position: 9
---

# Load synthetic test patients

A fresh Medplum server has no `Patient` resources. The first-boot seed creates a super admin login and the base FHIR R4 definitions. Test patients have to be written into the project your client will search.

Use this when a local or self-hosted server shows an empty Patient list, or when a Bundle upload returns success and a later `Patient` search in another project returns nothing.

## What the first boot creates

Starting the server runs `seedDatabase` before it accepts traffic.

- From a checkout, that is `npm run dev` in `packages/server` (`tsx watch` on `src/index.ts`).
- From [the full-stack Compose file](/docs/self-hosting/running-full-medplum-stack-in-docker), the `medplum-server` container runs the same seed on startup.

The seed runs only when the database has no `Practitioner` yet. It creates:

| Resource | What you get |
| --- | --- |
| Project `FHIR R4` | Id `161452d9-43b7-5c29-aa7b-c85680fa45c6`. Holds `StructureDefinition`, `ValueSet`, `CodeSystem`, `SearchParameter`, and `OperationDefinition`. Not a place to put patients. |
| Project `Super Admin` | `superAdmin: true`. This is the project the seeded user belongs to. |
| User | `admin@example.com` / `medplum_admin`, unless `defaultSuperAdminEmail` and `defaultSuperAdminPassword` are set. |
| Practitioner and ProjectMembership | The admin profile in the Super Admin project. |

It does not create `Patient` resources. Signing in as `admin@example.com` and seeing an empty Patient list means the seed finished. It does not mean the seed failed.

`packages/server/medplum.config.json` does not set `defaultSuperAdminEmail` or `defaultSuperAdminPassword`, and `docker-compose.full-stack.yml` does not set `MEDPLUM_DEFAULT_SUPER_ADMIN_EMAIL` or `MEDPLUM_DEFAULT_SUPER_ADMIN_PASSWORD`, so both local setups use `admin@example.com` and `medplum_admin`.

Check the API with `GET http://localhost:8103/healthcheck`. The server port is `8103` in `packages/server/medplum.config.json` and in `docker-compose.full-stack.yml`. A healthy response includes `ok`, `version`, `platform`, `runtime`, `postgres`, `redis`, and `redisInstances`.

## Create a project for client testing

Patients you upload while signed in as `admin@example.com` land in **Super Admin**, unless that super admin request includes `meta.project` on the resources. A mobile app or QA client that uses a different project will not see them.

Create a normal project and upload while that project is the active login.

### In the local app

The app dev server is `npm run dev` in `packages/app` (Vite, port `3000`). `appBaseUrl` in `packages/server/medplum.config.json` is `http://localhost:3000/`. The full-stack Compose file publishes the same port.

1. Sign out of the super admin session.
2. Open [http://localhost:3000/register](http://localhost:3000/register).
3. Register a user and name the project, for example `Foo Medical`.

Registration is accepted unless server config `registerEnabled` is `false`. The checked-in `medplum.config.json` does not set it, and `packages/app/.env.defaults` sets `MEDPLUM_REGISTER_ENABLED=true`, so the local app shows the register form.

The new login's only project is the one you just named. Upload with that login. The seeded `admin@example.com` user is not a member of this project.

### With the API

`POST http://localhost:8103/fhir/R4/Project/$init` creates a project. Call it with a super admin access token. The parameters are the same as [Project $init](/docs/api/fhir/operations/project-init); send them to your server's base URL instead of `https://api.medplum.com/`.

```bash
curl 'http://localhost:8103/fhir/R4/Project/$init' \
  -X POST \
  -H 'Content-Type: application/fhir+json' \
  -H 'Authorization: Bearer ACCESS_TOKEN' \
  -d '{"resourceType":"Parameters","parameter":[{"name":"name","valueString":"Foo Medical"}]}'
```

`$init` adds a membership for the owner. The access token you used for `$init` is still the Super Admin project, so a Bundle posted with that token is not written into the new project. Sign in again as that owner. When the user has more than one membership, the sign-in form asks you to choose a profile. Choose the new project before you upload.

A token for a `ClientApplication` in the new project also writes into that project. Create the client at `/admin/clients` while signed in to that project, then request a token:

```bash
curl -X POST 'http://localhost:8103/oauth2/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials&client_id=CLIENT_ID&client_secret=CLIENT_SECRET'
```

The CLI in `@medplum/cli` talks to the same server when you set the base URL. The package bin is `medplum`. From this repo the script is `npm run medplum --workspace=@medplum/cli`.

```bash
export MEDPLUM_BASE_URL=http://localhost:8103/
npx medplum login
npx medplum project current
```

`project current` prints the project a later CLI write will use. `npx medplum project switch PROJECT_ID` changes the active login only among projects this CLI profile has already signed in to. It does not create a membership.

## Upload a handful of patients

Upload into the project you just selected. Two supported paths write the same resources.

### Batch page on your app

Open [http://localhost:3000/batch](http://localhost:3000/batch). The hosted tutorial uses [https://app.medplum.com/batch](https://app.medplum.com/batch). That is the hosted app. A self-hosted app serves the same `/batch` route on `appBaseUrl`.

The page posts the Bundle to the API as the project you are signed in to. If `Bundle.type` is not `batch` or `transaction`, the page converts the file to a transaction and strips `meta.author`, `meta.project`, `meta.versionId`, `meta.lastUpdated`, and `meta.compartment` before sending. A file that is already `type: batch` or `type: transaction` is sent as-is, including any `meta.project` on the entries.

### POST the Bundle to the FHIR root

The batch endpoint is the FHIR base, not a `Bundle` create:

```text
POST http://localhost:8103/fhir/R4
```

`POST http://localhost:8103/fhir/R4/Bundle` stores one `Bundle` resource and does not create the patients inside it. That request succeeds, and every `Patient` search stays empty.

`Bundle.type` must be `batch` or `transaction`. Any other type, including a Synthea `collection` pasted straight to this URL, is rejected with `Unrecognized bundle type`. The `/batch` page converts those files. `curl` does not.

Use `batch` for test patients. A `transaction` Bundle is atomic only when the project has the `transaction-bundles` feature. Without that feature the server processes it as a batch and does not return an error. See [FHIR Batch Requests](/docs/fhir-datastore/fhir-batch-requests).

```bash
curl 'http://localhost:8103/fhir/R4' \
  -X POST \
  -H 'Authorization: Bearer ACCESS_TOKEN' \
  -H 'Content-Type: application/fhir+json' \
  -H 'X-Medplum: extended' \
  -d @patients.json
```

`patients.json`:

```json
{
  "resourceType": "Bundle",
  "type": "batch",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "name": [{ "family": "Example", "given": ["Pat"] }],
        "gender": "unknown",
        "birthDate": "1990-01-01"
      },
      "request": { "method": "POST", "url": "Patient" }
    },
    {
      "resource": {
        "resourceType": "Patient",
        "name": [{ "family": "Placeholder", "given": ["Sam"] }],
        "gender": "unknown",
        "birthDate": "1991-02-02"
      },
      "request": { "method": "POST", "url": "Patient" }
    }
  ]
}
```

`X-Medplum: extended` keeps `meta.project` on the response. The app and the CLI send that header. `curl` does not, unless you add it.

## Which project they landed in

Each created resource is stored with `meta.project` set to the project of the access token that performed the write (the first project on that login).

Two exceptions:

- A super admin may send `meta.project` on the resource. The server keeps that id. The seeded `admin@example.com` user is a super admin, so a Bundle that still contains `meta.project` from another server is written into that project, not into Super Admin and not into the project selected in the UI.
- A caller who is not a super admin cannot choose `meta.project`. The server sets it to the login's project.

That is why a Bundle posted to `localhost:8103` can succeed while `Patient` search in the project you expected is empty. The patients are in the token's project. Search with a token for a different project does not return them.

A super admin `Patient` search is not limited to the Super Admin project. It returns patients from every project. If that search is also empty, no `Patient` resources were created. A `201` from `POST /fhir/R4/Bundle` does that: it stores the Bundle and does not create the entries. A Bundle whose `type` is not `batch` or `transaction` is rejected on this endpoint, so that request does not succeed. A request that sends `Prefer: respond-async` can succeed before the patients are searchable; wait for the `AsyncJob` to complete.

To read the id back:

1. In the app, open the patient and the JSON tab. `meta.project` is the project id.
2. Or `GET` the patient with the same header:

```bash
curl 'http://localhost:8103/fhir/R4/Patient/PATIENT_ID' \
  -H 'Authorization: Bearer ACCESS_TOKEN' \
  -H 'X-Medplum: extended'
```

3. Or, before the upload, run `npx medplum project current` with `MEDPLUM_BASE_URL=http://localhost:8103/`. That is the project a CLI or SDK write will use, unless a super admin request also sends `meta.project`.

`GET http://localhost:8103/fhir/R4/Patient` with the client-testing project's token should then list the patients. The same search with the Super Admin token lists them too, because that search is server-wide. The same search with a token for any other project does not.
