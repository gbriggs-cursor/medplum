# Prompt: L5 Verify loop

Variables: `{prospect}` (default `Acme Cardio`).

Paste into a cloud agent started from the default branch in environment `67842161`:

```
We're showing {prospect}'s QA team stage 05 Verify. Run demos/verify-loop/run.sh from the repository
root and stream its output. Do not edit any file yourself: the remediation agent inside the script
does the fix, and a guard rejects test changes.
When it exits 0, show demos/verify-loop/evidence/TRACE.md and the first nine lines of
demos/verify-loop/evidence/EVIDENCE.md. Commit the source change (if any) and the evidence folder
with git add -f demos/verify-loop/evidence, and open a draft PR against the default branch titled
"Verify loop: planted date-boundary regression fixed by the remediation agent".
If it exits 3, report the blocker line verbatim and stop.
```

The remediation agent's own instructions are in `remediator/bot/instructions.md`. The script sends it the failing test names and the CI log.
