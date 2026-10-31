# Hollis & Daughter, exterior cleaning, south Bristol (demo 9)

Demo 9 of 14 (website). A local exterior cleaning firm’s website made by Hiconlab: a homepage with a before/after you can drag and an instant guide-price flow that ends in a booked free visit, plus an “Areas & rounds” page. No backend: nothing is sent anywhere.

## Brand
- **Name:** Hollis & Daughter. **Area:** south Bristol (Bedminster, Southville, Windmill Hill, Totterdown, Knowle, Brislington, Redcliffe, Clifton Wood). **Yard:** Unit 6, Malago Yard, Bedminster, Bristol BS3 4ZZ (fictional yard and postcode).
- **Story:** Mick Hollis started a ladder-and-bucket window round in Bedminster in 1998. His daughter Jas, a former lab technician, joined in 2017, put the first pure-water pole van on the road and added soft washing for render and roofs, which is what Bristol’s painted terraces need.
- **Team (all fictional):** Mick Hollis (windows, the round), Jas Hollis (soft washing, render and roofs), Dev Okafor (driveways, patios, solar), Kerry Lane (office and round bookings).
- **Name check (31 Oct 2026):** searched the web for “Hollis & Daughter” Bristol window cleaning and “Hollis and Daughter” exterior cleaning. No business of that name came up in any trade; results were other Bristol window cleaners and US firms in towns called Hollis.
- **Contact details (fictional):** 0117 496 0582 (Ofcom drama range for Bristol), hello@hollisanddaughter.example, company and VAT numbers are invented.

## Audience
Homeowners in south Bristol’s Victorian terraces and semis, 30–70, often on a phone in the evening, who look at a green-streaked render or a black driveway and wonder what it costs to fix. They want to see proof, a price they can trust, and someone local who turns up on the day they said.

## Art direction: “painted terrace, clean stripe”
Bristol’s painted houses (Totterdown, Clifton Wood) on a clean white page. Each service is a house in a coloured terrace; the one signature motion is a squeegee pass that wipes things clean. Bright, confident and friendly, the opposite of the blue-droplet cleaning look and of the muted, papery palettes of the other demos.

| Token | Hex | Use |
|---|---|---|
| Clean | `#FBFAF7` | page |
| Card | `#FFFFFF` | quote panel, tickets |
| Ink (Pennant) | `#17201E` | text, dark bands (named after Bristol’s blue-grey Pennant stone) |
| Ink 2 | `#4A5551` | secondary text |
| Rule | `#DAD6CC` | hairlines |
| Saffron | `#F2B233` | the clean stripe, primary action on ink, round days |
| Saffron deep | `#8A5C00` | saffron-family text on white (AA) |
| Plaster pink | `#F2C4B4` | painted house |
| Mint render | `#BFDDC7` | painted house |
| Lilac | `#CFC6E4` | painted house |
| Duck egg | `#C5DEDD` | painted house |
| Moss | `#4E5B24` | “before”, grime, the algae note |
| Brick | `#B4462B` | small warnings (fully booked, needs a visit) |

- **Type:** Fraunces (variable, SOFT 100, WONK on, weight 750–850) for headings, prices and the logo: soft, round and warm, like signwriting on a van. Schibsted Grotesk (variable) for body and UI, with tabular figures for prices and times.
- **Signature details:**
  1. **The squeegee.** The before/after handle is a drawn squeegee riding the divide; drag it and the grime goes. The same blade-stroke sits behind key words in headings as a saffron “clean stripe”.
  2. **Services as a painted terrace.** Six tall tiles with gable tops, each painted a different house colour, each with its from-price and an “Add to my price” button that drops the service into the quote.
  3. **The price ticket.** The guide price builds up live as a job ticket: lines ex VAT, a same-visit discount, VAT at 20%, the total, and the regular round price “a visit, inc. VAT”, with a round-day stamp for your postcode.
- **Imagery:** 35mm documentary photographs, Kodak Ektar 100 colour, bright soft late-morning sun, crisp, true colour, Bristol painted terraces. The team wear deep bottle-green softshells. No text, logos or house numbers anywhere in the images.
- **Icons:** one inline SVG set drawn for this demo, 1.75px stroke, round caps.

## Pages
1. `index.html`: utility strip, header with mobile menu, a full-bleed street hero (Mick on the round) with a dark bar underneath (postcode → round day → price, and which round is out today), the services terrace, before & after (driveway, render, patio), the guide-price flow, how a visit works, the team, reviews, rounds teaser, footer with local-business details.
2. `areas.html`: “Areas & rounds”: a drawn map of south Bristol coloured by round day, a postcode checker, the weekly round table, what happens on a round day, FAQs and a link back to the price flow.

## The guide-price flow (homepage, `#quote`)
1. **What needs doing:** windows, gutters (with fascias and soffits), driveway and paths, patio, render and roof (soft wash), solar panels.
2. **Your home:** postcode (gives your round day, or says honestly if you’re outside the area), property type, bedrooms, plus what the chosen services need: driveway and patio size in m² and surface, render front only or all round and whether the roof is included, number of solar panels.
3. **Regular window clean (optional, only when windows are picked; otherwise the flow goes straight to booking):** every 4 weeks, every 8 weeks or just this once.
4. **Your guide price:** the ticket, with a plain note on what “guide” means (we confirm in writing on the free visit before any work).
5. **Book:** a free visit to measure up, or a start date if nothing needs measuring (windows, gutters, solar). Day and arrival window, then name, mobile, email and first line of the address. Success state with a reference and what happens next.

Prices are held ex VAT; every total adds 20% VAT at the end and rounds to the penny once.

## Tour (about 41 s at 1920×1080)
In tour mode “today” is pinned to Monday 9 November, 10:15, the free slots on the booked day are fixed and the reference is HD-1111-4RT (day and month of the visit, never the year).
| Time | Beat | Caption |
|---|---|---|
| 0–1.5 s | Settled hero. | none |
| 1.5–9 s | Scroll to before & after; the squeegee is dragged across the driveway, then the Render tab (focus cleared) and a wipe to the middle. Poster on the render, half clean, framed to the dark section. | Customers see real results before they ring |
| 9–19 s | The price flow: windows, gutters and render ticked (the ticket builds and the 10% same-visit discount appears), postcode BS4 2RT typed (Wednesday round), semi with 3 bedrooms kept, every 4 weeks chosen. | A fair guide price in under a minute |
| 19–23 s | The cursor rests on the guide total, then on the round line (£22.80 a visit inc. VAT, on Wednesdays). | Every line adds up, with the VAT shown |
| 23–41 s | Book a free visit: Wednesday 11 November (the round day), 10:00–12:00; name, mobile and address typed; “Book my free visit”; the booked state and the ticket stamp, held 2.4 s. | Then they book a free visit on their round day |

All captions sit at the bottom, below the action. The worked example in the video: windows first clean £38.00 + gutters £78.00 + render front only £285.00 = £401.00, less 10% (£40.10) = £360.90 ex VAT, VAT £72.18, total £433.08; then £19.00 + £3.80 VAT = £22.80 a visit every 4 weeks.

## Pricing rules (`assets/js/data.js`)
Prices are held in pence, ex VAT. VAT at 20% is added once to the subtotal and rounded to the penny; single prices a customer reads on their own (the “from” prices, the round price, the fascia add-on) are shown inc. VAT. Two or more jobs that actually have work on the ticket take 10% off the one-off work (not off the regular round). Saturdays are for one-off jobs of any kind, for everyone, and the only day offered to BS2, BS5, BS6, BS7, BS9, BS31 and BS48; bank holidays and Christmas are never offered. Render, roofs, driveways and patios are flagged “we’ll measure” and can only be booked as a free visit; windows, gutters and solar can be booked straight in. Postcodes map to a round day by district (BS3 Tuesday, BS4 Wednesday, …); nearby districts get Saturday one-offs and no round; anywhere else gets an honest “we don’t cover you”.

## Images
Shared look: “35mm documentary photograph, Kodak Ektar 100 colour, bright soft late-morning sun with gentle shadows, crisp detail, true colour … No text, no logos, no signage, no house numbers.” Team in deep bottle-green softshells.
- `street` (hero): Mick cleaning an upstairs window of a yellow house on a steep painted terrace (fal-ai/nano-banana-2/edit, using the team photo as the likeness reference; 16:9 at 2K, plus a portrait crop for phones).
- Before/after pairs: the clean “after” was generated first (flux-2-pro, 1536×1024), then the “before” was made by editing that same image to add grime (nano-banana-2/edit for driveway and patio, flux-2-pro/edit for render) and registered to it with an OpenCV ECC affine fit. In round two each “before” was composited so that only the surface changes: the driveway keeps the “after” house, gate, bins and walls (only the paving and wall-foot weeds come from the edit), and the render keeps everything outside the middle house front. A house-number plaque was patched out of both driveway images.
- `team`: Mick and Jas by the open van (flux-2-pro, chest logos removed with flux-2-pro/edit).
- `softwash`: Jas soft washing green-streaked mint render, regenerated in round two with nano-banana-2/edit from the team photo so it is the same woman.
- `surface`: Dev with a rotary surface cleaner; round two re-coloured the cleaned paving a deep, even red (it read as bleached).
- `van`: inside the van; round two replaced a jerry can with a strapped 300-litre pure-water tank (flux-2-pro/edit), cropped to drop the door edge.

Originals are in the builder’s scratchpad (`hd-exterior-cleaning/orig`); the repo has WebP only.

## fal spend
9 flux-2-pro generations (about 14.4 MP at $0.03/MP ≈ $0.43), 9 flux-2-pro/edit runs (about 3 MP processed each ≈ $0.85) and 3 nano-banana-2/edit runs at 2K (≈ $0.30). Round one ≈ $1.60. Round two: 4 nano-banana-2/edit images at 2K (2 calls × 2) ≈ $0.32 and 2 flux-2-pro/edit runs ≈ $0.19. Estimated total about $2.10 of the $4 budget.

## Notes
- No submission anywhere: “Book” waits a moment, then shows the booked state. The areas-page postcode is kept in `sessionStorage` (wrapped in try/catch) so the price flow can pre-fill it outside tour mode.
- The “Add to price” buttons on the services terrace tick the same service in the flow and scroll to it.
- The map on the areas page is drawn for this demo and is not to scale; each district is keyboard-focusable and shows its day.
