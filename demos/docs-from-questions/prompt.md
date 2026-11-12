# Prompt: G4 Docs from repeat questions

Variables: `{prospect}` (default `Foo Medical`).

```
Read the three support questions in demos/docs-from-questions/seed/questions.md from {prospect}'s
developers. Cluster them. Write one new how-to under packages/docs/docs/ that answers all three, fix
any page people already find that is stale, and add the how-to to packages/docs/sidebars.ts. Verify
every port, command, and script name against the source (package.json, docker-compose.yml, server
config). Use only files in this repository. In the PR body list the clustered questions and draft a
reply to each; do not post them. Open a draft PR against the default branch.
```
