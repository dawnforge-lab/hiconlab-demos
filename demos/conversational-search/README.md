# Scarth, Settle: conversational product search (demo 1)

Demo 1 of 14. Shows Hiconlab’s AI ecommerce work: a shop search that reads a plain-English request, decides which products fit and shows how it decided. It is a search, not a chatbot: no bubbles, no typing indicator, no streamed prose, no assistant persona. Every query ends in products, a row of editable “understood as” chips and a picture of the narrowing from the whole shop to the matches.

## Brand
**Scarth**, walking and outdoor kit, Settle, North Yorkshire. A family shop at the foot of the Dales, two minutes from the station, fitting boots for people walking the Three Peaks and the Settle–Carlisle hills since 1994. “Scarth” is the old Dales word for a notch or gap in a ridge, the way through.

- Own label **Scarth** (base layers, socks, value boots and waterproofs) plus four fictional makers: **Garron** (boots and shoes), **Corrie** (waterproof shells), **Smoor** (insulated jackets; Scots for banking a fire to keep it in overnight), **Larig** (rucksacks).
- Name check (31 Oct 2026): searched “Scarth” outdoor shop Settle, “Scarth Outdoor(s)” UK, and Scarth Settle shop. Nothing of that name in the trade came up; only place names (Scarth Gap, Scarth Nick, Scarth Hill) and other Settle shops. Sub-brands searched: Garron, Larig, Corrie and Smoor returned no outdoor brands. “Haar” was dropped because it is a real Scottish clothing brand.
- Contact details are fictional: 2 Ribble Yard, Station Road, Settle BD24 9ZZ (fictional yard and postcode), 01632 960 418 (Ofcom drama range), hello@scarth.example.co.uk.

## Audience
Walkers buying online who know what they are doing but not which product does it: “waterproof walking boots for wide feet under £120”, “a warm jacket for winter hillwalking”, “30 litre daypack, not black”. Mostly on a phone in the evening, often after a wet walk.

## Art direction: “fell weather”
Cool limestone mist and slate, the colour of the Dales on a wet day, with one hi-vis accent borrowed from mountain rescue. The search sits on a slate band printed with faint contour lines, like the margin of a walking map. Calm, outdoorsy, practical; nothing glossy, no warm paper (the other commerce demo is warm paper and green ink).

| Token | Hex | Use |
|---|---|---|
| Mist | `#E7EBE8` | page |
| Paper | `#F9FBF9` | cards, panels |
| Tile | `#DDE2DE` | product photo tiles (matches the photo backdrop exactly) |
| Slate | `#17212A` | ink, text |
| Slate 2 | `#46525C` | secondary text |
| Rule | `#C8D0CC` | hairlines |
| Band | `#1B2833` | the search band |
| Band 2 / Contour | `#263746` / `#31475A` | band panels, contour lines |
| Rescue orange | `#EE5A24` | the matches, the active stage, primary action on slate |
| Rescue ink | `#B33F14` | orange text on light (AA) |
| Lichen | `#6F8F5B` / `#4C6B3B` | preferences met (“nice to have” ticks) |
| Tarn | `#2E6A8A` | links, focus on light |

- **Type:** **Bricolage Grotesque** (variable: weight, width, optical size) for headings, chips, prices and the big counts; it has the slightly rough, hand-cut character of painted fingerposts. **Atkinson Hyperlegible Next** for body and UI, designed for legibility, which suits a search people read fast. **Atkinson Hyperlegible Mono** for counts, kind labels on chips and grid references.
- **Signature details:**
  1. **The decision strip** (“How we picked these”). One column per step: whole shop → category → each must-have → budget, each with a big count and a dot grid of all 74 products in the same positions. Dots empty out step by step, so you watch the shop narrow; the survivors light up rescue orange in the last column. Below it, one line says how the survivors were ranked.
  2. **Chips as a route card.** Each chip carries a small mono kind label: WHAT, MUST, BUDGET, FOR, PREFER. Must-haves are solid, preferences dashed. Click one to change it, make it optional, or remove it. “Didn’t use” words sit at the end, struck through, never silently dropped.
  3. **Contour band.** The search band is printed with faint SVG contours and the shop’s grid reference (SD 819 637), like the edge of an OS sheet.
- **Imagery:** studio catalogue photos, one look: footwear in side profile (toe left), clothing on a ghost mannequin, rucksacks in front three-quarter view, socks as a flat lay; soft studio light from the left, true-to-life colour, no people, no text or logos. Every photo is cut out and recomposited on the exact tile colour (`#DDE2DE`) with one consistent shadow, so the grid reads as one shoot. The hero has no photo: it is a contour map drawn for this demo (`assets/img/contours.svg`, generated from a height field with a notch in the ridge, the “scarth”).
- **Icons:** one inline SVG set drawn for this demo, 1.75px stroke, round caps.

## Screens (one page, two states)
1. **Shop front:** header (wordmark, sections, “Fitted in Settle”, basket), hero with the search (“Tell us what you need. We’ll find what fits.”), example searches, sections with counts, shop strip (fitting room, free returns, Settle shop hours).
2. **Search** (as you type): combobox listbox with the live reading of the query (“Reads as: walking boots · waterproof · wide fit · under £120 → 5 fit”), completed needs, sections and products, matched text highlighted. Arrows, Home/End, Enter, Escape.
3. **Results:** search band with the query and the “understood as” chips; the decision strip; a filter sidebar (in sync with the chips) and the ranked grid with a reason line per product, stock and size availability; the “Nearly” row of close misses with what they miss and a one-click relaxation; a no-match state that names the requirement to relax (“Nothing waterproof under £40. Show up to £80?”).

## The reader and the decision (plain JavaScript, deterministic)
- `assets/js/reader.js` turns text into criteria: categories and synonyms (cagoule, puffer, daypack, thermals…), must-haves (waterproof, wide/narrow fit, sizes in UK shoe and clothing sizes, men’s/women’s, leather, merino, down, crampon-compatible, rain cover, pit zips…), price phrases (“under £120”, “less than 100 quid”, “about a hundred quid”, “budget 80”, “boots for 100”, “between £50 and £80”, “£50–£80”, “around £100” as £85–£115, “cheap”; an impossible budget such as “under £0” is left off with a note), weights (“under 1kg”), capacities (“30 litre”, “daypack”), colours, uses mapped to rules (winter hillwalking → waterproof + B1 crampons for boots, 20,000 mm for shells, warmth 4+ for insulation), negations (“not leather”, “no down”, “isn’t black”, “except red”, “without wool”), UK half sizes (“size 9.5”), a bare “waterproof” as the jacket, typos within one or two letters including swapped letters (“wdie” → “wide”), kit we don’t sell (“fleece” shows insulated jackets and base layers instead; “kids” gets an honest note) and words it could not use.
- `assets/js/decide.js` filters on must-haves in order (the strip), ranks by a weighted sum (in stock first, then each preference, then reviews), builds the reason line, finds close misses (fail exactly one must-have) and relaxations.

## Tour (about 34 s, recorded at 1536×864, scaled to 1920×1080)
Nothing in the demo is random or dated, so every recording matches. Each caption is read while the screen is still and clears before the next thing moves under it.
| Time | Beat |
|---|---|
| 0–1.4 s | Calm shop front. |
| 1.4–4.5 s | Caption: “Shoppers search the way they’d ask in the shop”. |
| 4.5–10 s | Cursor types “waterproof walking boots for wide feet under £120”. The live reading and top matches in the dropdown change as words land. |
| 10–13 s | Enter. The hero folds into the search band; caption “Shoppers see what it understood and ruled out” while the chips land and the strip steps 74 → 16 → 13 → 7 → 5. |
| 13–14 s | Five boots rise into the grid. **Poster.** Cursor rests on the top card’s reason line. |
| 16–19 s | Cursor moves to the search box; caption “Add a detail and the results re-rank”. |
| 19–23 s | Types “ in green”, Enter. A dashed PREFER Green chip pops in and the grid glides into a new order, the moss-green boot first. |
| 23–29 s | Scroll to Nearly; caption “Close misses say exactly what they miss”; rest on “£9 over budget”; caption “One click lets the close miss in”; click “Show up to £130”. |
| 29–34 s | Scroll up so the chips, the strip (now 6) and the Garron Langstrath “Now in” at number 1 share the screen; held 3 s with no caption. |

## Files
- `index.html`, `assets/css/site.css`
- `assets/js/data.js` (74 products, sections), `reader.js`, `decide.js`, `app.js` (UI), `tour.js`
- `assets/img/products/` (WebP 480 and 960), `assets/img/contours.svg` (the band’s contour map)
- `assets/fonts/` (see FONTS.md)

## Image prompts (fal-ai/flux-2-pro, 1024×1024, seed 4242)
Every product used this frame with its own subject line from `data.js` (`subject`):

> Professional ecommerce catalogue photograph of {subject}. {view} A plain unbranded product with blank fabric surfaces: no logos, no badges, no lettering, no printed text, no labels or tags anywhere. Isolated on a plain seamless light grey studio background, evenly lit, nothing else in the scene. Soft diffused studio light from the left. True-to-life colour, crisp focus, the whole product in frame and centred, filling about 65 percent of the frame.

Views: footwear “Technical hiking footwear. Side profile view of the outer side, toe pointing to the left, camera level with the shoe.”; clothing “Ghost mannequin product shot: front view, upright and symmetrical…”; rucksacks “Front three-quarter view, standing upright on its base, shoulder straps behind it.”; socks “Flat lay seen from directly above, laid flat and neatly side by side, toes pointing to the left.”

Pipeline (scripts kept in the builder's scratchpad): generate → cut out with `fal-ai/birefnet/v2` (General Use, Heavy) → composite on `#DDE2DE` at 1200 px with a contact shadow (standing items) or a soft drop shadow (flat items) → WebP at 480 and 960.

## Photo status
All 74 products have a photo, checked at full size and on a contact sheet (no duplicates; colours and materials match the data). The first round shot 19 that were kept. The second round (31 Oct 2026, after fal credit was added) shot the other 48 and re-shot the 7 rejects (b09, b13, s01, s02, j01, j03, j05) plus b07, re-briefed as a padded-collar hillwalking boot rather than a toe-capped work boot.
- Prompt changes for round two: footwear “No tags or woven labels on the collar or tongue”; clothing and rucksacks “No logo patch … no printed lettering”. b13 became a sock-collar lightweight boot so it no longer duplicates b01.
- Clean-up: flux-2-pro still printed small logos, neck labels and sleeve badges on 34 images, so those were edited with `fal-ai/flux-pro/kontext` (“Remove every logo, emblem, badge, patch, brand label, woven tag, printed text … keep everything else the same”), then cut out again. Nine needed a second pass (i01, i03, i07, i08, i09, j03, j07, j10, l03).
- s01’s orange piping was lost in the clean-up, so its colour in the data is now plain Grey.

## fal spend
- Round one: about $1.10–1.60 (35 flux-2-pro images and their cut-outs).
- Round two: 56 flux-2-pro images at about $0.03 each (≈ $1.76), 46 Kontext edits at $0.04 (≈ $1.84), and about 100 birefnet cut-outs (≈ $0.12). That makes ≈ $3.70.
- Total: about $4.80–5.30.
