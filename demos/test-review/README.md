# L19 Test & Review: Story A

**Setup line:** "{prospect} wrote four acceptance criteria for a Devices tab. Let's have an agent build it and then prove every criterion on screen, not in a unit test."

**Wow line:** "Each REQ line has a screenshot and a pass row in EVIDENCE.md, and the day 0 reading is on screen, the one a `gt` filter would have dropped."

## Seed

| Path | What |
| --- | --- |
| `prd-patient-devices.md` | REQ-DEV-01 to REQ-DEV-04 and RISK-DEV-01 to RISK-DEV-03 |
| `../_shared/data/taylor-demo-bp-cuff.json` | Taylor Demo, one home BP cuff, 12 readings (day 0 to day 30, latest 117/75), tagged synthetic + HTEST |
| `context/` | Project Context: `architecture.md`, `how-to-test.md`, `evidence.md`, `personas.md`, `contracts/` |
| `../../.cursor/skills/uat-from-acceptance-criteria/SKILL.md` | One computer-use check per REQ line, appended with `evidence-package` |

The Devices feature is not in this repository. PR #10 is a recorded take and stays unmerged.

## Run it (default: OFFLINE (no key))

```
node demos/test-review/offline.mjs
```

Checks the PRD, the bundle, the context files, and the skill, and that the feature is absent.

Bundle dates end on 2026-11-17. To rehearse on another day:

```
node demos/test-review/offline.mjs --as-of <YYYY-MM-DD> --write /tmp/taylor-demo-bp-cuff.json
```

## Live mode

1. Start a cloud agent in environment `67842161` from the default branch, add `demos/test-review/context/` as Project Context, and paste `prompt.md`.
2. Show the draft PR, then the agent's UAT run and `evidence/EVIDENCE.md`.

## Fallback

PR #10 shows a finished Devices tab and its screenshots.
