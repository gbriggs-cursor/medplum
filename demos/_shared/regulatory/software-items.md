# Software items and IEC 62304 safety classes (synthetic)

Synthetic regulatory seed for the fictional Acme Cardio Companion app built on Medplum. Not a real device file. Synthetic: true.

Bugbot reads this table (`.cursor/BUGBOT.md`, section "IEC 62304"). A changed file takes the highest class of any row whose path pattern matches it. A file that matches no row is class A.

| Item | Path pattern | Class | Why |
| --- | --- | --- | --- |
| SI-01 Vitals capture | `packages/react/src/PatientSummary/Vitals.tsx`, `packages/react/src/PatientSummary/Vitals.utils.ts` | C | A wrong blood-pressure value shown to a clinician can contribute to serious injury (RISK-001). |
| SI-02 ECG summary parser | `demos/**/ecg-summary-parser.ts` | C | A missed arrhythmia flag can contribute to serious injury (RISK-002). |
| SI-03 Patient vitals display | `examples/foomedical/src/pages/health-record/Vitals.tsx`, `examples/foomedical/src/pages/health-record/Measurement.tsx`, `examples/foomedical/src/pages/health-record/Measurement.data.ts` | B | A patient misreads a trend; a clinician reviews readings separately (RISK-003). |
| SI-04 Search matching | `packages/core/src/search/**` | B | A filtered search that drops readings hides data from review (RISK-004). |
| SI-99 Everything else | any other path | A | No contribution to a hazardous situation. |
