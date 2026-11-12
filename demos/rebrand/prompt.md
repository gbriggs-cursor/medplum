# Prompt: G3 Prospect rebrand

Variables: `{prospect}` (default `Acme Cardio`), `{brand_kit}` (default `acme-cardio`).

## 1. Plan (Plan mode)

```
Read the brand kit in demos/rebrand/brand/{brand_kit}/. Plan a rebrand of examples/foomedical as
{prospect}'s patient portal: theme tokens, logo, copy, favicon. No layout changes. Use only the
files in that folder; do not fetch anything from the network.
```

## 2. Build

```
Execute. Centralize tokens in one theme file. Run the examples/foomedical tests and update only the
snapshots whose text changed. Check color contrast meets WCAG AA and list any failures in a table.
Capture before and after screenshots. Use the evidence-package skill, then open a draft PR against
the default branch.
```
