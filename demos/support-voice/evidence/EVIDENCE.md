Requirement: Foo Medical voice support intake is confirmed by the caller before any write, triaged against the Foo Medical + Medplum docs KB, and reaches GIO only after redaction, with support labels and never automation labels.
Change: Added demos/support-voice (intake server, KB, triage, @grok/agent-sdk triage agent, 14 eval cases), demos/\_shared/phi/redact.mjs, intake labels and post-market/floor stages in the catalog checker.
Test: cd demos/support-voice && npm test && npm run eval && npm run demo:verify -- --kb-gap (plus --bug, --answered, --urgent)
Result: pass (10 unit tests, 14/14 offline eval cases, 4 flows x 7/7 checks, catalog 6 passed 0 failed)
Synthetic: true
Commit: 151e6d459d822b0484143bcf0778440001ff4f31

| Requirement                                        | Test                                     | Run                        | Result                  |
| -------------------------------------------------- | ---------------------------------------- | -------------------------- | ----------------------- |
| Nothing is written before the caller confirms      | test/intake.test.mjs, scripts/verify.mjs | 2026-11-12, test-log.txt   | pass                    |
| No caller identity in the GIO ticket               | test/jira.test.mjs, scripts/eval.mjs     | 2026-11-12, test-log.txt   | pass                    |
| GIO labels include support, never automatable      | test/jira.test.mjs, catalog.mjs --check  | 2026-11-12, test-log.txt   | pass                    |
| Triage category matches 14 synthetic intakes       | scripts/eval.mjs (deterministic)         | 2026-11-12, test-log.txt   | pass (14/14)            |
| Model triage matches the same 14 intakes           | agents/triage evals (@grok/agent-sdk)    | not run: no CURSOR_API_KEY | blocked (not a failure) |

Full output: `test-log.txt`. Screenshots of the browser flow were attached to the pull request, not committed.
