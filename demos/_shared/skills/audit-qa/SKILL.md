---
name: audit-qa
description: >-
  Answer an audit question from the hand-written trace index only. Use for
  the audit-ready Q&A story. Quote the row for the asked requirement id,
  say when a link is missing, and do not write tickets, files, or Medplum
  resources.
---

# audit-qa

Answer from `demos/audit-qa/seed/trace-index.yaml` and from nowhere else.

The index is a hand-written fixture. It stands in for a design-history index that a later story would build. It is not that index. Every row says `executed: false`.

## How to answer

1. Find the row whose `req_id` equals the asked id. Match the id exactly. Do not answer with a different row.
2. When the id is not in the file, say it is not in the index. Do not draft a requirement for it.
3. For the fields `requirement`, `risk`, `test`, `run`, `result`, `approval`, and `commit`, quote the value when it is present and say `not in the index` when it is null.
4. Say the row is a fixture and that this repository did not execute the test or collect the approval, even when `result` is `pass` or `approval` is filled in.
5. Do not read other demo folders, skills, or seeds to fill a null. Do not estimate a safety class that the row does not contain.

## Do not

- Write a file, a Jira ticket, or a Medplum resource.
- Change the index.
- Wait for an approval. If the row already has an approval, report it as data in the fixture. If it does not, say it is not in the index.

## Shape

For a row that has a requirement and nothing else, the answer names the requirement and then says risk, test, run, result, approval, and commit are not in the index. REQ-099 in the seed is that shape. Use it only when the question asks for REQ-099.
