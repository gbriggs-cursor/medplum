---
name: uat-from-acceptance-criteria
description: >-
  Run user acceptance tests from REQ lines. For each requirement and its
  acceptance criterion, run one computer-use check in the running app,
  capture a screenshot or video, and append a pass or fail row to
  EVIDENCE.md with the evidence-package skill. Use when asked to run UAT,
  check acceptance criteria, or verify a PRD's REQ lines on screen.
---

# uat-from-acceptance-criteria

Turn each REQ line into one on-screen check and one evidence row.

## Inputs

1. **REQ lines.** Each has an ID, a requirement, and an acceptance criterion. Read them from the PRD the caller names (for example `demos/test-review/prd-patient-devices.md`), or from the caller's message.
2. **App URL.** The running app (for example `http://localhost:3000`). Ask when it is missing.
3. **Test data.** A synthetic dataset (for example `demos/_shared/data/taylor-demo-bp-cuff.json`). Confirm every resource is tagged `synthetic` and `HTEST`. Stop when the data is not synthetic or that cannot be confirmed.
4. **Evidence directory.** Where `EVIDENCE.md` lives. Default `evidence/` in the working directory.

## Steps

1. Load the test data if it is not loaded yet, and note the patient or resource the checks open.
2. For each REQ line, in order:
   1. Write the check as one sentence: what to open, what to look at, and what counts as a pass. Use only the acceptance criterion; do not add criteria.
   2. Run it as a computer-use check in the browser: open the page, act, and read the screen.
   3. Capture proof under `<evidence dir>/uat/`: a screenshot `<REQ id>.png` for a static check, or a video `<REQ id>.mp4` when the check needs steps. Show no tokens, secrets, or real names on screen.
   4. Record `pass` when the screen matches the criterion exactly, otherwise `fail` with one line saying what the screen showed.
3. Count the results: `<n> passed, <m> failed`.
4. Write `<evidence dir>/test-log.txt`: one line per REQ, `<REQ id> <pass|fail> <proof path> <what the screen showed>`, then `EXIT:0` when every check passed or `EXIT:1` otherwise.
5. Call the `evidence-package` skill (`demos/_shared/skills/evidence-package/SKILL.md`) with:
   - Requirement: the PRD's summary sentence, and one control sentence per REQ line.
   - Test: `uat-from-acceptance-criteria <PRD path>` and the app URL.
   - Result: `pass` or `fail` with the counts from step 3.
   It appends one table row per REQ line. Put the proof path in the `Test` cell.
6. Report each REQ id with its result and proof path. Do not change product code to make a check pass.

## Rules

- One REQ line, one check, one row. A failed check stays failed; do not retry it until it passes.
- Synthetic data only. Never type real patient or customer data into the app.
- Do not commit screenshots or videos larger than the repository allows; link them from the PR instead.
