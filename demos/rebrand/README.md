# G3 Prospect rebrand

**Setup line:** "Foo Medical is Medplum's sample patient portal. {prospect} wants it as their own product by Friday."

**Wow line:** "Same app, same tests, now theirs. Every color is a token in one file, and here's the contrast check."

## Run it

1. Confirm the brand kit exists: `demos/rebrand/brand/{brand_kit}/brand.md` and `logo.svg`. The default is the fictional `acme-cardio` kit.
2. Start a cloud agent in environment `67842161` from the default branch and paste `prompt.md`.
3. Show the plan (tokens, logo, copy, favicon), then the before/after screenshots.

## Prospect runs

Commit the prospect's kit under `demos/rebrand/brand/<slug>/` before the demo, then set `{brand_kit}` and `{prospect}`. The environment blocks outside brand sites, so the agent must never fetch assets during the run.

## What to click

- The single theme file the agent creates (on the default branch the theme is inline in `examples/foomedical/src/main.tsx`).
- The contrast table in the PR body.

## Fallback

None under the generic persona. See `fallback_note` in `story.yaml`.

## Reset

Nothing is seeded. Leave the draft PR open as a recorded take.
