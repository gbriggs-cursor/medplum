# Bugbot

Check evidence on pull requests that change application or demo source. This file is review rules only.

## In scope

The check applies when the pull request adds, edits, or deletes a source file under `examples/`, `packages/`, or `demos/`.

Source is any file in those trees that is not documentation, a lockfile, or generated.

## Out of scope

Skip the check when every changed file is documentation, a lockfile, or generated.

- Documentation: `*.md`, `*.mdx`, and files under `packages/docs/`.
- Lockfile: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `npm-shrinkwrap.json`, `bun.lock`, `bun.lockb`.
- Generated: files under `dist/`, `build/`, `coverage/`, `.next/`, or `storybook-static/`, and other generated output.

A pull request that also changes in-scope source stays in scope. Docs, lockfiles, and generated files in that diff do not remove the check.

## Required file

An in-scope change must add or update `evidence/EVIDENCE.md` (a path ending in `evidence/EVIDENCE.md`). A file already on the base branch that this pull request does not change does not count.

The file must contain these lines, one field per line, labels spelled as shown:

- `Requirement:` followed by a non-empty value
- `Change:` followed by a non-empty value
- `Test:` followed by a non-empty value
- `Result:` followed by the word `pass` or `fail`, plus a count
- `Synthetic: true`
- `Commit:` followed by a non-empty value

`Result` is blank when it has no value, or when it lacks the word `pass` or `fail` and a count.

## Flag

If `evidence/EVIDENCE.md` is missing, flag the pull request high risk and name each missing line: `Requirement`, `Change`, `Test`, `Result`, `Synthetic: true`, `Commit`.

If any of those lines is missing, flag the pull request high risk and name that line.

If `Result` is blank, flag the pull request high risk and name `Result`.

## Tone

Be direct. Name the missing line. Do not summarize the pull request.
