# Fonts

All from Fontsource, latin subset, self-hosted. SIL Open Font License 1.1.

| File | Package | Version | Licence | Use |
|---|---|---|---|---|
| `bricolage-grotesque-latin-standard-normal.woff2` | `@fontsource-variable/bricolage-grotesque` (wght, wdth, opsz axes) | 5.3.0 | OFL-1.1 | Headings, chips, prices, counts; also supplies the figures (0–9) for body text |
| `atkinson-hyperlegible-next-latin-wght-normal.woff2` | `@fontsource-variable/atkinson-hyperlegible-next` | 5.3.0 | OFL-1.1 | Body and UI |
| `atkinson-hyperlegible-next-latin-wght-italic.woff2` | `@fontsource-variable/atkinson-hyperlegible-next` | 5.3.0 | OFL-1.1 | Italic (declared, rarely used) |
| `atkinson-hyperlegible-mono-latin-wght-normal.woff2` | `@fontsource-variable/atkinson-hyperlegible-mono` | 5.3.0 | OFL-1.1 | Kind labels, small caps labels, grid reference |

Atkinson Hyperlegible Next draws a slashed zero, which made prices and budgets look like code ("£12Ø"), so `site.css` maps U+0030–0039 of the body family to Bricolage with `unicode-range`.
