# SOUP list (synthetic)

Software of unknown provenance used by class B and C items of the fictional Acme Cardio Companion app. Synthetic: true.

Bugbot requires this file to change when a pull request adds, removes, or re-versions a runtime dependency of a package that holds a class B or C item (`packages/react`, `packages/core`, `examples/foomedical`, or a story under `demos/`).

| Package | Version | Used by | Purpose | Known anomalies reviewed |
| --- | --- | --- | --- | --- |
| `@medplum/core` | workspace | SI-01, SI-02, SI-03, SI-04 | FHIR types, search matching | yes |
| `@medplum/fhirtypes` | workspace | SI-01, SI-02, SI-03 | FHIR R4 type definitions | yes |
| `react` | per root `package-lock.json` | SI-01, SI-03 | UI rendering | yes |
| `@mantine/core` | per root `package-lock.json` | SI-01, SI-03 | UI components | yes |
