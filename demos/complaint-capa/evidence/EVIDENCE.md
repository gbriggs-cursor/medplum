Requirement: L16 and L17 story cards are valid, stage post-market is accepted, demos/catalog.yaml lists both cards, and nothing under demos/ or .cursor/ pins a branch.
Change: Added demos/complaint-capa/ (card, prompt, complaint fixture, fictional SOP, id register, reset), demos/audit-qa/ (card, prompt, hand-written trace index, reset), demos/_shared/skills/complaint-capa/SKILL.md, demos/_shared/skills/audit-qa/SKILL.md, allowed stage post-market in demos/_shared/scripts/catalog.mjs and demos/_shared/labels.md, noted that stage in demos/README.md, and regenerated demos/catalog.yaml.
Test: node demos/_shared/scripts/catalog.mjs --check (from the repository root)
Result: pass (7 passed, 0 failed)
Synthetic: true
Commit: 9177471050dfff31d8406fcb881cb9fe06b06ebc

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| L16 and L17 story cards are valid and the catalog matches the cards | node demos/_shared/scripts/catalog.mjs --check | node demos/_shared/scripts/catalog.mjs --check, 2026-11-12 | pass |

## Test log

```
ok  L17  audit-qa               ls       stage=07
ok  L16  complaint-capa         ls       stage=post-market
ok  L3   device-evidence        ls       stage=03
ok  G4   docs-from-questions    generic  stage=generic
ok  G1   net-new-feature        generic  stage=generic
ok  G3   rebrand                generic  stage=generic
ok  G2   ticket-to-pr           generic  stage=generic
PASS: 7 stories valid (7 passed, 0 failed), catalog.yaml up to date, no branch pinning
EXIT:0
```
