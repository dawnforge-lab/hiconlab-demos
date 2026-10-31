# Fonts

| File | Package | Version | Licence | Used for |
|---|---|---|---|---|
| `archivo-black-latin-400-normal.woff2` | `@fontsource/archivo-black` | 5.2.8 | SIL Open Font License 1.1 | The stat figures (+78%, 98%, −34%) and the blue “01/02/03” numbers in the position cards, exactly where the live site renders Archivo Black |

## Why everything else is the system font

kreativehub.net is designed in Archivo, Archivo Black, Newsreader (italic) and IBM Plex Mono, but on
31 Oct 2026 the live site did not render them. Its stylesheet sets `--display`, `--editorial` and
`--mono` on `:root` from next/font variables (`--font-display` and so on) that only exist on `<body>`.
At `:root` those references are invalid, so every rule that uses them falls back to Tailwind's default
stack `ui-sans-serif, system-ui, sans-serif`: Segoe UI on Windows, San Francisco on macOS and iOS,
Roboto on Android. Only inline styles that read `--font-display-black` directly reach Archivo Black.

This recreation reproduces what visitors actually see, so it uses the same system stack and vendors
only Archivo Black. Segoe UI and San Francisco are not redistributable and are not needed: they are
already on the visitor's machine, and nothing is downloaded at view time.

If the live site is fixed (for example by defining the next/font variables on `html`, or by moving
`--display`, `--editorial` and `--mono` onto `body`), add the Fontsource packages for Archivo
(variable), Newsreader (italic) and IBM Plex Mono, and point the four tokens at the top of
`assets/css/site.css` at them.
