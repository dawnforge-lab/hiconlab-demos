# Fenwright P39: 3D watch launch (demo 13)

A scroll-driven 3D launch page for a mechanical watch. Everything in the scene is built in code with Three.js, so the watch can turn over, come apart into its parts and change dial and strap live. No 3D model files are loaded.

## Brand
- **Fenwright**, watchmakers, Atherton Street, Prescot (Merseyside).
- Story: Prescot made the movements for most English watches for two centuries, then stopped in the 1950s. Fenwright was started in 2019 by two restorers who wanted to make a watch there again; the P39 is the first with a movement they design, make and finish themselves.
- Product: **Fenwright P39**, 39 mm steel automatic, Calibre FW-1, first batch of 150. £4,850 including VAT, £500 refundable deposit to reserve.
- Name check (31 Oct 2026): web searches for "Fenwright" watch Prescot and "Fenwright" watchmaker/watches returned no business of that name in any trade (results were about Prescot's watchmaking history and unrelated makers such as Fenwick Timepieces in Geneva, a different name).

## Audience
Collectors and first-time buyers of a "proper" mechanical watch, 30–60, who read Hodinkee and like independent makers. They want to see the movement, the finishing and the real numbers, then put down a deposit.

## Art direction
**"Workshop at night":** a dark, warm, bottle-green black stage, lit like a watchmaker's bench lamp, with brass hairlines and the restraint of a technical drawing. The watch is the only bright thing on the page.

| Role | Hex |
|---|---|
| Stage (background) | `#0c100e` |
| Stage raised | `#141a17` |
| Parchment (text) | `#ece6d8` |
| Muted text | `#a8a393` |
| Brass (accent, hairlines) | `#c9a46a` |
| Hairline | `rgba(201,164,106,.28)` |
| Dial: Mersey (blue sunburst) | `#1d3d66` |
| Dial: Fell (green sunburst) | `#26402f` |
| Dial: Salt (silvered grey) | `#d4d7d6` |
| Strap: Chestnut calf | `#4e2711` |
| Strap: Black calf | `#0f0e0d` |
| Strap: Oxblood cordovan | `#3a0d11` |

- **Type:** Bodoni Moda (optical sizes, used large and in italic for the voice) with Instrument Sans for reading text and UI, and IBM Plex Mono for part numbers and specifications. The pairing is "engraved caseback" plus "service manual".
- **Signature details:**
  1. A vertical minute track on the right edge is the scroll indicator: sixty ticks, every fifth one longer, filling in brass as you go down the page, with the section name beside it.
  2. The exploded view is drawn like a technical drawing: numbered brass leader lines from each part to a label column, which track the parts live as they separate.
  3. The watch is alive: set to 10:10 like a catalogue photograph and running from there, with an 8-beat sweeping seconds hand, a balance wheel beating at 4 Hz and a rotor that swings under gravity as the watch is turned.
- **Imagery:** none besides the 3D scene. No fal images were generated (spend $0): the brief allowed a backdrop texture, but a CSS lamplight gradient and grain did the job without one.
- **Fallback stills** (`assets/img/still-*.webp`): rendered from the scene itself with `?still=front&dial=mersey|fell|salt`, `?still=back` and `?still=exploded` (transparent PNG at 2x from the canvas, trimmed and saved as WebP). `?nowebgl=1` previews the fallback.

## The 3D watch (all procedural, `assets/js/watch.js`)
Case, bezel and caseback from `LatheGeometry` profiles with hard edges between runs; lugs lofted along their length with a faceted section (flat top, polished outer chamfer), widest where they leave the case; spring bars; fluted screw-down crown; domed sapphire crystal and display back drawn as reflection-only glass (black, additive, alpha untouched) with a faint edge band, so the dial and movement stay sharp behind them; sunburst dial (anisotropy map) with a printed layer from a canvas texture; faceted applied indices and dauphine hands; Calibre FW-1 with a perlage pillar plate, frosted gilt three-quarter plate, gilt wheels under it, snailed keyless wheels, rubies in gold chatons, small domed slotted blued screws, balance wheel with hairspring and a skeleton rotor with Prescot stripes; padded, tapering, hand-stitched strap swept round a wrist, rolled round the spring bars, with keeper and pin buckle under the wrist. PMREM `RoomEnvironment` with softboxes, Neutral tone mapping, a slow light sweep, a contact shadow rendered from below. In the exploded view the movement turns round as it comes out so its finished side faces you.

## Page
One page, `index.html`:
1. **Hero:** "Made in Prescot. Again." The watch fades up from the dark and turns slowly.
2. **The movement:** the watch turns over to show the display back and Calibre FW-1 working.
3. **Exploded view:** nine labelled parts with leader lines (numbered dots and a list on phones).
4. **Dial and strap:** three dials (Mersey, Fell, Salt) and three straps as swatches; the watch changes live.
5. **Specifications:** a two-column spec sheet beside the watch at three-quarters.
6. **Reserve:** price, batch size, a short form (name, email, dial, strap) with a success state (nothing is sent).
7. Footer: workshop address, drama-range phone number, demo line.

## Layout notes
- Wide screens: each section's copy fades in once the watch has settled into its pose and out as it leaves, so the model never passes through text.
- Phones: the watch keeps the top of the screen and the copy scrolls up underneath it, so a swatch tap is always visible.

## Performance and fallbacks
- Device pixel ratio capped at 1.75; if frames run long it drops straight to 1.5, then towards 1. The render loop pauses when the tab is hidden or the stage is scrolled away; the contact shadow is re-rendered only when the pose changes.
- Styled loading state (minute track filling while the scene is built and shaders compile).
- No WebGL: a static image rendered from the scene (per section and per dial) replaces the canvas.
- Reduced motion: no auto-rotation, no light sweep, seconds hand parked; scroll moments become stepped states that fade between poses.

## Tour (about 42 s at 1920×1080)
| Time | Beat |
|---|---|
| 0–3 s | Settled hero, watch turning slowly, light sweep across the case |
| 3–9 s | Smooth scroll: the watch turns over to the display back, balance and rotor working |
| 9–16 s | Scroll on: the watch comes apart, leader lines and labels draw in (poster frame) |
| 16–25 s | Scroll to dial and strap; click the Fell (green) dial, then the Oxblood strap |
| 25–30 s | Scroll to specifications |
| 30–42 s | Scroll to Reserve, type a name and email, reserve; the confirmation is held |

## Recording
Recorded with `npm run record -- watch-3d --headed`. Headed Chromium uses the GPU and delivered about 58 frames a second (2,185 frames in 37.4 s); the headless run fell back to software WebGL and managed about 6 (326 frames, 50.8 s), so the headed take is the one in `media/`. For the same reason `npm run check --tour` estimates about 80 s in headless: its timing includes the slow software load, not the tour itself.

## Files
- `assets/js/watch.js`: builds the watch (geometry, materials, explode, time, rotor physics)
- `assets/js/textures.js`: canvas textures (dial printing, sunburst, gilt plate, rotor, caseback, leather)
- `assets/js/scene.js`: renderer, environment, contact shadow, scroll poses, callouts, colour changes
- `assets/js/data.js`: dials, straps, parts
- `assets/js/app.js`: loader, section track, swatches, reserve form, fallback
- `assets/js/tour.js`: the scripted story
