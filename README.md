# Hiconlab demos

Portfolio demos for Hiconlab: interactive HTML/JS showcases, plus 20–45 second videos recorded from them. Each demo has its own fictional UK brand. They are showcases only: no live AI, no backend, no links to real websites.

## Run it
```bash
npm install
npm run serve            # http://localhost:4173/
```
Open the index at `http://localhost:4173/`, or a demo at `http://localhost:4173/demos/<id>/`. Add `?tour=1` to watch its scripted story (any click or key press hands control back).

## Commands
| Command | What it does |
|---|---|
| `npm run serve` | static server for the whole repo |
| `npm run check -- <id> [--tour]` | quality checks and screenshots into `.checks/<id>/` (`--all` for every built demo, `--index` for the index page) |
| `npm run record -- <id>` | records the tour to `media/<id>.mp4` plus posters (`--all`, `--headed` for WebGL) |
| `npm run vendor` | recopies the pinned third-party files listed in `vendor.json` |
| `npm run build` | builds the public site into `dist/` (index, demos, shared files, media and a `_headers` file) for Cloudflare Pages |

Requires Node.js 22+ and ffmpeg on the PATH. Playwright uses its own Chromium (`npx playwright install chromium` if missing).

## Layout
```
index.html             the index of every demo
demos/demos.json       the list of demos (id, title, service, status, pages)
demos/<id>/            one folder per demo, self-contained
shared/tour/tour.js    the scripted-cursor tour engine
shared/vendor/         pinned Three.js and GSAP
tools/                 serve, check, record, vendor
media/                 recorded MP4s and posters
docs/                  building guide and source briefs
QUALITY_BAR.md         what every demo is judged against
```

## Hosting

The demos are published at `https://demos.hiconlab.com` from the Cloudflare Pages project `hiconlab-demos` (in Ebucurescu@gmail.com's Cloudflare account; also at `https://hiconlab-demos.pages.dev`). Deploys are direct uploads, not a Git connection, so publish after each change:

```bash
npx wrangler login                          # once per machine
CLOUDFLARE_ACCOUNT_ID=465a8fc85098ab1ec8302aac08f9e1f2 npm run deploy
```

`npm run deploy` builds `dist/` and uploads it. `FRAME_ANCESTORS` (space-separated origins) sets which sites may embed the demos; the default is `https://hiconlab.com https://www.hiconlab.com`, so add the staging site's origin when deploying for staging tests.

- Use `wrangler pages deploy` (as the script does), never `wrangler deploy` or `wrangler pages project create`: wrangler 4.15x turns those into a Workers deploy of the whole folder.
- `demos.hiconlab.com` is a custom domain on the project. The hiconlab.com zone lives in another Cloudflare account, so its DNS has a CNAME `demos` → `hiconlab-demos.pages.dev`, set to DNS only (a proxied record hides the CNAME from Pages and verification fails).
- Every page is `noindex`: the portfolio pages on hiconlab.com are the ones meant for search. hiconlab.com embeds the demos (its `DEMOS_URL`) and shows the videos from its own media library.

## Licences
Three.js (MIT), GSAP (free standard licence from GreenSock/Webflow), fonts listed per demo in `assets/fonts/FONTS.md` (OFL or Apache). Images are generated for these demos.
