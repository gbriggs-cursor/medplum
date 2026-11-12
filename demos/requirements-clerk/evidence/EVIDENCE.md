Requirement: L1 and L2 story cards are valid, demos/catalog.yaml lists them, and nothing under demos/ or .cursor/ pins a branch.
Change: Added demos/requirements-clerk/ (card, prompt, notes, id register, reset), demos/risk-teammate/ (card, prompt, intended use, hazard log, unassessed requirement, reset), demos/_shared/skills/requirements-clerk/SKILL.md, demos/_shared/skills/risk-teammate/SKILL.md, demos/_shared/data-packs/p5-regulatory/README.md, and regenerated demos/catalog.yaml.
Test: node demos/_shared/scripts/catalog.mjs --check (from the repository root)
Result: pass (7 passed, 0 failed)
Synthetic: true
Commit: 8a21ecc4390a740a8361e03c49e9ab8ca89d80e6

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| L1 and L2 story cards are valid and the catalog matches the cards | node demos/_shared/scripts/catalog.mjs --check | node demos/_shared/scripts/catalog.mjs --check, 2026-11-12 | pass |

## Test log

```
ok  L3   device-evidence        ls       stage=03
ok  G4   docs-from-questions    generic  stage=generic
ok  G1   net-new-feature        generic  stage=generic
ok  G3   rebrand                generic  stage=generic
ok  L1   requirements-clerk     ls       stage=01
ok  L2   risk-teammate          ls       stage=02
ok  G2   ticket-to-pr           generic  stage=generic
PASS: 7 stories valid (7 passed, 0 failed), catalog.yaml up to date, no branch pinning
EXIT:0
```
