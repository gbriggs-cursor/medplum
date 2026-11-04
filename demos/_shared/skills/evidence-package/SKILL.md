---
name: evidence-package
description: >-
  Write evidence/EVIDENCE.md showing a demo's controls were met: Requirement,
  Change, Test, Result (pass or fail plus a count), Synthetic: true, and
  Commit, plus a requirement-to-test-to-run-to-result table and a copy of
  the test log. Use when a demo asks for an evidence package or to record
  that the controls were met. Inputs are the requirement sentence, the test
  command, and the result. The same steps apply to every demo.
---

# evidence-package

Do the demo work first. Then write an evidence package that the controls were met.

Any demo uses this skill. The caller supplies the requirement sentence, the test command, and the result. Paths, product names, and counts come from that run.

## Inputs

1. **Requirement sentence.** One sentence that states the control. A summary sentence plus a list of control sentences is allowed: the header `Requirement` line is the summary (or the only sentence), and the table has one row per control sentence.
2. **Test command.** The exact command for this demo, including the directory it runs from.
3. **Result.** `pass` or `fail`, plus a count in the form `<n> passed, <m> failed`.

Ask for any input that is missing. Fill each field from this run.

From the repo, also record:

- **Change.** One line naming what changed to meet the requirement. Read `git show --stat` for the commit under test, or `git diff` when that commit is `HEAD`. Name only paths present in that diff.
- **Commit.** The full SHA of the commit that contains the change, from `git rev-parse`. Use `HEAD` when the caller does not name a SHA and `HEAD` contains the change. An uncommitted change stops the skill. Write a SHA only when git returns it.
- **Synthetic.** The line is always `Synthetic: true`. Write the package only when the data under test is synthetic (tagged synthetic, or generated and documented as synthetic). Stop when that cannot be confirmed.
- **Test log.** Verbatim stdout and stderr of the test command, then a final line `EXIT:<code>` with the command's exit code.

## Output

Write both files under the evidence directory the caller names. When they name none, use `evidence/` in the demo's working directory.

- `evidence/test-log.txt` — the log
- `evidence/EVIDENCE.md` — the six lines, the table, and the same log

`evidence/EVIDENCE.md` starts with exactly these six lines, in this order, one field per line, labels spelled as shown. No extra fields in that block.

```
Requirement: <sentence>
Change: <what changed>
Test: <command>
Result: <pass or fail> (<n> passed, <m> failed)
Synthetic: true
Commit: <full sha>
```

`Result` is `pass` when the failed count is 0, and `fail` otherwise. The parenthetical counts are the counts in the log (`<n> passed, <m> failed`). When the caller's result and the log disagree, stop and report both. Leave the file unwritten.

After a blank line, add the requirement-to-test-to-run-to-result table. One row per control sentence. `Run` is the test command plus the run date (`YYYY-MM-DD`). The table `Result` cell is `pass` or `fail`. The `Test` cell is the test name when the row is one test, and the test command when the row is the whole suite.

```
| Requirement | Test | Run | Result |
| --- | --- | --- | --- |
| <sentence> | <test name or command> | <command>, <YYYY-MM-DD> | pass |
```

After a blank line, add the heading `## Test log` and a fenced copy of `evidence/test-log.txt`. The fenced text and `test-log.txt` are the same bytes. No other sections.

## Steps

1. Collect the requirement sentence, the test command, and the result.
2. Confirm the data under test is synthetic. Stop when it is not, or when that cannot be confirmed.
3. Run the test command when this tree does not already have its log. Save stdout and stderr to `evidence/test-log.txt` and append `EXIT:<code>`.
4. Read the passed and failed counts from the log and compare them with the given result.
5. Write `Change` from the diff and `Commit` from `git rev-parse`.
6. Write `evidence/EVIDENCE.md` in the shape above.
7. Leave product code, tests, and generators unchanged.

## Example

`example.md` in this folder is a short filled package and a shape sample. A later demo reuses this skill by passing its own requirement sentence, test command, and result, then writing a new `evidence/EVIDENCE.md` in this shape.
