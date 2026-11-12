Requirement: Bugbot applies IEC 62304 rules (safety class, trace ID, SOUP list) using a regulatory seed whose IDs are internally consistent.
Change: Extended .cursor/BUGBOT.md with an IEC 62304 section; added demos/_shared/regulatory/ (software-items.md, requirements.md, hazards.md, SOUP.md, check.mjs) and the demos/bugbot-62304 story card.
Test: node demos/_shared/regulatory/check.mjs (from the repository root)
Result: pass (42 passed, 0 failed)
Synthetic: true
Commit: edc0bbcd13c68e21de3b4d4e5de78193b0190f8a

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| Every requirement, risk, and software item referenced in the seed exists and has a valid class or ID | node demos/_shared/regulatory/check.mjs | node demos/_shared/regulatory/check.mjs, 2026-11-12 | pass |

## Test log

```
ok   SI-01 has class A, B, or C
ok   SI-02 has class A, B, or C
ok   SI-03 has class A, B, or C
ok   SI-04 has class A, B, or C
ok   SI-99 has class A, B, or C
ok   REQ-001 has a 3-digit ID
ok   REQ-001 items exist
ok   REQ-001 risks exist
ok   REQ-002 has a 3-digit ID
ok   REQ-002 items exist
ok   REQ-002 risks exist
ok   REQ-003 has a 3-digit ID
ok   REQ-003 items exist
ok   REQ-003 risks exist
ok   REQ-004 has a 3-digit ID
ok   REQ-004 items exist
ok   REQ-004 risks exist
ok   REQ-005 has a 3-digit ID
ok   REQ-005 items exist
ok   REQ-005 risks exist
ok   REQ-006 has a 3-digit ID
ok   REQ-006 items exist
ok   REQ-006 risks exist
ok   RISK-001 has a 3-digit ID
ok   RISK-001 controls exist
ok   RISK-002 has a 3-digit ID
ok   RISK-002 controls exist
ok   RISK-003 has a 3-digit ID
ok   RISK-003 controls exist
ok   RISK-004 has a 3-digit ID
ok   RISK-004 controls exist
ok   SOUP.md item SI-01 exists
ok   SOUP.md item SI-02 exists
ok   SOUP.md item SI-03 exists
ok   SOUP.md item SI-04 exists
ok   SOUP.md item SI-01 exists
ok   SOUP.md item SI-02 exists
ok   SOUP.md item SI-03 exists
ok   SOUP.md item SI-01 exists
ok   SOUP.md item SI-03 exists
ok   SOUP.md item SI-01 exists
ok   SOUP.md item SI-03 exists
PASS: 42 passed, 0 failed
EXIT:0
```
