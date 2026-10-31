# Building a demo

How every demo in this repo is put together. Read `QUALITY_BAR.md` first: it is what the demo will be judged against.

## Rules
- Work only inside `demos/<id>/`. Do not edit `shared/`, `tools/`, other demos or `vendor.json`. If you need a shared change, say so in your report.
- Plain HTML, CSS and JavaScript. No build step, no framework, no bundler. Small, readable files.
- Every URL is relative, so the demo works under any sub-path. Pages are served over HTTP (`npm run serve`, then `http://localhost:4173/demos/<id>/`).
- Nothing loads from the internet at view time. Not fonts, not images, not scripts.
- UK English, plain and friendly. Fictional brands, people and data only.

## Folder layout
```
demos/<id>/
  index.html            home or main screen
  <inner>.html          second page where the kind needs one (websites)
  assets/
    css/site.css
    js/app.js           the demo itself
    js/tour.js          the scripted story (HiconTour.define)
    img/                optimised WebP/AVIF/JPG, sized for their slot
    fonts/              woff2 files plus FONTS.md (package, version, licence)
    models/             3D assets, if any
  README.md             art direction, brand, sources, image prompts, tour outline
```
Add a footer line to every page: "A Hiconlab demo. All businesses, people and data are fictional." (recreations of real sites say "Design recreation for portfolio purposes."). Style it to suit the brand.

## Fonts
Use open-licence fonts (OFL or Apache) from Fontsource, without touching `package.json` (other builders run in parallel):
```bash
mkdir -p "$SCRATCH/fonts" && cd "$SCRATCH/fonts"
npm pack @fontsource-variable/fraunces@5.2.8        # pin an exact version
tar -xzf fontsource-variable-fraunces-5.2.8.tgz
cp package/files/fraunces-latin-wght-normal.woff2 <repo>/demos/<id>/assets/fonts/
```
Use the `latin` subset (covers £ and curly quotes). Write `@font-face` rules yourself with `font-display: swap`, and preload the one or two faces used above the fold. Record each package, version and licence in `assets/fonts/FONTS.md`.

## Shared libraries
Already vendored and pinned under `shared/vendor/`:
- `three@0.187.0/three.module.js` (+ `three.core.js`), addons under `three@0.187.0/addons/` (GLTFLoader, DRACOLoader, RGBELoader, RoomEnvironment, OrbitControls, RoundedBoxGeometry, EffectComposer, RenderPass, UnrealBloomPass, OutputPass, BufferGeometryUtils), Draco decoder under `three@0.187.0/draco/`.
- `gsap@3.15.0/` gsap, ScrollTrigger, SplitText, CustomEase, Flip (classic scripts, global `gsap`).

Three.js uses ES modules, so map it with an import map:
```html
<script type="importmap">
{ "imports": {
  "three": "../../shared/vendor/three@0.187.0/three.module.js",
  "three/addons/": "../../shared/vendor/three@0.187.0/addons/"
} }
</script>
<script type="module" src="assets/js/scene.js"></script>
```
Need another addon? Ask; it gets added to `vendor.json` centrally.

## Images (fal.ai)
- The fal MCP tools are available. Check pricing (`get_pricing`) before generating and keep a running total; stay within the budget in your brief and report what you spent.
- Art-direct one consistent look per demo (lens, light, colour grade, setting) and write the prompts into the demo README.
- Inspect every image at full size for AI artefacts (hands, teeth, eyes, text, warped objects) and regenerate rather than ship a flawed one.
- Save the originals outside the repo (your scratchpad). Commit only optimised versions, for example:
  `ffmpeg -i in.png -vf scale=1600:-2 -c:v libwebp -quality 82 out-1600.webp`
  and use `srcset`/`sizes`, `width`/`height` and `loading="lazy"` below the fold.

## The tour
Load the engine, then define the story:
```html
<script src="../../shared/tour/tour.js"></script>
<script src="assets/js/app.js"></script>
<script src="assets/js/tour.js"></script>
```
```js
HiconTour.define(async (t) => {
  await t.wait(900);                         // a settled first frame
  await t.caption('Customers describe the job in their own words');
  await t.type('#search', 'heavy bracket into concrete');
  await t.wait(500);
  await t.click('[data-suggestion="ask"]');
  await t.waitFor('.answer.is-complete', 15000);
  await t.poster();                          // the poster still
  await t.click('.chip[data-q="damp"]');
  await t.scrollTo('#basket', { offset: 120 });
  await t.wait(1800);                        // hold the final state
});
```
API (all async):
| Call | What it does |
|---|---|
| `t.wait(ms)` | pause |
| `t.waitFor(selector or fn, timeoutMs)` | wait for the demo to reach a state |
| `t.move(target, {at:[x,y], offset:[dx,dy]})` | glide the cursor to an element (scrolls it into view first) |
| `t.hover(target, {hold})` | move and rest; the element gets `.is-tour-hover` |
| `t.click(target, {after})` | move, press, ripple, real click |
| `t.type(target, text, {cps, clear})` | human-paced typing with input events |
| `t.press(key, target?)` | key press; Enter submits the field's form |
| `t.select(target, value)` | set a `<select>` |
| `t.drag(from, to)` | drag with pointer events; also fires `tour:drop` on `from` with `detail.target` |
| `t.scrollTo(target or px or 'bottom', {offset, duration, within})` | smooth scroll of the page or a scroll container |
| `t.caption(text, {ms, place})` | caption pill, required (3–5 per tour, see the bar, part C). Without `ms` it stays up while the tour carries on, until the next caption cross-fades in or `t.caption(null)` clears it; with `ms` it holds, clears and then resolves. `place: 'top'` when the action is at the bottom |
| `t.poster()` | marks the poster frame |
| `t.run(fn)` | call demo code directly for things a cursor can't reach |

Also: `HiconTour.active` (true in tour mode), `HiconTour.ready(async fn)` to hold the tour until assets load, and the `tour:start` / `tour:end` window events. Style hovers as `:hover, .is-tour-hover`.

The video is always 1920×1080. By default the page is recorded at a 1920×1080 viewport; dense interfaces (SaaS, dashboards) record at 1536×864, set in `demos/demos.json` as `"record": {"viewport": "1536x864"}` and scaled up, so the UI reads about 25% larger in the video. Write and check the story at that viewport. Keep it 20–45 s. Lead with a calm first frame, build to the one or two moments that sell the service, end on a resolved state held for 1.5 s or more.

## Checking
```bash
npm run check -- <id> --tour     # screenshots in .checks/<id>/, report.json, exit code
npm run record -- <id>           # media/<id>.mp4 and posters (add --headed for WebGL if headless is slow)
```
Look at every screenshot in `.checks/<id>/` yourself (375px and 1440px, fold and full page, reduced motion, tour end) before you call it done.

When the demo is ready, do not edit `demos/demos.json` yourself (builders run in parallel). Put the entry in your report instead: `"status": "built"`, a `"title"` and `"summary"` that match the brand, and `"pages": ["demos/<id>/", "demos/<id>/<inner>.html"]` if it has more than one page. The lead updates the file.

## Phone numbers and addresses
Use Ofcom's ranges reserved for drama: 020 7946 0000–0999, 01632 960000–960999, the 496 0000–0999 block of the big-city codes (0113, 0114, 0115, 0116, 0117, 0118, 0121, 0131, 0141, 0151, 0161, 0191), and mobiles 07700 900000–900999. Emails at the brand's own fictional domain, never linked out. Real towns and plausible (not real) street addresses are fine.
