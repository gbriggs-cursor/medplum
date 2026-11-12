# P3 PHI-like pack

Invented patients and support notes that look real, for testing redaction and the PHI tripwire (L11, later L12). Nothing in this pack is real. It is generated from seed `20261112`.

| File            | Holds                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `patients.json` | FHIR transaction Bundle, 24 Patients with name, birth date, MRN, SSN, phone, email, address and one relative. Each has `ifNoneExist` on its P3 id.           |
| `notes.json`    | 50 free-text notes: 48 tied to a patient, plus 2 with no chart match (`expect: refuse`). Each planted identifier is listed with its type, offsets and value. |
| `generate.mjs`  | Rebuilds both files. `--check` fails if they drift from the seed.                                                                                            |

## Why it is safe to commit

- Every resource carries `https://medplum.com/fhir/CodeSystem/synthetic|synthetic` and `http://terminology.hl7.org/CodeSystem/v3-ActReason|HTEST` (the same tags as P1), plus `demo-story|p3-phi-like`.
- MRNs are `HTEST-MRN-#####`. Phones are `555-01xx` (reserved for fiction). SSNs start with 9, a range never issued. Emails use `example.com`, `example.org` or `example.net`. Towns are common place names paired with random streets and ZIPs.
- Names are random first + last pairs. About half the given names are outside the redactor's common-name list on purpose, so blind recall is not inflated.

## Planted identifier types

`NAME`, `DATE`, `MRN`, `SSN`, `PHONE`, `EMAIL`, `ADDRESS`, `CITY`, `ZIP`, `SERIAL`, `MEMBER_ID`, and one `ACCOUNT` (an unlabelled number the patterns do not know).

## Load into the local Medplum server (optional)

```bash
node demos/phi-tripwire/scripts/seed.mjs     # POST the transaction Bundle; safe to re-run
node demos/phi-tripwire/scripts/reset.mjs    # delete Patients tagged demo-story|p3-phi-like
```
