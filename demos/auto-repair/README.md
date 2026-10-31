# Ten to Two Garage, Shrewsbury (demo 10)

Demo 10 of 14 (website). An independent garage’s website made by Hiconlab, with online booking that starts from the number plate and ends in a booked slot, all without a backend.

## Brand
- **Name:** Ten to Two Garage. **Town:** Shrewsbury, Shropshire (real town). **Address:** The Old Coachworks, Tanner’s Yard, Coton Hill, Shrewsbury SY1 2ZZ (fictional yard and postcode).
- **Story:** Alun Pryce opened in a Victorian coachworks off Coton Hill in 1994 and named it after the first thing he told every apprentice: hands on the wheel at ten to two. Nia Hughes was one of those apprentices; she has run the garage since 2019, and Alun still comes in on Thursdays for the electrical faults nobody else can find.
- **Name check (31 Oct 2026):** web searches for "Ten to Two" garage Shrewsbury and for "Ten to Two Garage" / "Ten to Two Motors" with MOT and car repairs in the UK found no business of that name in the trade (results were other Shrewsbury garages and general listings). We avoid real Shrewsbury streets that have garages on them.
- **Team (all fictional):** Nia Hughes (owner, MOT tester), Alun Pryce (founder, diagnostics on Thursdays), Tomasz Bielski (technician, hybrid-qualified), Ellie Morgan (apprentice, tyres), Bev Davies (front desk).
- **Contact details (fictional):** 01632 960 482 (Ofcom drama range), hello@tentotwogarage.example. Company and VAT numbers are invented.
- **Hours:** Mon–Fri 07:45–17:30 · Sat 08:00–12:30 · Sun closed.

## Audience
Drivers in and around Shrewsbury, 25–75, with an everyday car (Fiesta, Golf, Yaris, Octavia) who want an MOT or a service without phoning around for a price. Many book on a phone in the evening when they notice the MOT reminder. They want to know what it will cost for *their* car, that nobody will add work behind their back, and when they’ll get it back.

## Art direction: “boiler-suit blue and the job card”
The workshop itself: a Victorian red-brick coachworks with timber trusses and roof lights, royal-blue boiler suits and lifts, a yellow number plate, and the manila job card that hangs on every car’s key. Warm brick and honest work, friendly rather than macho. No red-and-black motorsport, no chequered flags, no spanners as decoration. Blue is Ten to Two’s colour in this set (the gym demo moved off blue and Atkinson to keep the two apart). The hero is built around the plate and the job card, not a photo-and-colour-block split.

**The building (one description, used for every photo):** a long single-storey Victorian coachworks off Coton Hill. Outside: red brick with blue-brick surrounds and pale stone lintels on three tall square openings, a grey Welsh-slate roof with a row of roof lights along the ridge, a royal-blue roller door, a cobbled yard with a bench and a potted olive tree. Inside: bare red-orange brick walls, dark timber king-post trusses under the roof lights, four blue two-post lifts along the left wall, a grey resin floor, a timber-and-glass office at the far end, grey steel cabinets. Mechanics wear royal-blue boiler suits.

| Token | Hex | Use |
|---|---|---|
| Tile | `#F3F5F2` | page |
| Card | `#FFFFFF` | panels, step cards |
| Ink (navy) | `#0E1A3F` | text, footer, wait-with-us band |
| Ink 2 | `#4A5472` | secondary text |
| Overalls blue | `#2341B0` | primary: buttons, links, focus ring, reviews band, prices page header |
| Overalls deep | `#172D84` | hover and pressed |
| Blue tint | `#E2E7F7` | selected states |
| Plate yellow | `#FFD21F` | the reg field and plates only |
| Manila | `#F1E4C3` | the job card, the hero tag, section labels |
| Manila rule | `#D8C595` | job card lines |
| Rule | `#D5DAE3` | hairlines |
| Valid green | `#1A7449` | MOT in date |
| Due amber | `#9A5600` | MOT due soon |
| Expired red | `#B3261E` | MOT expired, form errors |

- **Type:** Bitter (variable slab serif, weight 100–900) for headings, the wordmark, and every price, time and date, with lining tabular figures: sturdy and a little old-fashioned, like the lettering on a service book, and nothing like the grotesques used elsewhere in the set. Work Sans (variable) for body and UI. Barlow Condensed 600 only for number plates (the nearest open face to real plate lettering). No tracked uppercase labels: section labels are small manila tags in sentence case.
- **Signature details:**
  1. **The job card tag in the hero.** A manila job card hangs on a cord from the workshop photo; its first line is the reg field, a real rear plate (yellow, black characters, blue “UK” band). It is the hero’s centrepiece and the first step of booking.
  2. **The job card in booking.** Beside the steps the same card fills in line by line (reg, car, work, VAT, MOT, total, drop-off) and gets a blue “Booked in” rubber stamp dated the day you booked. On phones a compact card bar keeps the running total on screen.
  3. **Name patches.** Team names are oval sew-on patches like the ones on their overalls.
- **Imagery:** documentary 35mm photographs with a Fujifilm Pro 400H look: soft daylight from roof lights, muted colour, fine grain, all in the one brick-and-timber building above. No badges, no readable plates, no text.
- **Icons:** one inline SVG set drawn for this demo, 24px grid, 1.75px stroke, round caps.

## Pages
1. `index.html`: header (phone and open-now status, mobile menu), hero (the workshop across the top; the headline below it; the job card tag with the plate field hanging off the photo; on phones: photo, headline, then the tag), what we do (six services with from-prices), the booking flow, wait with us (waiting room), how we work (three promises), the team, what customers say, find us (map, hours, parking), footer with local-business details.
2. `prices.html` (“MOT & servicing prices”, “Prices” in the nav): Nia’s photo in the page header, engine-size switch that re-prices the page, the three main prices, what each service includes, the MOT fee explained (legal maximum £54.85, ours £45, £35 with a service, free retest), common repairs and labour rate, questions, booking links back to the homepage flow.

## The booking flow (homepage, `#book`)
1. **Your car:** type the reg into the plate. Five obviously fictional plates (all start with ZQ, a memory tag the DVLA never issues) return a car with make, model, engine and MOT due date. Any other reg gets an honest “we couldn’t find that one” and asks for make, model and engine size instead.
2. **The work:** MOT (£45, or £35 with a service; the legal maximum is £54.85), interim or full service priced for the engine size. Prices are held ex VAT; services add 20% VAT; the MOT carries no VAT.
3. **When:** drop it off (07:45–09:00, ready the same afternoon) or wait with us (MOT and interim only, set start times). Days come from the opening hours with seeded availability.
4. **Your details:** name, mobile, optional email, text-when-ready, with validation.
5. **Booked:** the job card is stamped, with a reference and what happens next. Nothing is sent anywhere.

## Tour (about 35 s at 1920×1080)
In tour mode “today” is pinned to Thursday 12 November, 08:35, slots are fixed, the plate is ZQ19 QTW (a 2019 Volkswagen Golf 1.5 TSI Match, MOT due 26 November) and the reference is TT-1711-QTW.

| Time | Beat | Caption |
|---|---|---|
| 0–1.5 s | Settled hero, empty plate. | none |
| 1.5–6 s | The cursor types ZQ19 QTW into the plate on the hero’s job card tag (poster: the hero with the reg in). | Customers start with their reg, nothing else |
| 7–12 s | Look it up; the page moves to booking and the Golf comes up with its MOT date (announced and focused for screen readers). | Their car and MOT date come up straight away |
| 12–19 s | Confirm the car; tick MOT and full service; the job card adds up £212.50 + £42.50 VAT + £35.00 MOT = £290.00. | Prices for their engine size, VAT and all |
| 19–25 s | Drop it off on Tue 17 Nov at 08:15. | They choose a drop-off time that suits them |
| 25–33 s | Name and mobile typed, Book it in. | none (caption kept clear of the form) |
| 33–38 s | The job card is stamped “Booked in”; held. | Booked in online, without a phone call |

## Image prompts (fal-ai/flux-2-pro, edits with fal-ai/nano-banana-2/edit)
Shared look: “Documentary photograph, shot on Fujifilm Pro 400H film: soft daylight from roof lights, muted true colours, gentle cool shadows, fine grain”, plus the building description above. “No text, no logos, no badges, no number plates.”
- `hall` (hero): wide interior, four blue lifts along the left wall with an estate, a red hatchback and others raised, two mechanics, timber office at the far end. Edit: lift-post lettering, stickers and badges removed; the remaining plates blanked by script.
- `yard`: the coachworks from the cobbled yard, slate roof with roof lights, blue roller door, open bay with a car on the lift, bench and olive tree. Edit: the interior seen through the door changed to bare brick to match `hall`, plate blanked, signs removed; badge healed by script.
- `tomasz`: Tomasz measuring a brake disc, wheel off a dark green car on a blue lift, brick wall behind. Edit: wall notices removed.
- `nia`, `alun`, `ellie`: round-one portraits with their white-painted walls repainted as bare red brick (faces, poses and kit unchanged).
- `waiting-room`: armchairs, mugs, kettle and an internal window onto the workshop. Edit: walls to bare brick, the workshop through the window to brick and timber trusses, plates blank, the lower car changed so the two cars differ.
- Round three (photo consistency): the brick behind Nia, Alun and Ellie re-edited to the hall’s sooty, part-whitewashed, softer-focus brick; Tomasz’s corrugated roof replaced with timber trusses and roof lights. Then one film grade by script across the whole set (local contrast softened on the HDR-looking hall, lifted blacks, gentle desaturation, cool shadows and warm highlights, fine grain).
- Rejected: the round-one white-tile workshop (garbled lettering on a tool chest), the two-identical-hatchbacks lift photo, the flat-roofed yard (a maker badge), and a brake shot with a readable plate.

## fal spend
Round one: 10 flux-2-pro images and 5 nano-banana-2 edits, about $1.20. Round two (critic fixes): 6 flux-2-pro images (about $0.40) and 8 nano-banana-2 edits at 2K (about $0.90). Round three: 4 nano-banana-2 edits (about $0.45). Total about $2.95 of the $4 + $3 + $1.50 budget. Originals are in the builder’s scratchpad, not in the repo.
