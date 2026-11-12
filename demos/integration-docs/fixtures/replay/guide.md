REPLAY (no key)

# Practice software sync

Recorded guide for the four partner questions. Claims are checked against this repository by the offline command. Nothing here was fetched from another domain.

## 1. Authenticate a nightly job

A server job with no user uses the client-credentials grant. `handleClientCredentials` in `packages/server/src/oauth/token.ts` handles that grant. The page that describes it is `packages/docs/docs/auth/client-credentials.md`.

## 2. Upsert patients by the partner's own identifier

`upsertResource` on `MedplumClient` (`packages/core/src/client.ts`) finds one resource with a FHIR search and updates it, or creates it when the search misses. The write-up is `packages/docs/docs/fhir-datastore/updating-data.md`. Search on the identifier the partner already stores.

## 3. Webhook when an appointment changes

A Subscription can POST the Appointment change. When the subscription secret extension is set, the server sets `X-Signature` to the HMAC-SHA256 hex of the body (`packages/server/src/workers/subscription.ts`). The overview is `packages/docs/docs/subscriptions/index.md`.

## 4. Quarterly bulk export

Bulk export of a project is the Bulk FHIR operation documented in `packages/docs/docs/api/fhir/operations/bulk-fhir.mdx`. The export is asynchronous and the result is NDJSON.
