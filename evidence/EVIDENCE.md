Requirement: Clinicians see how fresh a patient record is from a last-updated badge on the patient summary header.
Change: packages/react/src/PatientSummary/PatientSummary.stories.tsx, packages/react/src/PatientSummary/PatientSummary.test.tsx, packages/react/src/PatientSummary/PatientSummary.tsx, packages/react/src/PatientSummary/PatientSummary.utils.test.ts, packages/react/src/PatientSummary/PatientSummary.utils.ts — last-updated badge from Patient.meta.lastUpdated.
Test: cd packages/react && npx vitest run src/PatientSummary/PatientSummary.utils.test.ts src/PatientSummary/PatientSummary.test.tsx --reporter=verbose
Result: pass (94 passed, 0 failed)
Synthetic: true
Commit: 7fdda3531f528b2fd92dbe45a27715d97af5f565

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| A past Patient.meta.lastUpdated shows a relative last-updated badge on the summary header. | Shows a last-updated badge from meta.lastUpdated | cd packages/react && npx vitest run src/PatientSummary/PatientSummary.utils.test.ts src/PatientSummary/PatientSummary.test.tsx --reporter=verbose, 2026-11-15 | pass |
| A missing Patient.meta.lastUpdated hides the badge. | Hides the last-updated badge when meta.lastUpdated is missing | cd packages/react && npx vitest run src/PatientSummary/PatientSummary.utils.test.ts src/PatientSummary/PatientSummary.test.tsx --reporter=verbose, 2026-11-15 | pass |
| A future Patient.meta.lastUpdated shows just now. | Shows just now when meta.lastUpdated is in the future | cd packages/react && npx vitest run src/PatientSummary/PatientSummary.utils.test.ts src/PatientSummary/PatientSummary.test.tsx --reporter=verbose, 2026-11-15 | pass |
| An unparseable Patient.meta.lastUpdated hides the badge. | Hides the last-updated badge when meta.lastUpdated is not a timestamp | cd packages/react && npx vitest run src/PatientSummary/PatientSummary.utils.test.ts src/PatientSummary/PatientSummary.test.tsx --reporter=verbose, 2026-11-15 | pass |

## Test log

```text

 RUN  v4.1.12 /agent/repos/medplum/packages/react

 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > formatPatientLastUpdated > formats undefined as undefined 1ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > formatPatientLastUpdated > formats not-a-date as undefined 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > formatPatientLastUpdated > formats 2026-06-15T13:00:00.000Z as just now 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > formatPatientLastUpdated > formats 2026-06-15T11:59:01.000Z as just now 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > formatPatientLastUpdated > formats 2026-06-15T11:59:00.000Z as 1 minute ago 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > formatPatientLastUpdated > formats 2026-06-15T11:58:00.000Z as 2 minutes ago 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > formatPatientLastUpdated > formats 2026-06-15T11:00:00.000Z as 1 hour ago 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > formatPatientLastUpdated > formats 2026-06-14T12:00:00.000Z as 1 day ago 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > formatPatientLastUpdated > formats 2026-05-16T12:00:00.000Z as 1 month ago 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > formatPatientLastUpdated > formats 2025-06-15T12:00:00.000Z as 1 year ago 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > formatPatientLastUpdated > formats 2024-06-15T12:00:00.000Z as 2 years ago 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > formatStatusLabel > capitalizes and removes hyphens 1ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > isEnteredInError > detects entered-in-error via status 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > isEnteredInError > detects entered-in-error via lifecycleStatus (Goal) 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > isEnteredInError > detects entered-in-error via verificationStatus (Condition/Allergy) 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getGenderIdentity > should return gender identity display when extension exists 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getGenderIdentity > should return undefined when gender identity extension does not exist 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getGenderIdentity > should return undefined when patient has no extensions 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getGenderIdentity > should return undefined when valueCodeableConcept is missing 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getGenderIdentity > should return undefined when coding array is empty 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getBirthSex > should return birth sex value when extension exists 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getBirthSex > should return undefined when birth sex extension does not exist 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getBirthSex > should return undefined when patient has no extensions 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getBirthSex > should return undefined when valueCode is missing 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getRace > should return race display when extension exists with ombCategory 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getRace > should return undefined when race extension does not exist 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getRace > should return undefined when ombCategory sub-extension is missing 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getRace > should return undefined when valueCoding is missing 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getEthnicity > should return ethnicity display when extension exists with ombCategory 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getEthnicity > should return undefined when ethnicity extension does not exist 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getEthnicity > should return undefined when ombCategory sub-extension is missing 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getGeneralPractitioner > should return general practitioner display when it exists 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getGeneralPractitioner > should return undefined when generalPractitioner array is empty 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getGeneralPractitioner > should return undefined when generalPractitioner is not present 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > getGeneralPractitioner > should return undefined when first practitioner has no display 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > Integration tests with multiple extensions > should handle patient with all extensions present 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > Integration tests with multiple extensions > should handle patient with mixed extension presence 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > Patient Gender Display > should format patient gender display with all fields present 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > Patient Gender Display > should format patient gender display with only gender present 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > Patient Gender Display > should format patient gender display with gender and gender identity 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > Patient Gender Display > should format patient gender display with gender and birth sex 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > Patient Gender Display > should return empty string for patient with no gender information 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > Patient Race Ethnicity Display > should format patient race ethnicity display with only race present 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > Patient Race Ethnicity Display > should format patient race ethnicity display with only ethnicity present 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > Patient Race Ethnicity Display > should format patient race ethnicity display with both race and ethnicity present 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > Patient Race Ethnicity Display > should return empty string for patient with no race or ethnicity information 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > Preferred Language > should return preferred language display when preferred communication exists 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > Preferred Language > should return first language display when no preferred communication exists 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.utils.test.ts > Patient Utilities > Preferred Language > should return undefined when no communication exists 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders 241ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Links the header when headerLink is provided 168ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders a static header when headerLink is omitted 101ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Shows a last-updated badge from meta.lastUpdated 11ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Hides the last-updated badge when meta.lastUpdated is missing 11ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Shows just now when meta.lastUpdated is in the future 8ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Hides the last-updated badge when meta.lastUpdated is not a timestamp 8ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Reflects patient updates made through the client 156ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Ignores updates to other patients 97ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Shows skeleton while loading, then hides it 86ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders skeleton 7ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders with gender missing 61ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders without appointment and encounter links 60ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders with subset of built-in sections 17ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders with custom section using render function 15ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders with summaryResourceListSection helper 20ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders with overridden built-in section title metadata 15ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders section without searches (self-contained data) 11ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders with vitals section showing vital signs 17ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders summaryResourceListSection with seeded Condition resources 15ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders summaryResourceListSection with filter option 14ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders summaryResourceListSection with getDisplayString, getStatus, and getSecondaryText 21ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders summaryResourceListSection with sort option 17ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders summaryResourceListSection empty state with (none) 13ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > getDefaultSections returns all built-in sections 1ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > createLabsSection creates a labs section config 0ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders with patient Reference 84ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders demographics section 28ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders insurance section 11ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders problem list section 25ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders labs section 17ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders sexual orientation section 13ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders smoking status section 13ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders with multiple sections sharing the same search (deduplication) 28ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders with search using additional query params (Record type) 9ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders with all default sections (full integration) 73ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Built-in section configs have correct keys and titles 1ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders with empty sections array 7ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders section with string query type 7ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders section with URLSearchParams query type 7ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders section with array query type 7ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders null when patient cannot be resolved 20ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders with onClickResource callback 6ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders with onRequestLabs callback (default sections) 57ms
 ✓ |@medplum/react| src/PatientSummary/PatientSummary.test.tsx > PatientSummary > Renders section with multiple searches 9ms

 Test Files  2 passed (2)
      Tests  94 passed (94)
   Start at  17:14:17
   Duration  4.43s (transform 1.47s, setup 2.36s, import 1.06s, tests 1.63s, environment 969ms)

EXIT:0
```
