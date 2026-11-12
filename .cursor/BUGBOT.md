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

## IEC 62304

These rules add to the evidence check above. They use the synthetic regulatory seed in `demos/_shared/regulatory/`.

### Safety class

Each changed file takes its class from `demos/_shared/regulatory/software-items.md`: the highest class of any row whose path pattern matches it. A file that matches no row is class A. The pull request's class is the highest class of its changed files. Deleted files count.

Documentation, lockfiles, and generated files (as defined under "Out of scope") are class A.

### Trace ID

A class B or C pull request must add or update `evidence/EVIDENCE.md` with one more line after the six required lines:

- `Trace:` followed by at least one requirement ID (`REQ-` plus three digits) and at least one risk ID (`RISK-` plus three digits)

Every ID on that line must appear in `demos/_shared/regulatory/requirements.md` or `demos/_shared/regulatory/hazards.md` on the head branch.

### SOUP list

A pull request that adds, removes, or changes the version of an entry under `dependencies` or `peerDependencies` in `packages/react/package.json`, `packages/core/package.json`, `examples/foomedical/package.json`, or any `package.json` under `demos/` must also change `demos/_shared/regulatory/SOUP.md`, and that diff must name each added, removed, or re-versioned package.

### Flag

- Class C with no `Trace:` line: flag high risk. Say "class C change with no trace ID" and name the class C files.
- Class B with no `Trace:` line: flag medium risk and name the class B files.
- A `Trace:` line with no `REQ-` ID or no `RISK-` ID: flag at the pull request's class level (high for C, medium for B) and name the missing kind.
- A `Trace:` ID that is not in the regulatory seed: flag at the same level and name the ID.
- A dependency change without a matching `SOUP.md` change: flag high risk and name each package missing from the `SOUP.md` diff.

Start each flag with the safety class, for example `Class C:`.

## Tone

Be direct. Name the missing line. Do not summarize the pull request.
