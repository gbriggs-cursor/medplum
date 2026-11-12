# Prompt: G1 Net-new feature

Variables: `{prospect}` (default `Foo Medical`), `{feature_idea}` (default in `story.yaml`).

## 1. Plan (Plan mode)

```
{prospect} wants {feature_idea}.
Check whether this view already exists in packages/app or @medplum/react. Plan it as a reusable
@medplum/react component plus a patient-only tab in packages/app. Use FHIR search and existing
Mantine / @medplum/react components. No new backend and no new chart library.
```

## 2. Build

```
Execute the plan. Put synthetic Device and Observation fixtures under demos/_shared/data/ and tag
every resource synthetic. Add Vitest tests with MockClient. Run the tests for the packages you
changed and fix failures in source. Use the evidence-package skill to write evidence/EVIDENCE.md.
Open a draft PR against the default branch and summarize risks.
```
