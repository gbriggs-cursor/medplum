# GIO ticket template: ticket-to-PR

Demo Setup creates this ticket on GIO with the labels from `../story.yaml`. Replace `{prospect}`; the default is `Acme Cardio`.

**Summary**

```
[{prospect} Medplum Maintenance] MockClient search ignores a filter that the server honors
```

**Description**

```
Our test suite uses MockClient from @medplum/mock. A search that works against the Medplum server
returns different results in MockClient. Find one search parameter where MockClient
(MemoryRepository in packages/fhir-router, matching in packages/core/src/search) disagrees with the
server, add a failing regression test, fix the source so the test passes, and open a draft PR that
cites this ticket. Synthetic data only.
```
