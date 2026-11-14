---
sidebar_label: Practice Software Sync
tags: [integration, auth, subscription]
---

# Syncing Practice Management Software with Medplum

This guide walks through a typical server-to-server integration between practice management software and a Medplum project. It covers the four things such an integration usually needs:

1. [Authenticate a server job](#step-1-authenticate-a-server-job) with no user logged in
2. [Upsert patients](#step-2-upsert-patients-by-your-own-identifier) by your own patient identifier, so nightly syncs never create duplicates
3. [Receive a webhook](#step-3-get-a-webhook-when-an-appointment-changes) when an `Appointment` is booked or cancelled, and [verify that it is genuine](#verifying-the-signature)
4. [Run a bulk export](#step-4-run-a-bulk-export) of a project's data

Every snippet uses the [`MedplumClient`](/docs/sdk/core.medplumclient) from `@medplum/core` and runs in Node.js.

## Step 1: Authenticate a server job

A nightly job with no user logged in should use the OAuth2 [Client Credentials](/docs/auth/client-credentials) flow, which is intended for machine-to-machine access.

1. In the Medplum project, create a [ClientApplication](https://app.medplum.com/ClientApplication) from the [Project Admin page](https://app.medplum.com/admin/clients).
2. Copy its `ID` and `Secret` into your job's secret store.
3. Optionally attach an [AccessPolicy](/docs/access/access-policies) to the client's membership to limit what the job can read and write.

The job exchanges these credentials at the token endpoint (`POST /oauth2/token` with `grant_type=client_credentials`). `MedplumClient.startClientLogin` does this for you:

```ts
import { MedplumClient } from '@medplum/core';

const medplum = new MedplumClient({
  baseUrl: 'https://api.medplum.com/', // or your self-hosted server
});

await medplum.startClientLogin(process.env.MEDPLUM_CLIENT_ID as string, process.env.MEDPLUM_CLIENT_SECRET as string);
```

Things to know:

- The client and its project membership must be active. Inactive clients, missing memberships, and inactive projects are rejected.
- Client credentials cannot request `patient/` scopes. Use system or user scopes, or omit `scope` (it defaults to `openid`).
- `MedplumClient` keeps the client ID and secret after `startClientLogin`. When the access token expires, the next request logs in again automatically, so a long-running job does not need to manage token refresh.
- The server also accepts the client ID and secret in an HTTP Basic `Authorization` header instead of the form body.

## Step 2: Upsert patients by your own identifier

Store your own patient ID on each `Patient` as an `identifier` with a `system` URI that you own. Then send every nightly record with `upsertResource`, which issues a FHIR [conditional update](https://hl7.org/fhir/R4/http.html#cond-update) (`PUT /Patient?identifier=...`):

- If the search matches one patient, that patient is updated.
- If it matches no patient, a new one is created.
- If it matches more than one patient, the request fails with a `multiple-matches` error and nothing is written.

The search and the write run in a single serializable database transaction, so the check for an existing patient and the create or update happen together.

```ts
import type { Patient } from '@medplum/fhirtypes';

const PARTNER_SYSTEM = 'https://practice-software.example.com/patient-id';

async function syncPatient(
  partnerPatientId: string,
  family: string,
  given: string,
  birthDate: string
): Promise<Patient> {
  return medplum.upsertResource<Patient>(
    {
      resourceType: 'Patient',
      identifier: [{ system: PARTNER_SYSTEM, value: partnerPatientId }],
      name: [{ family, given: [given] }],
      birthDate,
    },
    { identifier: `${PARTNER_SYSTEM}|${partnerPatientId}` }
  );
}
```

Upsert replaces the whole resource, the same as a regular update. Send the complete patient each time, including the `identifier`, or fields you leave out are removed. If the Medplum side may also edit these patients, read the current resource and merge your changes, or use [version checking](/docs/fhir-datastore/updating-data#preventing-lost-updates-with-version-checking) to avoid overwriting their edits.

See [Updating Data](/docs/fhir-datastore/updating-data#upsert-operation) for more on upsert.

## Step 3: Get a webhook when an Appointment changes

Create a FHIR [Subscription](/docs/subscriptions) with a `rest-hook` channel. When a resource matching its `criteria` is created, updated, or deleted, Medplum sends an HTTP `POST` to your `endpoint`.

Booking an appointment is a create. Cancelling one is usually an update that sets `Appointment.status` to `cancelled`, so the subscription below listens for both. To also hear about hard deletes, add a third extension with `valueCode: 'delete'`, or remove the `subscription-supported-interaction` extensions entirely to receive all three interactions.

```ts
import { randomBytes } from 'node:crypto';

const webhookSecret = randomBytes(32).toString('hex'); // store this on your side as well

await medplum.createResource({
  resourceType: 'Subscription',
  status: 'active',
  reason: 'Notify practice software of appointment changes',
  criteria: 'Appointment',
  channel: {
    type: 'rest-hook',
    endpoint: 'https://practice-software.example.com/medplum/appointments',
    payload: 'application/fhir+json',
  },
  extension: [
    { url: 'https://www.medplum.com/fhir/StructureDefinition/subscription-secret', valueString: webhookSecret },
    { url: 'https://medplum.com/fhir/StructureDefinition/subscription-supported-interaction', valueCode: 'create' },
    { url: 'https://medplum.com/fhir/StructureDefinition/subscription-supported-interaction', valueCode: 'update' },
  ],
});
```

Note the two extension URL hosts: the secret extension uses `www.medplum.com`, and the supported-interaction extension uses `medplum.com`. The server matches each URL exactly.

### What you receive

Each delivery is a `POST` with these headers:

| Header                       | Value                                                                 |
| ---------------------------- | --------------------------------------------------------------------- |
| `Content-Type`               | `application/fhir+json`                                               |
| `X-Medplum-Subscription`     | The `Subscription` ID                                                 |
| `X-Medplum-Interaction`      | `create`, `update`, or `delete`                                       |
| `X-Medplum-Deleted-Resource` | `Appointment/<id>`, only on deletes                                   |
| `X-Signature`                | HMAC-SHA256 of the request body, only when a secret is configured     |
| Custom headers               | Any `"Name: value"` entries you list in `Subscription.channel.header` |

The body is the `Appointment` as JSON. On a delete, the body is `{}`.

### Delivery timing and retries

Deliveries are sent from a background job queue after the change is saved, not inside the request that made the change. The source does not define a delivery-time guarantee, so measure latency against your one-minute requirement in your own environment rather than assuming it.

Any `2xx` or `3xx` response counts as success. Other responses, network errors, and requests that take longer than 120 seconds are retried with exponential backoff. By default a delivery is attempted 4 times. Set the [`subscription-max-attempts`](/docs/subscriptions/subscription-extensions#retry-policy) extension (1 to 18) to change this. A retry is skipped if the appointment has changed again since the failed attempt, because a newer delivery will follow. Each attempt is recorded as an `AuditEvent` for troubleshooting.

### Verifying the signature

When the `subscription-secret` extension is set, Medplum computes `X-Signature` as the hex-encoded HMAC-SHA256 of the exact request body bytes, keyed with the secret. To verify a delivery:

1. Read the raw request body before any JSON parsing.
2. Compute the HMAC-SHA256 of those bytes with your copy of the secret, hex-encoded.
3. Compare it to the `X-Signature` header using a constant-time comparison, and reject the request if they differ.

Hash the raw body rather than re-serializing parsed JSON. Re-serializing can change key order or whitespace and produce a different signature.

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';
import express from 'express';

const app = express();

app.post('/medplum/appointments', express.raw({ type: '*/*' }), (req, res) => {
  const rawBody = req.body as Buffer;
  const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const received = req.get('X-Signature') ?? '';

  if (received.length !== expected.length || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
    res.sendStatus(401);
    return;
  }

  const interaction = req.get('X-Medplum-Interaction'); // 'create' | 'update' | 'delete'
  const appointment = JSON.parse(rawBody.toString('utf8'));
  // Queue the change for processing, then acknowledge quickly
  res.sendStatus(200);
});
```

The signature proves that the sender knew the secret and that the body was not modified. It does not include a timestamp, so a captured request could be replayed. Make your handler idempotent, for example by keying on the appointment ID and `meta.versionId`, so a replay or a retry has no extra effect.

See [Subscription Extensions](/docs/subscriptions/subscription-extensions#signatures) for more on signatures.

## Step 4: Run a bulk export

Medplum supports the [Bulk FHIR API](/docs/api/fhir/operations/bulk-fhir). The `$export` operation runs asynchronously and produces NDJSON files. You can export at three levels:

| Call                                     | Exports                                                          |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `medplum.bulkExport()`                   | All exportable resources in the project (`/$export`)             |
| `medplum.bulkExport('Patient')`          | All patient-compartment resources (`/Patient/$export`)           |
| `medplum.bulkExport('Group/<group-id>')` | Data for the patients in a `Group` (`/Group/<group-id>/$export`) |

Pass a comma-separated list of resource types to limit the export, and an instant to export only resources changed since then. With `pollStatusOnAccepted`, the client polls the status URL until the export finishes:

```ts
const result = await medplum.bulkExport(
  '', // system level: everything in the project
  undefined, // optional, e.g. 'Patient,Appointment,Encounter'
  undefined, // optional _since, e.g. '2026-07-01T00:00:00Z'
  { pollStatusOnAccepted: true, pollStatusPeriod: 5000 }
);

for (const file of result.output ?? []) {
  const response = await fetch(file.url as string); // presigned URL, no access token needed
  const ndjson = await response.text();
  console.log(file.type, ndjson.split('\n').filter(Boolean).length);
}
```

Things to know:

- The job's AccessPolicy must allow reading `AsyncJob`, or it cannot poll the export status. The export includes only resource types the job is allowed to search.
- "Everything" excludes some resource types. `Binary`, `AuditEvent`, `Login`, `AsyncJob`, `BulkDataExport`, and conformance resources such as `StructureDefinition` and `ValueSet` are never exported. Neither are protected system resources.
- The completed status response sets `requiresAccessToken: false`. Each `output[].url` is a presigned URL that you download without the bearer token.
- For a quarterly export, save the status response's `transactionTime`. Pass it as `_since` next quarter if you only need changes.

## Related

- [Client Credentials](/docs/auth/client-credentials)
- [Updating Data](/docs/fhir-datastore/updating-data)
- [Subscriptions](/docs/subscriptions) and [Subscription Extensions](/docs/subscriptions/subscription-extensions)
- [Bulk FHIR API](/docs/api/fhir/operations/bulk-fhir)
