# Evidence v2

Every story that produces evidence writes up to three files in one `evidence/` folder. The names are fixed: batch tools (L14) and the approval gate (L6) look for them.

| File | Written by | Required |
| --- | --- | --- |
| `EVIDENCE.md` | the story (or the `evidence-package` skill) | always |
| `trace.json` | the story's test run | when the story traces tests to requirements |
| `approval.json` | the approval step (L6) | only after a human decision |

All three are synthetic-only. A story stops instead of writing them when its data is not synthetic.

## `EVIDENCE.md`

The six lines from `demos/_shared/skills/evidence-package/SKILL.md`, in that order, then optional v2 lines:

```
Requirement: <sentence>
Change: <what changed>
Test: <command>
Result: <pass or fail> (<n> passed, <m> failed)
Synthetic: true
Commit: <full sha>
Trace: <REQ-xxx, RISK-xxx, ...>
Approval: <pending | approved by <name> (<role>) at <ISO time> | rejected by ...>
```

`Trace` is required for class B and C changes (`.cursor/BUGBOT.md`, section "IEC 62304"). `Approval` is written by the approval step; a story that has no gate leaves it out. After a blank line come the requirement-to-test-to-run-to-result table and `## Test log`, as in v1.

## `trace.json`

```json
{
  "schema": "evidence-v2/trace",
  "version": 2,
  "story": "<story id>",
  "synthetic": true,
  "commit": "<full sha of the commit under test>",
  "runs": [
    {
      "id": "run-1",
      "label": "<why this run happened>",
      "command": "<test command>",
      "date": "<ISO 8601>",
      "tree": "<repository | remediation workspace>",
      "passed": 0,
      "failed": 0,
      "exit": 0
    }
  ],
  "rows": [
    { "req": "REQ-004", "risk": "RISK-003", "test": "<full test name>", "run": "run-1", "result": "pass", "commit": "<sha>" }
  ]
}
```

One row per traced test per run. `result` is `pass` or `fail`. Readers take the last run as current.

## `approval.json`

```json
{
  "schema": "evidence-v2/approval",
  "version": 2,
  "story": "<story id>",
  "synthetic": true,
  "commit": "<full sha the decision applies to>",
  "decision": "approved",
  "meaning": "<what the signature means, for example: design review passed for REQ-001>",
  "signer": { "name": "<name>", "role": "<role>" },
  "decided_at": "<ISO 8601>",
  "channel": "<grok-bot | cli>",
  "record": {
    "algorithm": "sha256",
    "files": { "EVIDENCE.md": "<hex>", "trace.json": "<hex>" },
    "digest": "<sha256 of the sorted file name:hash lines>"
  }
}
```

`decision` is `approved` or `rejected`. `record` binds the decision to the exact evidence bytes. Editing `EVIDENCE.md` or `trace.json` after approval breaks the digest. Approvals are never written back to Medplum.
