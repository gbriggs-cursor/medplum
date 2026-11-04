# Format sample

Shape only. This is not a recorded run. Replace every field from the demo in front of you: its requirement sentence, its test command, and its result.

Inputs for this sample:

- Requirement sentence: A search for synthetic slots on 2026-11-04 returns the three fabricated slots.
- Test command: `npm test --workspace @example/slots`
- Result: pass (1 passed, 0 failed)

`evidence/EVIDENCE.md`:

````markdown
Requirement: A search for synthetic slots on 2026-11-04 returns the three fabricated slots.
Change: examples/slots — date filter on the synthetic slot search.
Test: npm test --workspace @example/slots
Result: pass (1 passed, 0 failed)
Synthetic: true
Commit: 0123456789abcdef0123456789abcdef01234567

| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| A search for synthetic slots on 2026-11-04 returns the three fabricated slots. | returns the three fabricated slots | npm test --workspace @example/slots, 2026-11-04 | pass |

## Test log

```text
 ✓ src/slots.test.ts > returns the three fabricated slots 4ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
EXIT:0
```
````

`evidence/test-log.txt` is that same log, without the fence.
