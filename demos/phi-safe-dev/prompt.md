# Prompt: G8 PHI-safe debugging for practice software

Variables: `{prospect}` (default `Foo Medical`).

```
A {prospect} front-desk user pasted the support ticket in demos/phi-safe-dev/seed/ticket.md. It contains
patient identifiers (synthetic, but treat them as real PHI).

Rules: never copy a name, date of birth, MRN, phone, email, member ID or clinician name from the ticket into
code, tests, fixtures, commit messages, Jira, or the PR. Work only on synthetic twins: invented patient IDs
that reproduce the same shape of data (dates, statuses, codes), tagged synthetic + HTEST.

1. Write a redacted one-paragraph summary of the ticket. If the PHI redaction step from story L11 exists in
   this repository (see demos/catalog.yaml), run the summary through it and file it as a GIO ticket with the
   labels on demos/phi-safe-dev/story.yaml. If it does not exist, skip Jira entirely.
2. Reproduce the bug in demos/phi-safe-dev/app/recall.mjs with a failing synthetic-twin test in
   recall.test.mjs. Run: node --test demos/phi-safe-dev/app/*.test.mjs
3. Fix the cause, not just the one patient. Add tests for the other cases the same cause affects.
4. Run git diff origin/HEAD...HEAD | node demos/phi-safe-dev/check-no-phi.mjs and run the script on your PR
   body too. Both must PASS.
5. Open a draft PR against the default branch. In the body: the redacted summary, the root cause, test output
   before and after the fix, and both check-no-phi.mjs results.
```
