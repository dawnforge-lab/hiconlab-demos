# Upwich electrolyte tablets: 3D launch page (demo 12)

A scroll-driven 3D launch page for a tube of fizzing electrolyte tablets. Everything in the scene is built in code with Three.js: the printed aluminium tube, the ribbed cap with its spring, the tablets, the glass of water and the bubbles. The only "assets" are canvas textures drawn at load time, so the 3D payload is the code itself (well under 5 MB).

## Brand
- **Upwich**, Droitwich Spa, Worcestershire. Named after the Upwich brine pit, the deepest of the town's three pits, which supplied most of its brine.
- Story: Droitwich has made salt from its brine for over two thousand years. Upwich was started in 2022 by Nia and Tom Hadley, a sister and brother who run and cycle round the county and wanted a tablet that tasted less like a sweet shop. They make one product: a tube of 20 fizzing electrolyte tablets, with salt evaporated from Droitwich brine.
- Product: **Upwich electrolyte tablets**, tube of 20, three flavours (Lemon & lime, Blackcurrant, Blood orange). £7.50 a tube, or £6.00 a tube on a four-weekly subscription.
- Name check (31 Oct 2026): web searches for "Upwich" electrolyte tablets Droitwich and "Upwich" supplements / hydration / nutrition brand returned no business of that name in any trade. Results were about the historic Upwich brine pit in Droitwich, and unrelated brands (U Hydrate, Hydralyte, LVL UP, UP&RUN).

## Audience
Runners, cyclists, walkers and people on their feet all day, 25–55, who already buy electrolyte tabs in Boots or online and read the back of the tube. They want to know exactly what is in it, how it tastes and what it costs, then add a tube to the basket.

## Legal care (UK)
- Food supplement. No medical or disease claims, no "hydrates you", no "replaces what you sweat".
- The only health claims are authorised ones, worded as on the GB register, and each nutrient is at least 15% NRV per tablet:
  - Potassium 300 mg (15% NRV): "Potassium contributes to normal muscle function."
  - Magnesium 60 mg (16% NRV): "Magnesium contributes to electrolyte balance" and "…to the reduction of tiredness and fatigue."
- Sodium and chloride are stated as plain amounts only.
- Mandatory statements: recommended daily dose, do not exceed, not a substitute for a varied diet, keep out of reach of young children, polyol laxative warning (sorbitol is over 10% of the tablet).

### What one 5.00 g tablet is made of (adds up)
| Ingredient | g | Contributes |
|---|---|---|
| Citric acid | 1.24 | 3.72 kcal / 16.1 kJ |
| Sodium bicarbonate | 1.00 | 274 mg sodium |
| Sorbitol (sweetener) | 1.00 | 2.4 kcal / 10 kJ |
| Potassium bicarbonate | 0.77 | 301 mg potassium |
| Droitwich brine salt (sodium chloride) | 0.58 | 228 mg sodium, 352 mg chloride |
| Magnesium carbonate | 0.21 | 61 mg magnesium |
| Natural flavouring | 0.18 | |
| Steviol glycosides (sweetener) | 0.02 | |
| **Total** | **5.00** | |

Per tablet / per daily dose of 2: energy 26 kJ/6 kcal / 52 kJ/12 kcal; fat, saturates, sugars, protein 0 g; carbohydrate (all polyols) 1.0 g / 2.0 g; salt 1.25 g / 2.5 g; sodium 500 / 1,000 mg; potassium 300 / 600 mg (30% NRV); magnesium 60 / 120 mg (32%); chloride 350 / 700 mg (88%). %NRV is given for the daily dose. "With sweeteners" sits next to the product name (hero, label, buy, basket).

### Prices (all include VAT at 20%)
- One tube (20 tablets): £7.50. Subscription, delivered every 4 weeks: £6.00 a tube (20% off).
- Delivery £2.95, free on orders of £15 or more. Repeat subscription deliveries post free.
- The basket shows the VAT included (total ÷ 6).

## Art direction
**"Salt in daylight":** the opposite of a dark product stage. A bright, salt-white page, crisp like a chemist's shelf in the morning, with deep brine-navy type and one strong flavour colour that runs through the tube, the tablets, the water and the page wash. Clean, factual, a little bit joyful.

| Role | Hex |
|---|---|
| Salt (background) | `#f3f1ea` |
| Salt raised (panels) | `#e9e6dc` |
| Brine ink (text, buttons) | `#13232d` |
| Muted ink | `#4c5a62` |
| Hairline | `rgba(19,35,45,.16)` |
| Lemon & lime: tube / wash | `#dfe04e` / `#f1f0c4` |
| Blackcurrant: tube / wash | `#4a1f4f` / `#ecdeea` |
| Blood orange: tube / wash | `#e8622f` / `#f8e0d2` |

- **Type:** Mona Sans (variable, width 75–125) used wide and heavy for the wordmark and headings, normal width for reading text; Spline Sans Mono for nutrition figures, weights and small labels. A wide grotesque on the tube and a mono "lab sheet" for the numbers.
- **Signature details:**
  1. The tube's label is real, readable packaging: a vertical UPWICH wordmark up the front, a cube salt-crystal mark, and on the back the same nutrition panel and directions as the page, so turning the tube is reading the label.
  2. Flavour changes fill the tube with the new colour from the bottom up, like liquid rising, while the tablets, the water in the glass and the page wash change with it.
  3. The fizz is scrubbed by scroll: a tablet drops into the glass and dissolves as you read, with a time-lapse clock counting 0:00 to 2:00 and bubbles that thin out as it finishes.
- **Imagery:** none besides the 3D scene and inline SVG icons (one set, 1.6 px strokes). No fal images (spend $0).

## Page
One page, `index.html`:
1. **Hero:** "A pinch of Droitwich in every bottle." The tube stands and turns slowly.
2. **The label:** the tube turns to its back panel; per-tablet minerals and the authorised claims.
3. **Inside:** the cap lifts off (spring inside) and the top tablets rise and fan out; the ingredients by weight, adding up to 5.00 g.
4. **Fizz:** a tablet drops into a glass and dissolves as you scroll; time-lapse clock and the nutrition table.
5. **Flavours:** three flavours; the tube, tablets, water and page change live.
6. **Buy:** flavour, one-off or subscription, quantity, add to basket. A basket drawer with lines, delivery, VAT and a total; checkout is switched off (demo).
7. Footer: address, drama-range phone number, food supplement small print, demo line.

## Performance and fallbacks
- Device pixel ratio capped at 1.75 and stepped down if frames run long; the loop pauses when the tab is hidden.
- Styled loading state: a tablet fizzing away in a glass while the scene is built and shaders compile.
- No WebGL (or `?nowebgl=1`): still images rendered from the same scene replace the canvas, per section and per flavour.
- Reduced motion: no auto-rotation, no bubbles rising, scroll moments become stepped states that fade between poses; flavour changes swap instantly.

## Tour (about 39 s at 1920×1080)
| Time | Beat |
|---|---|
| 0–4.5 s | Settled hero, the tube turning; "A product launch page you can turn in your hand" (about 3 s) |
| 4.5–8 s | The tube turns to its printed back panel; "Shoppers read the real label before they buy" |
| 8–13 s | The cap lifts off on its spring, the tablets fan out (poster); "Open it up and show what's inside" |
| 13–23 s | "Customers see exactly how it dissolves": a 1.4 s drop, an even 4 s run of the clock to 2:00, a short hold |
| 23–31 s | "Try each flavour, then add it to the basket": Blackcurrant, then Blood orange |
| 31–39 s | Every 4 weeks, two tubes, add to basket; basket £12.00 + £2.95 = £14.95 (includes £2.49 VAT), held |

## Fallback stills
`assets/img/still-*.webp` are rendered from the scene itself with `?still=hero|label|inside|fizz&flavour=…` (transparent canvas, trimmed, saved as WebP from the browser). `?nowebgl=1` previews the fallback.

## Recording
Recorded with `npm run record -- supplements-3d --headed` (GPU-backed window, about 59 fps captured: 2,298 frames in 39.1 s). The 3D scene runs at 60 fps at 1920×1080 on this machine.

## Files
- `assets/js/product.js`: builds the tube, cap, spring, tablets, glass, water and bubbles; the flavour wipe shader
- `assets/js/textures.js`: canvas textures (tube label per flavour, tablet face and deboss, brushed aluminium, foam)
- `assets/js/scene.js`: renderer, daylight environment, scroll poses, the fizz, flavour changes, stills
- `assets/js/data.js`: flavours, label panel, tablet weights, prices
- `assets/js/app.js`: loader, flavour choice, fizz clock, buy form, basket drawer, fallback
- `assets/js/tour.js`: the scripted story
