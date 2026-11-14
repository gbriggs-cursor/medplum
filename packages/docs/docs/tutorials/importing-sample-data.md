---
sidebar_position: 3
sidebar_label: Import Sample Data
---

# Import Sample Data

When starting development, it can be really useful to have some sample data to work with, and to test your application. This tutorial will walk you through importing sample FHIR data into your Medplum project to aid in building a realistic application.

:::tip[The Medplum App]

The Medplum app is an administrative console, where developers can view their Medplum data, audit resource changes, and configure project settings. Most Medplum users do not use the Medplum app for patient or physician workflows, but rather build customized experiences or build on Medplum's example applications.

Read more about the Medplum App [here](/docs/app)

:::

## Download JSON Files

Below are resources belonging to two patients. This is FHIR data constructed in accordance with the [USCDI Data Element](/docs/fhir-datastore/understanding-uscdi-dataclasses) standards. That means that the FHIR Resources provided are tagged with the right [CodableConcepts](/docs/fhir-basics#standardizing-data-codeable-concepts) and ontologies to match the interoperability requirements for an EHR in the US.

Download one or both of the following files:

| Data      | Download                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| Patient 1 | [Patient 1 Download](https://drive.google.com/file/d/1bEyKSy55k9ZrrDLBj1NkHyL4ou75_eRX/view?usp=sharing)    |
| Patient 2 | [Patient 2 Download](https://drive.google.com/file/d/1Zj3EWeWj7-wP52CAZjSqzwCxZMlx6QZM/view?usp=share_link) |

## Batch Upload Tool

Log into the project that should own the patients, then open the batch page and upload the files from the previous section.

- Hosted app: [batch create](https://app.medplum.com/batch). Confirm on the [Patient](https://app.medplum.com/Patient) page of that same project.
- Local app from this repo (`npm run dev` in `packages/app`, or the full-stack Compose file): [http://localhost:3000/batch](http://localhost:3000/batch). The API is [http://localhost:8103/](http://localhost:8103/). The seeded `admin@example.com` login is the Super Admin project, which has no patients until you upload them. See [Load synthetic test patients](/docs/self-hosting/synthetic-test-patients).

:::caution[Note]

**Do not upload files twice.** If you aren't sure whether the upload worked, open the Patient list in the project you were signed in to. A patient on that list means the upload wrote into that project. A patient in a different project will not appear here.

:::

![Batch create tool](/img/tutorials/batch-create.png)

The batch upload tool is a lightweight wrapper around the [batch/transaction api](https://www.hl7.org/fhir/http.html#transaction) and here is the documentation on how to [upload a batch using the SDK](/docs/sdk/core.medplumclient.executebatch).

## Generating More Sample Data with Synthea

The two patients above are handy for a quick start, but when you need a larger, more varied population, [Synthea](https://github.com/synthetichealth/synthea) is a great source of synthetic FHIR data. Synthea generates realistic, statistically-modeled patient histories that you can load into Medplum the same way you loaded the files above.

You can either download pre-generated [Synthea sample bundles](https://github.com/synthetichealth/synthea-sample-data/tree/master/downloads), or run Synthea yourself to generate a custom-sized population. For a step-by-step walkthrough of generating bundles, see the [Getting Started with Synthetic FHIR Data](/blog/2021/12/13/synthea) guide. Import them with the batch page for the server you are using: [https://app.medplum.com/batch](https://app.medplum.com/batch) on the hosted app, or [http://localhost:3000/batch](http://localhost:3000/batch) on the default local app.
