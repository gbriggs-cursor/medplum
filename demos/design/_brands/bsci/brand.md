# Boston Scientific brand kit

Demo brand kit for the Boston Scientific (BSCI) CDx patient-portal rebrand of Foo Medical (`examples/foomedical`). Tokens come from Boston Scientific's public Anatomy design system. `bostonscientific.com` was not reachable from this environment (TLS handshake failed), so assets were taken from the official `bos-sci` GitHub organization.

This kit is documentation and source assets only. The running app reads tokens from `examples/foomedical/src/theme.ts`.

## Logo

| Asset | File | Source |
| --- | --- | --- |
| Wordmark (primary) | `logo-bsc.svg` | https://github.com/bos-sci/anatomy-docs/blob/develop/src/assets/images/logo-bsc.svg |
| Wordmark + tagline | `logo-bsc-tagline.svg` | https://github.com/bos-sci/anatomy-docs/blob/develop/src/assets/images/logo-bsc-tagline.svg |
| Favicon (ICO) | `favicon/favicon.ico` | https://github.com/bos-sci/anatomy-docs/blob/develop/public/favicon/favicon.ico |
| Favicon 16 / 32 | `favicon/favicon-16x16.png`, `favicon/favicon-32x32.png` | https://github.com/bos-sci/anatomy-docs/tree/develop/public/favicon |
| Apple touch icon | `favicon/apple-touch-icon.png` | https://github.com/bos-sci/anatomy-docs/blob/develop/public/favicon/apple-touch-icon.png |

Raw wordmark URL used to fetch the SVG:

`https://raw.githubusercontent.com/bos-sci/anatomy-docs/develop/src/assets/images/logo-bsc.svg`

The wordmark fill is Anatomy `bsc-logo-primary` (`#00467F` in the tagline mark; `#003C71` in `logo-bsc.svg`). Do not redraw or restyle the mark.

## Colors

Source: Anatomy corporate light tokens, `@boston-scientific/anatomy-tokens` (`lib/json/corporate/light.json`).

https://github.com/bos-sci/anatomy-tokens/blob/develop/lib/json/corporate/light.json

| Token | Hex | Role |
| --- | --- | --- |
| `brand-primary` | `#003C71` | Primary brand navy. App filled buttons, header emphasis. |
| `bsc-logo-primary` | `#00467F` | Official logo navy (tagline mark). |
| `bsc-logo-secondary` | `#6A737B` | Tagline gray. |
| `action-primary-10` | `#001433` | Darkest action navy. |
| `action-primary-20` | `#012965` | Assertive surface / hover. |
| `action-primary-40` | `#0153CC` | Action / link blue. |
| `action-primary-60` | `#3485FE` | Bright action. **Do not use for small text** (3.54:1 on white). |
| `action-primary-80` | `#9AC2FE` | Light action tint. |
| `action-primary-95` | `#E6F0FF` | Subtle action surface. |
| `action-primary-97` | `#F2F7FF` | Lightest action surface. |
| `neutral-00` | `#000000` | Default body text. |
| `neutral-40` | `#666666` | Subtle text. |
| `neutral-95` | `#F2F2F2` | Subtle surface / footer. |
| `neutral-100` | `#FFFFFF` | Page surface, inverse text. |
| `feedback-error-40` | `#B31921` | Error. |
| `accent-primary-60` | `#BB33FF` | Decorative purple. **Not for small text** (4.17:1 on white). |
| `accent-secondary-60` | `#00EEFF` | Decorative cyan. **Not for text** (1.43:1 on white). |

Brand gradient (decorative only): `#003C71` → `#BB33FF` → `#00EEFF`.

## Contrast (WCAG AA)

Ratios are for the pair as used in the portal. AA normal text is 4.5:1. AA large text / UI is 3:1.

| Pair | Ratio | AA normal | AA large | Fix |
| --- | ---: | --- | --- | --- |
| White on `brand-primary` `#003C71` (filled buttons, CTA bar) | 11.14 | Pass | Pass | None. Primary shade for buttons. |
| `brand-primary` `#003C71` on white (logo, headings) | 11.14 | Pass | Pass | None. |
| White on `bsc-logo-primary` `#00467F` | 9.62 | Pass | Pass | None. |
| `action-primary-40` `#0153CC` on white (links) | 6.75 | Pass | Pass | None. Links use this, not shade 3. |
| White on `action-primary-40` `#0153CC` | 6.75 | Pass | Pass | None. |
| Body `#000000` on white | 21.00 | Pass | Pass | None. |
| Subtle `#666666` on white | 5.74 | Pass | Pass | None. |
| Subtle `#666666` on `neutral-95` `#F2F2F2` | 5.13 | Pass | Pass | None. |
| `brand-primary` on `action-primary-95` `#E6F0FF` | 9.69 | Pass | Pass | None. |
| White on `action-primary-60` `#3485FE` | 3.54 | **Fail** | Pass | Do not use for small text or filled buttons. App primary shade is `#003C71`. |
| `action-primary-60` `#3485FE` on white | 3.54 | **Fail** | Pass | Same. Reserved for large decorative UI. |
| White on `accent-primary-60` `#BB33FF` | 4.17 | **Fail** | Pass | Decorative gradient only. Not used for text. |
| `accent-secondary-60` `#00EEFF` on white | 1.43 | **Fail** | **Fail** | Decorative gradient only. Not used for text or backgrounds with white type. |
| White on `feedback-error-40` `#B31921` | 6.82 | Pass | Pass | None. |

Hero title on the authenticated home photo uses white on the darkened overlay so the previous teal name highlight cannot fail on a dark image.

## Fonts

Source: Anatomy base styles (`lib/base-styles/variables.scss`).

https://github.com/bos-sci/anatomy-tokens/blob/develop/lib/base-styles/variables.scss

| Role | Family | Fallback |
| --- | --- | --- |
| Body | `SST-Roman` (weight 400) | Arial, Helvetica, sans-serif |
| Headings / heavy | `SST-Heavy` (weight 500–900) | Arial, Helvetica, sans-serif |

SST is Boston Scientific's licensed brand typeface. Font binaries are not copied into this repository. The app declares the official family names and falls back to Arial/Helvetica when SST is not installed.

## Tone of voice

Boston Scientific's public tagline is **Advancing science for life.**

Write like a global medical-device company talking to patients and care teams:

- Professional, precise, and calm. Prefer short sentences and plain language.
- Patient-centered: the portal helps people stay connected to companion-diagnostic care, results, and their care team.
- Scientific and trustworthy. No slang, no humor, no invented clinical claims.
- Honest about the demo: this portal uses **synthetic data only**, never PHI.
- Product name in the UI: **Boston Scientific CDx Patient Portal**. Legal name in the footer: **Boston Scientific**.
