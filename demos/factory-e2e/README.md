# L8 Factory end to end

**Setup line:** "One synthetic {prospect} requirement, seven factory stages, including the failure that loops back to build. Every number below is copied from a draft PR. Nothing in this walk was a live end-to-end take."

**Wow line:** "Verify goes red, the recorded rehearsal goes green, the approval card is on screen, and the room moves on without waiting."

Persona for the device stages is `{prospect}` (default Acme Cardio). Portal and practice beats on PR #27, PR #31, and PR #22 use Foo Medical. All data is synthetic. Environment `67842161`. Board is GIO. Nothing here writes to Jira, merges a PR, or comments on another PR.

These drafts are separate. They are not one traced requirement. Do not present a fixture hash, a self-test signer, or a seed file as a human approval or a filed ticket.

## How to run

1. `demos/factory-e2e/reset.sh` (safe to re-run; it only removes `demos/factory-e2e/run/`).
2. Walk the order below. Open each draft PR in the browser. Leave every PR a draft.
3. For each stop, say the recorded lines, then the not-run lines. Skip a live re-run when the PR says that run did not happen.
4. At L6, show the approval card and continue. The card never blocks the next stage.
5. A live agent, if one is started on a later day, starts from the default branch.

`answer-keys://factory-e2e/` is a placeholder. The private answer-key repo does not exist.

## Order

| Step | Stage | Open |
| --- | --- | --- |
| 0 | Catalog | [PR #17](https://github.com/gbriggs-cursor/medplum/pull/17) |
| 1 | 01 Requirement | L1 on [PR #25](https://github.com/gbriggs-cursor/medplum/pull/25) |
| 2 | 02 Risk | L2 on [PR #25](https://github.com/gbriggs-cursor/medplum/pull/25) |
| 3 | 03 Build | L3 card on [PR #17](https://github.com/gbriggs-cursor/medplum/pull/17); recorded output [PR #11](https://github.com/gbriggs-cursor/medplum/pull/11) |
| 4 | 04 Review | L4 on [PR #18](https://github.com/gbriggs-cursor/medplum/pull/18) |
| 5 | 05 Verify, then back to build | L5 on [PR #21](https://github.com/gbriggs-cursor/medplum/pull/21) |
| 6 | 06 Approve | L6 on [PR #23](https://github.com/gbriggs-cursor/medplum/pull/23) |
| 7 | 07 Release | L7 on [PR #34](https://github.com/gbriggs-cursor/medplum/pull/34) |
| 8 | Batch evidence (05–07) | L14 on [PR #30](https://github.com/gbriggs-cursor/medplum/pull/30) |
| 9 | Audit question, then complaint | L17 and L16 on [PR #28](https://github.com/gbriggs-cursor/medplum/pull/28) |
| 10 | Analytics | L13 on [PR #33](https://github.com/gbriggs-cursor/medplum/pull/33) |
| 11 | Voice | L9 on [PR #27](https://github.com/gbriggs-cursor/medplum/pull/27) |
| 12 | Speech to FHIR | L10 on [PR #31](https://github.com/gbriggs-cursor/medplum/pull/31) |
| 13 | PHI tripwire | L11 on [PR #36](https://github.com/gbriggs-cursor/medplum/pull/36) |
| 14 | MCP route | [PR #37](https://github.com/gbriggs-cursor/medplum/pull/37), stacked on [PR #35](https://github.com/gbriggs-cursor/medplum/pull/35) |
| 15 | Healthcare SaaS | G8–G11 on [PR #22](https://github.com/gbriggs-cursor/medplum/pull/22) |

## 0. Catalog — PR #17

Phase 0. Five story cards (G1, G2, G3, G4, L3), the label taxonomy, and `demos/_shared/scripts/catalog.mjs`.

Recorded: `node demos/_shared/scripts/catalog.mjs --check` printed `PASS: 5 stories valid (5 passed, 0 failed)`. A planted branch pin, an `automatable` label on rebrand, a real-company default persona, and `gate_blocks: true` were all reported, and the checker exited 1. The three `reset.sh` scripts ran twice. GIO-40 to GIO-43 labels were read to confirm the automation label set.

Not run: no live take from any of the five new cards. The ticket-to-PR label filter is unconfirmed (`d5489670` may need `maintenance` as well as `automatable` and `agent-safe`; the card keeps all three). The reset scripts are stubs and do not touch Jira. The checker needs the `yaml` package from `npm ci`. GitHub Actions has never run on this fork. The Medplum section of the shared demo-setup skill lives outside this repo.

## 1. Requirement — L1 on PR #25

Stage 01. Meeting notes would become traced requirements. `{prospect}` defaults to Acme Cardio.

Recorded: catalog check passed for 7 stories (the five from #17, plus L1 and L2). Both reset scripts exited 0 twice. The three seed YAML files parsed. The evidence file on that PR is the card check.

Not run: no Grok Bot was created, edited, or invoked. No Jira call, and no ticket was created. `run/requirements.yaml` is not in the PR. Answer-key contents were not written. That PR did not start L8. Do not edit Ticket Triage `790429ca` or Fix Orchestrator `67f664f8`. If the bot or the Atlassian connector is missing, stop and name that blocker. Do not invent a ticket key.

## 2. Risk — L2 on PR #25

Stage 02. The same PR as L1. `seed/unassessed.yaml` stands in for a design input, so this stop does not need a live L1 run.

Recorded: same catalog check and reset runs as L1. The evidence file is the card check, and it is not a hazard.

Not run: no bot, no Jira ticket, and `run/hazard.yaml` is not in the PR. The risk skill uses a fictional severity-to-class rule for the demo. It is not ISO 14971, and no device was classified for real. Answer-key contents were not written.

## 3. Build — L3 on PR #17, recorded output PR #11

Stage 03. The L3 card (`demos/device-evidence/`) is on PR #17. PR #11 is the recorded device-evidence output that card names: Acme Cardio patch v2, BP and ECG, 4 passed, seed 20261104.

Not run: PR #17 says none of the five prompts has been run from the new cards. Do not describe a fresh build take.

## 4. Review — L4 on PR #18

Stage 04. IEC 62304 Bugbot rules and the P5 regulatory seed.

Recorded: `node demos/_shared/regulatory/check.mjs` printed `PASS: 42 passed, 0 failed`. Catalog check passed for 6 stories.

Not run: Bugbot has not been run against the new rules, so the class C flag and the clean re-review are expected, and they have not been observed. Whether Bugbot reviews draft PRs on this repo is unconfirmed. The card's fallback is empty until a take is recorded. GitHub Actions has not run.

What to show: part 1 of `demos/bugbot-62304/prompt.md` asks for a class C change with no trace line. Part 2 is the fix. The expected trace, once a take exists, is `Trace: REQ-006, RISK-001`. Until then, show the rule text and the checker log.

## 5. Verify, including the loop back to build — L5 on PR #21

Stage 05. This is the failure loop. A planted regression fails CI, a remediation step fixes `packages/core/src/search/match.ts`, and CI is run again. The loop returns to stage 03 Build. The room then continues to approve.

Recorded, reference rehearsal (`REMEDIATOR=reference`, labeled a pipeline self-test in the evidence): run-1 on the planted tree was **51 passed, 3 failed**, REQ-004 RED. The guard accepted `packages/core/src/search/match.ts`. Run-2 was **54 passed, 0 failed**, REQ-004 and REQ-005 GREEN. A guard negative test that edited `match.test.ts` printed `REJECTED` and exited 1. With no credential, `demos/verify-loop/run.sh` exited 3, `BLOCKED`, before planting anything. `npx @grok/agent-sdk@0.6.0 validate` returned ok. Catalog check passed for 6 stories.

Not run: the agent remediation path has never run. `CURSOR_API_KEY` is the blocker. Untested: the agent's fix quality, whether Vitest runs inside the SDK sandbox, and the `--json` shape of `agent-sdk run` beyond `ok` and `sessionId`. The committed evidence is the reference self-test. "CI" here is `ci.mjs`. GitHub Actions has not run, and no Actions workflow was added. `answer-keys://verify-loop/` is a placeholder. With shell enabled, the agent could still read files outside its workspace; writes are sandboxed and the guard keeps changes in source. The fallback is empty until a live take is recorded.

Say this on stage: the red-to-green counts are the rehearsal. The remediation agent has not run.

## 6. Approve — L6 on PR #23

Stage 06. Show the card. Continue. Do not wait.

Recorded: in the P1 cohort, `npx vitest run` gave **4 passed, 0 failed**, the same count PR #23 attributes to PR #11. `gate.mjs build` wrote `Approval: pending` and did not write `approval.json`. In a scratch folder, verify before a decision printed `no decision recorded`; approve used signer "Self Test" and role "pipeline self-test, not a human decision"; verify then printed `VALID`; after a one-character edit to the Result line, verify printed `INVALID. Changed after the decision: EVIDENCE.md` and exited 1. Catalog check passed for 7 stories. `reset.sh` ran twice.

Not run: Grok Bot has not been wired to post the card or to turn an on-stage "approve" into part 2. The signer is the name passed on the command line. There is no SSO check, and this is not a 21 CFR Part 11 signature. GitHub Actions has not run. The fallback is PR #11, which is v1 evidence and has no approval. No approval take has been recorded. The self-test signer is not a human decision. Say that.

PR #23 notes that once L4 is on the default branch, the moved ECG parser is class C, and that PR's evidence already carries `Trace: REQ-001, RISK-002, RISK-001`. Approvals stay in the evidence package. Nothing is written back to Medplum.

## 7. Release — L7 on PR #34

Stage 07. A design-history index from three synthetic release records.

Recorded: `node --test` passed 3 of 3. Catalog check passed for 6 stories. `tsc --noEmit` exited 0. `agent-sdk validate` returned ok. `agent-sdk tool call assemble-dhf` returned pass, 3 passed, 0 failed, on commit `220b09fb2d4dca951fdaedf9a8d765afb5db1a89`, and wrote `DHF-INDEX.md`, `EVIDENCE.md`, `trace.json`, and `test-log.txt`. `reset.sh` twice; the second run printed `already clean`. `agent-sdk eval --list` shows `smoke/assemble`. Record one cites the PR #11 cohort counts (20 patients, 20 devices, 40 observations, seed 20261104). The bundle was not copied. `approval.json` is not written. The named tests were not re-run.

Not run: model turns were not run. `CURSOR_API_KEY` is not set. The earlier credential check returned "Not signed in to Cursor." `agent-sdk run` on the L14 runner failed with `BDK needs a Cursor credential to run turns`. The L7 smoke eval was not executed. `XAI_API_KEY` is not set, and this story does not use it. No Jira writes.

## 8. Batch evidence — L14 on PR #30

Sits on stages 05–07. One evidence folder for four synthetic device changes. Show it after the spine. It does not replace L6 or L7.

Recorded: `node --test` passed 3 of 3. Catalog check passed for 6 stories. `tsc --noEmit` exited 0. `agent-sdk validate` returned ok. `agent-sdk tool call refresh-evidence` returned pass, 4 passed, 0 failed, on commit `614acbf34a654d8e4b83daa516739aeaae491dd9`. `reset.sh` twice; the second run printed `already clean`. `approval.json` is not written. The FHIR bundle from PR #11 was not copied, and that PR's tests were not re-run. The trace shape follows PR #21. The gate that writes `approval.json` is PR #23.

Not run: `agent-sdk whoami` failed with "Not signed in to Cursor." `agent-sdk run` failed on the missing `CURSOR_API_KEY`. The smoke eval `smoke/refresh` was not executed. No Jira writes. `XAI_API_KEY` is not set, and this story does not use it.

## 9. Audit question, then complaint — PR #28

L17 is stage 07. L16 is post-market. Same PR. L1 and L2 are not in this PR's catalog.

### L17 audit Q&A

The question in the prompt defaults to REQ-012. The corpus is `demos/audit-qa/seed/trace-index.yaml`, a hand-written stand-in. L7 has not built a design-history index for this file. Every row has `executed: false`.

Recorded: catalog check passed for 7 stories (phase 0, plus L16 and L17). A planted `stage: banana` was restored before commit and had exited 1. Both reset scripts exited 0 twice. The trace index parsed. The REQ-012 approval hash, recomputed from the parsed YAML, matched `8ca6a1980369705db866e0705f6318376d76a96a3791a52f044cc44128237729`. The evidence file is the card check.

Not run: no bot was created, edited, or invoked. No audit question was asked. The recorded REQ-012 test command points at a file that is not in the repo, and it was not run. The pass result and the approval block are fixture fields, not a test this PR ran and not a signature anyone collected. Answer-key contents were not written. That PR did not start L8. L7 and L9 were not run. REQ-011 is in the index with no hazard, so the fixture does not publish a safety class for L2.

### L16 complaint to CAPA

`demos/complaint-capa/seed/complaint.md` stands in for intake. Subject id SP-014. L9 has not filed a ticket.

Recorded: the same catalog check, the bad-stage probe, and the reset runs. The complaint id register parsed. The evidence file is the card check, and it is not a complaint filing.

Not run: no bot, no Jira call, no ticket, and `run/complaint.yaml` is not in the PR. The assessment was not submitted anywhere. Do not edit bots `790429ca` or `67f664f8`. If the bot is missing, or the Atlassian connector cannot create GIO issues, stop and name that blocker. Do not invent a ticket key.

## 10. Analytics — L13 on PR #33

10k synthetic Synthea patients. Every patient row is tagged `synthetic` and `HTEST`. Release tag `data-p2-synthea-analytics-10k-v1` is published.

Recorded on that published asset, from PR #33: `fetch.sh` exited 0. The tarball sha256 `5f803a524ba57b31067657a0c9a0e6d009bc0d2b62115abdc79c6412bbc20cef` matched `pack.yaml`. `verify.py` passed 28 checks with 0 failures. `analytics.duckdb` has 11,842 patients and 25,263 HbA1c observations (LOINC `4548-4`).

Also recorded when the pack was built, on the same PR: Synthea P2 produced 10,000 living, 1,722 deceased, and 11,722 total records. Two P0 builds were byte-identical. Two P2 builds had identical rows, and the pinned sha256 is one of those builds because two Parquet files differed at the byte level. A sanity query showed naive diabetic HbA1c control at 96.8% in February and 68.1% in March. The private scorer gave 4/4 on findings derived from SQL and 0/4 on an empty findings file. Catalog check passed for 6 stories. `reset.sh` ran twice.

Not run: environment `67842161` does not run `install.sh` with `FETCH_P2=1` at install, so that preload has not been tried. No live agent has run the L13 story prompt, and there is no fallback PR for that story. No `@grok/agent-sdk` runner is in the PR; the story is a cloud-agent prompt. Answer keys are not in the repo (`answer-keys://analytics-10k/` does not exist yet). The coding-drift anomaly is 66 condition rows, and Synthea already emits some `ICD10` codes.

## 11. Voice — L9 on PR #27

Foo Medical patient support. The caller confirms a read-back, the server redacts the text, triage runs against a Foo Medical and Medplum docs KB, and a GIO ticket is built in a dry-run outbox. A PHI tripwire refuses the Jira write if an identifier remains. This folder is a rebuild from the design plan. The Nightwing repo could not be read (`Repository not found`), so the site, voice client, scripts, and original 14 eval cases were never copied. The 14 cases here are new.

Recorded: `npm test` 10 passed, 0 failed. `npm run eval` 14/14 (the first run was 12/14; brand-word coverage and triage-on-raw-text were fixed in code, and thresholds were not loosened). `npm run demo:verify` for `--kb-gap`, `--bug`, `--answered`, and `--urgent` was 7/7 checks each. Catalog check passed for 6 stories. Negative catalog checks exited 1. `agent-sdk validate`, `tsc --noEmit`, and the `search_kb` / `record_triage` tool calls returned ok. The browser form flow was exercised (read-back, then a submitted `kb_gap` with 2 identifiers redacted).

Not run: model evals were not run. `agent-sdk eval` stops with `BDK needs a Cursor credential to run turns` because `CURSOR_API_KEY` is unset. Only the deterministic harness is green. Grok Voice is stubbed. No `XAI_API_KEY` is set. `POST /api/voice/session` returns 503 without the key and 501 with it. The form path is the working path. No Jira write was made. There are no `JIRA_*` keys. Only the dry-run path was run. Bots `790429ca` and `67f664f8` are not repointed and must not be. The kb-gap and bug handoffs were not exercised. This PR still has the older redactor rule; the digit requirement for labelled IDs landed on PR #31.

If those bots are ever rehomed, the PR says they would watch GIO for `story:support-voice` plus `support`, ignore `automatable`, target this repo and environment `67842161`, put KB article pull requests under `demos/support-voice/kb/foomedical/` against the default branch, act without an approval wait, treat ticket text as redacted, and use GitHub only.

## 12. Speech to FHIR — L10 on PR #31

A confirmed intake becomes a `QuestionnaireResponse` on the synthetic patient's chart. The GIO ticket points at it by id only. Identity stays in Medplum. This PR is based on PR #27.

Recorded: `npm test` 6 passed, 0 failed. `node scripts/run.mjs` for transcripts `pairing`, `appointments-blank`, and `airport` against the local server on port 8103: 3 of 3, `$validate` returned no errors, the response was found by subject and questionnaire search, and the ticket held no identity. A form submit wrote the response, and the dry-run ticket held `Chart: QuestionnaireResponse/<id>` and neither the name nor the birth date. `reset.sh` deleted 3 patients and 3 responses, then 0 and 0. Support-voice regression: `npm test` 11 passed, eval 14/14. Catalog check passed for 7 stories.

Not run: Grok Voice is stubbed. No `XAI_API_KEY`, so the input is seeded transcripts and typed text. No live speech was tested. Extraction is regex; spelled-out digits and a name given without "my name is" are not handled. No Jira writes; the ticket is dry-run JSON in `demos/support-voice/run/outbox/` only. The run used the local dev server and the seeded admin login. It was not run against a hosted project or a patient-scoped AccessPolicy. A patient-chart screenshot was not included because that path is not an app route. Bots `790429ca` and `67f664f8` were not touched and were not exercised.

## 13. PHI tripwire — L11 on PR #36

P3 pack. Stacked on PR #31.

Recorded: tests 6 of 6. Eval of 50 notes and 213 identifiers: 0 in allowed tickets, 2 of 2 expected refusals, 0 allowed without a chart. Recall 99.1% with the chart and 74.2% blind. The 99.1% is partly by construction.

Jira was dry-run only. The Grok Bot PHI screen is not built. The tripwire reads committed `patients.json`, not Medplum.

## 14. MCP route — PR #37

Enables `mcpEnabled` in `packages/server/medplum.config.json`. Stacked on PR #35.

Recorded: the route is mounted. The first probe sent no token: `/mcp/stream`, `/mcp/sse`, and `/api/mcp/stream` returned 401 Unauthorized (previously 404). That 401 is the no-token run, not a verdict on the route.

Recorded, admin rerun: the probe logged in as `admin@example.com` on port 8103 and sent the seeded admin access token, which the script does not print. `GET /mcp/stream`, `/mcp/sse`, and `/api/mcp/stream` returned 200. `MCP_CONNECT` listed tools `search`, `fetch`, and `fhir-request`. Exit code 0.

Not run: no live bot or Subscription was installed against this MCP endpoint. Do not say a bot connected through MCP. `mcpEnabled` is set only in the demo server config on PR #37, not on `main`.

## 15. Healthcare SaaS — PR #22

Generic track for a prospect that is not a device maker. Defaults to Foo Medical. Codes G8–G11 because G5–G7 are reserved. This PR includes L13's files so G10 can see them. It did not push to PR #33 or PR #17.

| Code | Folder | What the PR says about running it |
| --- | --- | --- |
| G8 | `demos/phi-safe-dev/` | Runs today without the Jira write. Still skips Jira until L11 lands. |
| G9 | `demos/front-office-voice/` | Stubbed. Preflight prints `BLOCKED` and names L9 and L11. |
| G10 | `demos/practice-analytics/` | Preflight prints `READY` because L13 has landed. A live agent run has not been done. |
| G11 | `demos/integration-docs/` | Runs today. Reset confirmed 7 source anchors. |

Recorded on PR #22: catalog check passed for 10 stories. `catalog.mjs --preflight practice-analytics` printed `landed L13` and `READY`. `--preflight front-office-voice` printed `PENDING` for L9 and L11 and `BLOCKED`. `demos/practice-analytics/reset.sh` exited 0 twice and filled `{month}` as March 2026. On the earlier commit, each of the four reset scripts exited 0 twice; G8's baseline `node --test` passed 3 of 3; a scratch-copy test failed with `expected '2027-02-28', actual '2027-03-03'`, then passed 4 of 4 after a fix that was not committed; `check-no-phi.mjs` passed a clean diff, failed a leaked name (2 hits), and failed a leaked MRN and birth date (3 hits).

PR #22 records that the 10k pack was generated on PR #33 and that `verify.py` passed there. PR #22 did not regenerate the pack, did not run `verify.py`, and did not query the Parquet. The verified fetch, sha256, 28 checks, 11,842 patients, and 25,263 HbA1c observations are the PR #33 results in step 10.

Not run: no live cloud-agent run of G10 or of any other story on PR #22, so there are no fallback PR numbers. G9 stays stubbed until L9 and L11. G8 still skips the Jira write until L11. Nothing was written to Jira or Slack.
