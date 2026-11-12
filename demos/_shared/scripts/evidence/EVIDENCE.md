Requirement: Every demo story card is valid, the catalog is rebuilt from the cards, and nothing under demos/ or .cursor/ pins a branch.
Change: Added demos/catalog.yaml, demos/_shared/scripts/catalog.mjs, demos/_shared/labels.md, demos/README.md, and five story folders (net-new-feature, ticket-to-pr, rebrand, docs-from-questions, device-evidence).
Test: node demos/_shared/scripts/catalog.mjs --check (from the repository root)
Result: pass (5 passed, 0 failed)
Synthetic: true
Commit: cc425afb19bea8c10491fbb2870d8fafefd1e51c

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| Every story card is valid and the catalog matches the cards | node demos/_shared/scripts/catalog.mjs --check | node demos/_shared/scripts/catalog.mjs --check, 2026-11-12 | pass |

## Test log

```
ok  L3   device-evidence        ls       stage=03
ok  G4   docs-from-questions    generic  stage=generic
ok  G1   net-new-feature        generic  stage=generic
ok  G3   rebrand                generic  stage=generic
ok  G2   ticket-to-pr           generic  stage=generic
PASS: 5 stories valid (5 passed, 0 failed), catalog.yaml up to date, no branch pinning
EXIT:0
```
