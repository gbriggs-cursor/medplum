# Prompt: L3 Traced build (device evidence)

Variables: `{prospect}` (default `Acme Cardio`), `{seed}` (default `20261104`), `{requirement_id}` (default `REQ-001`).

```
Requirement {requirement_id}: Medplum ingests and displays {prospect} patch v2 blood-pressure panels
and ECG summaries.

Work in demos/device-evidence/run/.
1. Generate a synthetic FHIR bundle with seed {seed}: 20 Patients, 20 Device resources for the
   {prospect} patch v2 (each with a DeviceDefinition), Observation blood-pressure panels, and ECG as
   Observation with component and valueSampledData. Tag every resource synthetic and HTEST.
2. Write manifest.json with every resource id, the seed, and the counts.
3. Add an ECG summary parser and Vitest tests that load the bundle with MockClient, covering Foo
   Medical vitals and the parser. Run them with coverage and fix failures in source.
4. Use the evidence-package skill to write evidence/EVIDENCE.md. Put {requirement_id} in the
   Requirement line and the trace table.
Open a draft PR against the default branch with the trace table in the body.
```
