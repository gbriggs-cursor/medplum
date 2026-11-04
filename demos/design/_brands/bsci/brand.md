# Boston Scientific (BSCI) brand kit

Customer demo kit for rebranding `examples/foomedical` as the **Boston Scientific CDx Patient Portal**. Synthetic data only. Not a live clinical system.

## Source note

`bostonscientific.com` is blocked by this environment's egress allowlist (TLS handshake fails). The assets below are the official Boston Scientific **Anatomy** design system, published by the `bos-sci` GitHub organization — the same tokens and wordmark the corporate site uses. Nothing here was drawn by hand.

## Logo

| Asset | Source |
| --- | --- |
| Wordmark SVG | https://github.com/bos-sci/anatomy-react/blob/main/src/stories/assets/logo-bsc.svg |
| Wordmark + tagline SVG | https://github.com/bos-sci/anatomy-react/blob/main/src/stories/assets/logo-bsc-tagline.svg |
| Files in this kit | `logo-bsc.svg`, `logo-bsc-tagline.svg`, `favicon.svg` (same official wordmark) |

Logo fills from the official SVG:

- Primary wordmark: `#00467f` (`--bsc-logo-primary`)
- Tagline: `#6a737b` (`--bsc-logo-secondary`)

The Anatomy docs favicon is a Watchman product mark, not the corporate wordmark, so it is not used.

## Colors

Pulled from official Anatomy corporate light CSS:

https://github.com/bos-sci/anatomy-tokens/blob/main/lib/css/corporate/light.css

Local copy: `corporate-light.css`

| Token | Hex | Role |
| --- | --- | --- |
| `--brand-primary` | `#003c71` | Corporate navy |
| `--bsc-logo-primary` | `#00467f` | Logo |
| `--bsc-logo-secondary` | `#6a737b` | Logo tagline |
| `--action-primary-10` | `#001433` | Darkest action |
| `--action-primary-20` | `#012965` | Button hover / assertive surface |
| `--action-primary-40` | `#0153cc` | Buttons, links, focus (AA) |
| `--action-primary-60` | `#3485fe` | Accent only — fails AA for small text |
| `--action-primary-80` | `#9ac2fe` | Light action |
| `--action-primary-95` | `#e6f0ff` | Subtle action fill |
| `--action-primary-97` | `#f2f7ff` | Lightest action fill |
| `--accent-secondary-60` | `#00eeff` | Decorative cyan |
| `--accent-secondary-40` | `#00becc` | Decorative cyan (fails AA) |
| `--accent-primary-60` | `#bb33ff` | Decorative purple |
| `--accent-primary-30` | `#660099` | Visited link |
| `--neutral-00` | `#000000` | Default text |
| `--neutral-20` | `#333333` | Strong body |
| `--neutral-40` | `#666666` | Subtle text |
| `--neutral-60` | `#999999` | Disabled (fails AA for body) |
| `--neutral-80` | `#cccccc` | Subtle border |
| `--neutral-95` | `#f2f2f2` | Subtle surface |
| `--neutral-100` | `#ffffff` | Default surface |

## Fonts

From https://github.com/bos-sci/anatomy-tokens/blob/main/src/base-styles/variables.scss

| Token | Family | Weight |
| --- | --- | --- |
| `--font-family-base-regular` | `SST-Roman` | 400 |
| `--font-family-base-heavy` | `SST-Heavy` | 500–900 |

SST is a licensed Monotype face. Font binaries are not copied into this repo. The portal uses `SST-Roman, Helvetica Neue, Helvetica, Arial, sans-serif`.

## Tone of voice

- Tagline from the official wordmark: **Advancing science for life**.
- Clinical, confident, and plain. Short sentences. No slang.
- Patient-facing, not promotional.
- Always label this build as a demo that uses synthetic data.

## Rebrand plan

No layout changes. Tokens, logo, product name, favicon, and page titles only.

1. Centralize every brand token in `examples/foomedical/src/theme.ts`.
2. Point `Logo` at the official wordmark SVG. Keep the existing `width` prop; cap height so it fits the 80px header.
3. Product name: **Boston Scientific CDx Patient Portal**. Swap user-facing Foo Medical strings.
4. Favicon: official wordmark SVG.
5. `index.html` title and `document.title` from the theme.
6. Replace hardcoded teal with the `bsc` Mantine palette (`primaryShade` 5 = `#0153cc`).
7. Check WCAG AA. Do not use `--action-primary-60` or `--neutral-60` for small text.

## Contrast (WCAG AA)

Normal text needs 4.5:1. Large text / UI chrome needs 3:1.

| Pair | Ratio | Result | Fix |
| --- | --- | --- | --- |
| White on `#003c71` (brand navy fills) | 11.14 | pass | — |
| White on `#00467f` (logo) | 9.62 | pass | — |
| White on `#0153cc` (primary buttons) | 6.75 | pass | — |
| White on `#012965` (button hover) | 13.94 | pass | — |
| White on `#001433` | 18.29 | pass | — |
| `#003c71` on white (headings) | 11.14 | pass | — |
| `#00467f` on white (logo on light) | 9.62 | pass | — |
| `#0153cc` on white (links) | 6.75 | pass | — |
| `#0153cc` on `#f2f7ff` | 6.28 | pass | — |
| `#666666` on white (subtle text) | 5.74 | pass | — |
| `#6a737b` on white (tagline) | 4.83 | pass | — |
| `#333333` on white | 12.63 | pass | — |
| Black on white | 21.00 | pass | — |
| White on `#3485fe` (action-60) | 3.54 | fail (large pass) | Do not use for small text; buttons use `#0153cc` |
| `#3485fe` on white | 3.54 | fail (large pass) | Same — decorative / large only |
| `#999999` on white (neutral-60) | 2.85 | fail | Disabled chrome only, not body text |
| White on `#00becc` (accent cyan) | 2.27 | fail | Decorative gradient only |

Applied fix: Mantine `primaryShade` is 5 (`#0153cc`), not the brighter `#3485fe`.
