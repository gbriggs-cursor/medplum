Requirement: A confirmed voice support intake becomes a QuestionnaireResponse that passes server $validate on the synthetic patient's chart, and the GIO ticket carries no caller identity.
Change: Added demos/speech-to-fhir (extractor, Questionnaire seed, QuestionnaireResponse mapper, Medplum write, reset), demos/\_shared/fhir/tags.mjs, --medplum on the support-voice server, digit requirement for labelled IDs in the redactor.
Test: cd demos/speech-to-fhir && npm test && ./reset.sh && node scripts/run.mjs --transcript pairing|appointments-blank|airport (local Medplum server on :8103)
Result: pass (6 unit tests, 3 of 3 transcripts written with $validate clean and no identity in the ticket, support-voice 11 tests and 14/14 eval)
Synthetic: true
Commit: e2323e9391dc9433c5b2a18699b46e3718e09af6

| Requirement                                      | Test                                    | Run                      | Result |
| ------------------------------------------------ | --------------------------------------- | ------------------------ | ------ |
| Transcript fields extracted, missing not guessed | test/extract.test.mjs                   | 2026-11-12, test-log.txt | pass   |
| Response passes $validate and is on the chart    | scripts/run.mjs against local Medplum   | 2026-11-12, test-log.txt | pass   |
| GIO ticket has no name, DOB or callback          | scripts/run.mjs leak check              | 2026-11-12, test-log.txt | pass   |
| Reset is idempotent                              | ./reset.sh twice                        | 2026-11-12, test-log.txt | pass   |

Full output: `test-log.txt`.
