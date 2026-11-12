# Demo stories

Plug-and-play demo stories for `gbriggs-cursor/medplum`. Each story is a folder with a card, a talk track, a prompt, and (when it seeds data) a reset script. Demo Setup reads only `demos/catalog.yaml`.

All data is synthetic. All stories run in cloud agent environment `67842161`, use the **GIO** Jira board, and start from the repository's default branch. No story depends on a named branch or on reaching an outside domain.

## Layout

| Path | Purpose |
| --- | --- |
| `catalog.yaml` | Generated index of every story. Do not edit by hand. |
| `<story>/story.yaml` | The story card (fields below). |
| `<story>/README.md` | Talk track: setup line, wow line, what to click, fallback. |
| `<story>/prompt.md` | Exact prompt, with `{prospect}` and other variables. Defaults live in the card. |
| `<story>/seed/`, `<story>/reset.sh` | Seed data and an idempotent reset. Only where the story seeds data. |
| `_shared/labels.md` | Jira label taxonomy. |
| `_shared/skills/` | Shared skills (for example `evidence-package`). |
| `_shared/scripts/catalog.mjs` | Validates every card and rebuilds `catalog.yaml`. |

## Story card fields

| Field | Holds |
| --- | --- |
| `id`, `code`, `title` | Folder name, catalog code (G1, L3, ...), display title. |
| `track`, `stage` | `generic` or `ls`; `generic` or factory stage `01`-`07`. |
| `readiness`, `runtime`, `environment` | `exists`, `adapt`, `new`, or `planned`; minutes; always `67842161`. |
| `persona` | Who it is for. Uses `{prospect}`. |
| `trigger` | What starts it. |
| `actors` | Agents, bots, automations, SDK runners. |
| `surface` | Medplum area shown. |
| `data_pack` | Named synthetic pack and seed. |
| `artifact` | What gets produced. |
| `gate`, `gate_blocks` | On-stage approval moment. `gate_blocks` is always `false`: bots never wait. |
| `wow` | The one moment on screen. |
| `proof` | What Demo Setup returns. |
| `reset` | `demos/<story>/reset.sh`, or `null` when nothing is seeded. |
| `fallback` | Existing PR numbers to show if the live run fails. Empty needs `fallback_note`. |
| `blast_radius` | External systems touched. |
| `variables` | Prompt variables and defaults. `prospect` defaults to Acme Cardio or Foo Medical. |
| `jira` | `project: GIO`, `automation`, and the labels from `_shared/labels.md`. |
| `answer_key` | Optional. `answer-keys://<story>/` (see below). |
| `depends_on` | Optional. Other stories this one reuses, by catalog `code`, each with `provides` (what it uses) and optional `workstream` and `planned_path`. A code with no card yet is listed under `pending` in the catalog, and the story runs in its documented stub mode until it lands. |

## Personas

Defaults use the generic account: Acme Cardio (device maker) and Foo Medical (patient portal). A real company name appears only when a run sets `{prospect}` to that prospect.

## Generic healthcare-SaaS track

For prospects that are neither GxP nor device makers (for example a practice-management software company). All four use `track:generic` and default to Foo Medical.

| Code | Story | Reuses | Runs today |
| --- | --- | --- | --- |
| G8 | `phi-safe-dev` | L11 `demos/phi-tripwire` and `demos/_shared/phi/redact.mjs` | Yes. Redacts locally. No Jira write |
| G9 | `front-office-voice` | L9 `demos/support-voice`, L10 `demos/speech-to-fhir`, L11 `demos/phi-tripwire` | Preflight is READY. No live voice, no live Jira, no agent run of the prompt yet |
| G10 | `practice-analytics` | L13 pack at `demos/_shared/data-packs/synthea-analytics` | Yes. Preflight is READY. A live agent run is still unverified |
| G11 | `integration-docs` | Nothing | Yes |

## Answer keys

Answer keys live in a separate private repository that agents cannot read. It is not created yet.

- Placeholder: `answer-keys://<story>/` resolves to `<private-answer-keys-repo>/<story>/` (repository name to be decided).
- Never commit an answer key to this repository.

## Approvals

On-stage approvals are recorded in the story's evidence package (`approval.json`) and the Grok Bot chat. Nothing is written back to Medplum.

## Validate and rebuild the catalog

```
node demos/_shared/scripts/catalog.mjs          # validate and rewrite catalog.yaml
node demos/_shared/scripts/catalog.mjs --check  # validate and fail if catalog.yaml is stale
node demos/_shared/scripts/catalog.mjs --preflight <story>  # fail with the exact blocker if a dependency has not landed
```

The check fails on a missing field, a label outside the taxonomy, automation labels on a non-automation story, a non-generic default persona, a prompt variable with no default, a missing or non-executable reset script, a gate that blocks, or branch pinning anywhere under `demos/` or `.cursor/`.
