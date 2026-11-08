---
sidebar_position: 2
---

# Loading Standard Terminologies

A project can store an RxNorm, LOINC, SNOMED CT, ICD-10-CM, or CPT code on a clinical resource without that code
system being loaded. Typeahead, `ValueSet/$expand`, and `CodeSystem/$lookup` cannot. Those operations resolve the
`system` URL to a `CodeSystem` in the current project or a [linked project](/docs/access/projects#project-linking).

That gap is why a terminology picker is empty, and why expand fails like this:

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "invalid",
      "details": {
        "text": "CodeSystem http://www.nlm.nih.gov/research/umls/rxnorm not found"
      }
    }
  ]
}
```

`compose.include.concept` on the ValueSet does not skip the lookup. The server still requires a `CodeSystem` whose
`url` equals `compose.include.system`.

## What the seed contains

First boot loads the FHIR R4 terminology bundles (`v2-tables`, `v3-codesystems`, `valuesets`, and the Medplum value
set bundles). Those are HL7 vocabularies such as administrative gender. They also include a SNOMED CT shell:

- `url` is `http://snomed.info/sct`
- `content` is `not-present`
- the concept list is empty

A search hit on that shell does not mean SNOMED CT concepts are loaded. `CodeSystem/$lookup` for a code that was
never imported returns HTTP 404 and `Not found`.

The seed does not include LOINC (`http://loinc.org`), RxNorm (`http://www.nlm.nih.gov/research/umls/rxnorm`),
ICD-10-CM (`http://hl7.org/fhir/sid/icd-10-cm`), CPT (`http://www.ama-assn.org/go/cpt`), or CVX
(`http://hl7.org/fhir/sid/cvx`). Licensed dictionaries such as MedDRA and WHO Drug are not in the seed either.
Import only a distribution your organization is licensed to load.

Creating a project does not attach a UMLS project. On Medplum-hosted, ICD-10, RxNorm, LOINC, and SNOMED can be
shared by [project linking](/docs/access/projects#common-use-cases). A super admin adds the link. CPT is not in
that list. The [August 2026 terminology update](/blog/terminology-2026) describes the hosted UMLS 2026AA import.
Two subset canonicals from that import are:

- `http://www.nlm.nih.gov/research/umls/rxnorm/vs/prescribable`
- `http://hl7.org/fhir/sid/icd-10-cm/vs/et`

The `/vs` canonicals on [Common Terminologies](/docs/terminology/common-terminologies) are names to bind after a
load. Seed does not create them. `ValueSet/$expand?url=http://loinc.org/vs` on a fresh project returns
`ValueSet http://loinc.org/vs not found`.

Do not use `CodeSystem/$validate-code` as the presence check. When no `CodeSystem` exists for the URL, that
operation returns `result: true` if `coding.system` matches the URL, and it does not inspect `code`.

## Check a system

```
GET [base]/CodeSystem?url=http://www.nlm.nih.gov/research/umls/rxnorm
```

| Search result                                                      | What it means                                                                                                                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No `entry`                                                         | The system is not in this project or a linked project. `$expand` of a ValueSet that includes it, and `$lookup` by that URL, both return `CodeSystem <url> not found` (HTTP 400). |
| `content` is `not-present`, and `$lookup` returns 404              | The resource exists and the concepts are not loaded. This is the seeded SNOMED CT shell.                                                                        |
| `content` is `complete` or `fragment`, and `$lookup` returns a display | Concepts from that resource are loaded. A `CodeSystem` in the current project with the same `url` and `content: complete` is selected over the seeded shell. |

`[base]` is the FHIR base URL, for example `https://api.medplum.com/fhir/R4` or `http://localhost:8103/fhir/R4`.

```
POST [base]/CodeSystem/$lookup
Content-Type: application/fhir+json
```

```json
{
  "resourceType": "Parameters",
  "parameter": [
    { "name": "system", "valueUri": "http://snomed.info/sct" },
    { "name": "code", "valueCode": "386661006" }
  ]
}
```

`386661006` is the published SNOMED CT concept id for Fever. Against the seeded shell, that call returns 404
`Not found`. It returns a display only after concepts have been imported into the `CodeSystem` that lookup selects.

## Small code list

A protocol-specific list belongs on a `CodeSystem` with `content` set to `complete`, plus a `ValueSet` that
includes that system. Forms and `$expand` bind to the ValueSet.

This transaction is synthetic. The codes are not RxNorm, SNOMED CT, LOINC, CPT, MedDRA, or WHO Drug.
Download [example-study-drug-terminology.json](/examples/example-study-drug-terminology.json) and post it:

```
POST [base]
Content-Type: application/fhir+json
```

The bundle creates:

- `CodeSystem` `http://example.com/fhir/CodeSystem/example-study-drug`, with `content: complete` and three concepts
- `ValueSet` `http://example.com/fhir/ValueSet/example-study-drug`, including that system

Each entry sets `ifNoneExist` on `url`, so posting the bundle again does not create a second copy when that
canonical is already in the project.

Confirm the load:

```
GET [base]/ValueSet/$expand?url=http://example.com/fhir/ValueSet/example-study-drug
```

URL-encode the `url` query value if the client does not. The expansion contains `EX-100`, `EX-200`, and `EX-300`.
`CodeSystem/$lookup` with system `http://example.com/fhir/CodeSystem/example-study-drug` and code `EX-100` returns
the display `Example compound A 10 mg tablet`.

Creating a `MedicationRequest` with that coding does not require the `CodeSystem`. Create and update do not
resolve `Coding.system`. The ValueSet is what a picker uses. See
[Medplum Terminology Services](/docs/terminology/medplum-terminology-services).

## Large code system

LOINC, RxNorm, SNOMED CT, and ICD-10-CM do not fit in one resource. Load them with
[`CodeSystem/$import`](/docs/api/fhir/operations/codesystem-import).

1. Create the `CodeSystem` in the project that should own it. Set `content` to `not-present`. Declare each
   `property` you will send (RxNorm term type `TTY` is one) and set `hierarchyMeaning` when you will send parent
   links. Leave `concept` empty.
2. `POST [base]/CodeSystem/$import` as a project admin or a super admin. A project admin can update a
   `CodeSystem` only in their own project (`403` `Forbidden` otherwise). A super admin can address a system in
   another project, including the seeded SNOMED shell. Prefer a
   [shared terminology project](/docs/access/projects#setting-up-a-shared-project) to writing the R4 seed.
3. Send concepts before properties or designations that refer to them. One `Parameters` resource can carry both:
   concepts are written first. A later call that names a missing code returns `Unknown code: <system url>|<code>`.
   A property name that is not declared on the `CodeSystem` returns `Unknown property: <name>`, unless that name
   is the `hierarchyMeaning` or `parent`. Each parameter list allows at most 1,000 entries.

`$import` does not create the `CodeSystem`. The `system` parameter must already resolve inside the caller's
project (or, for a super admin, in a visible project). Imported codes are stored in the terminology tables.
They do not show up on `CodeSystem.concept`.

```json
{
  "resourceType": "Parameters",
  "parameter": [
    {
      "name": "system",
      "valueUri": "http://example.com/fhir/CodeSystem/example-study-drug"
    },
    {
      "name": "concept",
      "valueCoding": { "code": "EX-400", "display": "Example compound D 5 mg capsule" }
    }
  ]
}
```

That call succeeds only when the example `CodeSystem` already exists. For a `content: complete` system created
from the sample bundle, prefer editing `concept` directly. Use `$import` when `content` is `not-present`.

After the load, do not bind a form to the entire code system. Filter it. See
[Filtering Large Code Systems](/docs/terminology/filtering-large-code-systems).

## Related

- [Local Codes](/docs/terminology/local-codes) for hierarchies that fit in one resource
- [Common Terminologies](/docs/terminology/common-terminologies) for system URLs
- [Projects](/docs/access/projects#project-linking) for a read-only terminology project shared across studies
