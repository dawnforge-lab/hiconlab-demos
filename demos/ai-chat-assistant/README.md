# Fettle Trade Supply: AI shopping assistant

Demo 2 of 14. Shows Hiconlab’s AI work: a trade counter assistant, built on the AI shopping assistant reference implementation, that understands the job, looks things up in the catalogue and answers with the right parts.

## Brand
**Fettle Trade Supply**, Attercliffe Road, Sheffield. A family-run trade counter selling fixings, plumbing, electrical, sealants, PPE and tools to Sheffield's trades since 1987, now online with next-day delivery. "Fettle" is Yorkshire for putting something right, which is what the counter staff have always done.

- Sub-brands (all fictional): **Fettle** (house brand: bolts, nuts, washers, rod, screws, plugs, guns, levels), **Torrin** (anchors, power tools, drill bits), **Calverd** (plumbing), **Ohmway** (electrical), **Tackwell** (sealants and adhesives), **Shieldby** (PPE).
- Name check (31 Oct 2026): searched the web for "Fettle" trade supplies / fixings / builders merchant in Sheffield and the UK. Nothing of that name in the trade came up (results were other Sheffield fixings firms and an unrelated "fettler" job advert). The sub-brand names were searched together and returned nothing.
- Contact details are fictional: 0114 496 0372 (Ofcom drama range for Sheffield), sales@fettle.example.co.uk, Unit 7 Carbrook Works, Attercliffe Road, Sheffield.

## Audience
Plumbers, electricians, fixers and fit-out crews ordering from site on a phone, plus capable DIYers. They know what the job is but not always what the part is called in our catalogue, and they want the right part first time.

## Art direction
**Trade counter ledger.** Warm paper, Brunswick-green ink, condensed signage type, and products laid flat on the counter. Calm, dense, practical; nothing glossy.

- Palette: paper `#F2EFE8` (page), counter `#E4E0D8` (photo tiles, matches the photo backdrop exactly), ink `#191D1B`, ink-2 `#4A514D`, rule `#CFC9BD`, Brunswick green `#1F4A3A` (primary), green tint `#DCE5DE`, brass `#B88A2E` (marks and highlights; `#7F5D16` for text), rust `#A8452A` (out of stock), card white `#FBFAF6`.
- Type: **Archivo** (variable, width axis) at 72% width, weight 800 for display and prices, like printed price tickets and shop signage; **IBM Plex Sans** for body copy at a 60–70 character measure; **IBM Plex Mono** for SKUs, lookups and small labels, like a counter docket.
- Signature details:
  1. Product photos sit on the same counter-grey as their tiles, so objects look laid out on the counter rather than boxed in.
  2. The assistant's lookups print like a docket ("Searching chemical anchors · concrete screws") with ticks as each one finishes, before the answer streams in.
  3. A numbered thumb index for the six sections (01 Fixings … 06 Tools), the way a printed trade catalogue is tabbed.
- Imagery: overhead flat-lay catalogue photos, one warm light-grey paper backdrop, one soft light from the top left with a short shadow to the bottom right. No packaging, so no text in images. Generated with fal (`fal-ai/flux-2-pro`, 1024×1024), then flat-field corrected in Python to one backdrop colour (`#E4E0D8`), cropped 4% and exported to WebP at 640 and 240 px.
- Icons: one inline SVG set, 1.75px stroke, drawn for this demo.

## Screens (one page, three states)
1. **Storefront**: delivery strip, header with section nav and basket, hero "What's the job?" with the big search combobox and example jobs, counter photo still life, thumb-index of sections, most-ordered products, counter details.
2. **Autocomplete** (as you type): product suggestions with photo, sub-brand, SKU, price and stock, matched text highlighted, synonyms explained (mastic → silicone, chemfix → chemical anchor, speedfit → push-fit, fuse box → consumer unit and others), section suggestions, and "Ask the counter" when the query reads like a question or a job. Full ARIA combobox: arrows, Home/End, Enter, Escape.
3. **Results**: either a plain product grid with section filters and sort (for "silicone"), or the assistant's answer inline: the question, the lookups, a streamed reply, up to three product cards with add-to-basket, and follow-up chips that add the next answer below. Basket drawer with ex VAT subtotal, VAT at 20%, delivery and total.

Scripted conversations (keyword matched): heavy bracket into concrete (+ what else, damp hole and the out-of-stock vinylester, cure times), M10 bolts then the coastal follow-up, 15mm PEX to a radiator (+ clips, the pipe itself), delivery, returns, click and collect, consumer unit and RCBOs (trade only), sealing a shower tray, order problems, load ratings it won't invent, off-topic, and an honest fallback that shows the plain search instead.

## Tour (about 40 s, recorded at 1536×864 and scaled to 1920×1080)
| Time | Beat |
|---|---|
| 0–1.5 s | Calm storefront, nothing moving. |
| 1.5–6 s | Cursor clicks the search box and types "fix a heavy bracket into concrete". Suggestions change as words land: heavy-duty gun, then concrete screws, chemical anchor, SDS bits, the Anchors section, and the "Ask the counter" row appears. |
| 6–7.5 s | Cursor moves to "Ask the counter" and clicks. |
| 7.5–9.5 s | Search compacts; docket prints "Searching chemical anchors · concrete screws", then "Checking stock and lead times", ticks. |
| 9.5–16 s | Reply streams in: polyester for dry holes, vinylester for damp or cracked (out of stock, 7 working days), concrete screws for lighter loads, an honest note on load ratings. Three product cards rise in. **Poster.** |
| 16–18 s | Cursor clicks the chip "What else will I need?". |
| 18–25 s | Second docket and reply: heavy-duty gun, 12mm SDS bit, M10 rod, hole cleaning, total with resin £32.28 ex VAT. Cards. |
| 25–29 s | Cursor adds the heavy-duty gun, then the SDS bit: toast, basket count 1 → 2. |
| 29–40 s | Buttons settle to "1 in basket", toast shows 2 items · £19.15 ex VAT; hold on the resolved answer with the sticky header's basket count at 2. |

## Files
- `index.html`: the page.
- `assets/css/site.css`: all styles.
- `assets/js/data.js`: catalogue (59 products shaped like the real product record), synonyms, sections.
- `assets/js/answers.js`: scripted assistant replies and their keyword rules.
- `assets/js/app.js`: search, autocomplete, streaming, basket.
- `assets/js/tour.js`: the scripted story.
- `assets/img/products/`: product photos (WebP 640 and 240).
- `assets/fonts/`: Archivo, IBM Plex Sans, IBM Plex Mono (see FONTS.md).

## Image prompts
Every prompt used this frame, with the subject swapped in:

> Overhead flat lay product photograph, camera pointing straight down. {subject}. Uniform flat warm light grey paper surface filling the whole frame, evenly lit, no vignette. Soft diffused light from the top left, short soft shadow to the bottom right. Clean commercial catalogue photography, true-to-life colour, sharp focus, subject centred and occupying about 45–60 percent of the frame. No text, no logos, no markings, no labels.

Subjects (one per photo id): one A2 stainless M10 × 50 hex bolt with nut and washer; the same in bright zinc; six stainless hex nuts; a fanned stack of washers; a fully threaded zinc M10 rod with one nut; a fat dark slate resin cartridge with a clear static mixer; one zinc concrete screw with a hex washer head; five yellow-zinc pozi wood screws; eight red wall plugs; a length of 15mm copper; a copper solder-ring elbow; a white push-fit elbow and tee with grey collets; five stainless pipe inserts; a coil of white PEX; a white and chrome TRV; a chrome inline isolating valve; reels of white and yellow PTFE tape; four white saddle pipe clips; a coil of grey twin and earth with stripped end; a white steel consumer unit; a single white RCBO; a white UK twin switched socket; a white LED downlight with spring clips; a fan of black cable ties; a round white junction box; plain white, grey and amber sealant/adhesive cartridges; a heavy-duty skeleton gun; a plain white foam can; a black safety boot; grey nitrile-palm gloves; clear safety glasses; a folded yellow hi-vis vest; a white valved FFP3 mask; an olive-green and black cordless drill and battery; an SDS Plus bit; an olive-green tube cutter; an aluminium spirit level.

fal spend: round 1, 56 images at $0.03 = $1.68. Round 2 (critic fixes), 37 images = $1.11: a distinct photo for every product whose colour, material or form differs (zinc nuts and washers, brown plugs, clear and general-purpose silicone, A2 and M12 rod, standard gun, drill body only, M8 bolts, short concrete screws, 40A RCBO, 22mm copper, inserts and elbow, separate PTFE reels, SDS pair, black vinylester cartridge), plus regenerations of the cutter, junction box, valve, downlight, gloves, hybrid adhesive, foam can, battery, white silicone and the polyester cartridge. Round 3, 16 images = $0.48: regenerated metal parts without paper glare (M8 and M10 zinc bolts, zinc nuts, both concrete screws, M12 rod, a single long M10 rod) and the vinylester cartridge; the backdrop correction now uses a two-segment curve so highlights never clip. **Total $3.27.** All 59 products have their own photo.
