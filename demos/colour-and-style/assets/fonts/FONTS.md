# Fonts

The live site loads Playfair Display and Manrope through next/font (Google Fonts). Both are open-licence, so the recreation uses the same families from Fontsource.

| File | Package | Version | Licence | Used for |
|---|---|---|---|---|
| `playfair-display-latin-wght-normal.woff2` | `@fontsource-variable/playfair-display` (axis: wght 400–900) | 5.3.0 | OFL-1.1 | Headings, numbers, prices |
| `manrope-latin-wght-normal.woff2` | `@fontsource-variable/manrope` (axis: wght 200–800) | 5.3.0 | OFL-1.1 | Body copy, navigation, buttons, forms |
| `manrope-cyrillic-wght-normal.woff2` | `@fontsource-variable/manrope` (axis: wght 200–800) | 5.3.0 | OFL-1.1 | Two reviewer names written in Cyrillic, loaded only when needed (`unicode-range`) |

Latin subset for everything else (covers £, curly quotes and dashes). Fetched with `npm pack` into the builder's scratchpad; `package.json` was not touched.

The logo is the site's own PNG artwork (converted to WebP), so its script lettering needs no font file.
