# L18 Review ladder

**Setup line:** "Here are two pull requests a busy {prospect} engineer could open on a Friday. One breaks process rules, one breaks security rules. Neither reviewer has seen them."

**Wow line:** "Bugbot caught the missing trace, the unlisted dependency, the bad requirement ID, the blank result, and an off-by-one that drops day 0. Security Reviewer caught the PHI log line, the hardcoded secret, the injectable search, and the AccessPolicy bypass."

## Seeds

Seeds live only in `seeds/*.patch`. They are never applied to the default branch or to this harness. `seed.sh` applies them in a temporary worktree and pushes them to `demo/run-<YYYYMMDD>/*` branches.

### `seeds/bugbot.patch`

| # | Seeded defect | Where | Expected |
| --- | --- | --- | --- |
| 1 | Class C edit with no `Trace:` line | `packages/react/src/PatientSummary/Vitals.utils.ts`, evidence in `packages/react/src/PatientSummary/evidence/EVIDENCE.md` | high |
| 2 | New dependency `dayjs` in `packages/react/package.json` with no `SOUP.md` change | `packages/react/package.json` | high |
| 3 | `Trace: REQ-099, RISK-003`, and REQ-099 is not in the seed | `examples/foomedical/src/pages/health-record/evidence/EVIDENCE.md` (class B file) | medium (see note) |
| 4 | `Result:` left blank | `packages/react/src/PatientSummary/evidence/EVIDENCE.md` | high |
| 5 | 30-day device-observation filter uses `date=gt<day 0>`, so day 0 readings drop (REQ-004 needs `ge`) | `getDeviceObservationSearch` in `examples/foomedical/src/pages/health-record/Measurement.data.ts` | logic finding |

Note on 3: `.cursor/BUGBOT.md` grades an unknown trace ID at the pull request's class. Finding 1 makes this PR class C, so Bugbot may report REQ-099 as high rather than medium.

### `seeds/security.patch`

| # | Seeded defect | Where |
| --- | --- | --- |
| 1 | `console.log` of patient name and MRN | `packages/react/src/PatientDevices/PatientDevices.tsx` |
| 2 | Hardcoded fake secret `DEMO-NOT-A-REAL-SECRET` in source | `packages/react/src/PatientDevices/deviceSync.ts` |
| 3 | Device search built by concatenating the unescaped `:id` route param | `buildDeviceSearch` in `packages/react/src/PatientDevices/PatientDevices.utils.ts` |
| 4 | Helper that skips AccessPolicy with the global system (super-admin) repository | `listPatientDevices` in `packages/server/src/fhir/patientdevices.ts` |

The security seed carries a complete `evidence/EVIDENCE.md` for its class A files, so Bugbot has nothing to flag there and the four findings are Security Reviewer's. It is a stub, not the Devices feature.

Both seeds pass lint, Prettier, and `tsc`, and their tests pass, so CI noise does not hide the findings. `EVIDENCE.md` files carry `Commit: @SEED_COMMIT@`; `seed.sh` swaps in the seed commit SHA.

## Run it

```
bash demos/review-ladder/seed.sh --self-test                            # OFFLINE (no key): proves seeds apply, nothing pushed
bash demos/review-ladder/seed.sh --baseline <ref> --dry-run             # local apply, prints the push and gh commands
bash demos/review-ladder/seed.sh                                        # live: needs the demo-baseline-v1 tag
bash demos/review-ladder/seed.sh --close --run <YYYYMMDD> [--dry-run]   # close the run's PRs unmerged, delete its branches
```

Seed mode pushes `demo/run-<YYYYMMDD>/baseline` (the PR base, so each diff shows only its seed), `demo/run-<YYYYMMDD>/b-seed-bugbot`, and `demo/run-<YYYYMMDD>/b-seed-security`, then opens draft PRs titled `[DEMO – do not merge] ...` with label `demo-do-not-merge` (created if missing). The default baseline is the tag `demo-baseline-v1`. Without it, the script stops and says how to create it.

`--close` closes open PRs whose head is under `demo/run-<YYYYMMDD>/` and deletes that run's branches. It never touches the recorded takes #4, #9, #10, #11, #14, #16, and #20, or any branch they use.

## Live mode

1. Gio tags the merged harness commit `demo-baseline-v1`.
2. Bugbot is enabled on `gbriggs-cursor/medplum`, and the Security Reviewer automation is on. If either skips draft PRs, mark the PR ready for review on stage, then back to draft.
3. Run `bash demos/review-ladder/seed.sh` and open the two PR links.

## Fallback

None recorded yet. Run the self-test and walk the seed tables above.
