Requirement: A pasted note with synthetic PHI never reaches a GIO ticket with an identifier in it: it is redacted with chart context and screened twice, and it is refused when it cannot be cleaned or has no chart context.
Change: Added demos/phi-tripwire (tripwire, eval scorecard, CLI, seed, reset) and the P3 PHI-like pack in demos/\_shared/data-packs/p3-phi-like (generator, 24 patients, 50 notes); kept Prettier off the generated pack JSON.
Test: cd demos/phi-tripwire && npm test && npm run eval && node scripts/tripwire.mjs --note P3-N-001 | --note P3-N-003 --blind | --note P3-R-001
Result: pass (6 unit tests; eval 50 notes, 213 planted identifiers, 0 in allowed tickets, 2 refused as expected, 0 allowed without chart context, 0 KB false positives)
Synthetic: true
Commit: 3aaa892f8365e9d0dd21514931bc98434e0d3e45

| Requirement                                         | Test                                  | Run                      | Result                    |
| --------------------------------------------------- | ------------------------------------- | ------------------------ | ------------------------- |
| No identifier in an allowed ticket                  | scripts/eval.mjs                      | 2026-11-12, test-log.txt | pass (0 of 213)           |
| Notes with unknown identifiers are refused          | scripts/eval.mjs, P3-R-001, P3-R-002  | 2026-11-12, test-log.txt | pass (2 of 2 refused)     |
| Nothing written without chart context               | scripts/eval.mjs, test 6              | 2026-11-12, test-log.txt | pass                      |
| Raw notes are flagged by the screen                 | scripts/eval.mjs                      | 2026-11-12, test-log.txt | pass (50 of 50)           |
| P3 is deterministic and uses fictional ranges only  | test 1-3, generate.mjs --check        | 2026-11-12, test-log.txt | pass                      |
| Blind recall (reported, not gated)                  | scripts/eval.mjs                      | 2026-11-12, test-log.txt | 74.2% (cities, rare names) |

Full output: `test-log.txt`.
