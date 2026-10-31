# Fankle, Leith: hair salon website (demo 8)

Demo 8 of 14 (website). The site of an independent hair salon, made by Hiconlab for one specific salon, with online booking from service to confirmed chair that works without a backend.

## Brand
- **Name:** Fankle. **Town:** Leith, Edinburgh (real). **Address:** 11 Chandlers Wynd, Leith, Edinburgh EH6 6ZZ (fictional lane and postcode).
- **Story:** Morven Laird cut hair in the West End for fifteen years, then in 2017 opened her own place in a former ship chandler’s just off the Shore. *Fankle* is Scots for a tangle; the salon’s line is “We’ll sort the fankle”: straight talk, prices you can read first, and nobody talked into a fringe they don’t want.
- **Name check (31 Oct 2026):** web searches for "Fankle" hair salon Leith Edinburgh and "Fankle" hairdresser / salon / barber UK found no business of that name in the trade (results were other Leith salons and unrelated listings). The lane is invented; we avoid real Leith streets that have salons on them.
- **Contact details (fictional):** 0131 496 0582 (Ofcom drama range for Edinburgh), hello@fanklehair.example.
- **Hours:** Mon closed · Tue 09:30–18:00 · Wed 09:30–18:00 · Thu 10:00–20:00 · Fri 09:00–18:00 · Sat 08:30–16:30 · Sun closed.

## Team (all fictional)
| Who | Level | Known for | Days in |
|---|---|---|---|
| Morven Laird | Director (owner) | Precision cuts, big restyles, grey blending | Tue, Wed, Thu, Sat |
| Kasia Wróbel | Senior colourist | Balayage, blondes, colour correction | Wed, Thu, Fri, Sat |
| Femi Adeyemi | Stylist | Curly and coily cuts, silk press | Tue, Thu, Fri, Sat |
| Ross Dunbar | Stylist | Short cuts, skin fades, beards | Tue, Wed, Fri, Sat |
| Isla Mackay | Graduate stylist | Cuts and blow-dries at graduate prices | Tue, Wed, Thu, Fri |

Prices are set at stylist level and scale by who you see: graduate 80%, stylist 100%, senior 115%, director 130%, rounded to the pound. Every price also depends on hair length (short: above the chin; shoulder: chin to shoulder; long: past the shoulders), and so does the time we book.

## Audience
People in Leith and north Edinburgh, mostly 20–55, booking on a phone in the evening. They want to see what a cut or colour really costs for *their* hair, who is good at what (especially curly hair and colour), and to book without phoning.

## Art direction: “claret and candy”
A Leith shopfront painted deep claret, powder-pink plaster inside, chrome and oxblood leather: a salon with nerve, not a beige spa. Colour-blocked sections, a high-contrast display serif set big, and one hand-drawn hair strand that runs through the site.

| Token | Hex | Use |
|---|---|---|
| Bleach | `#FFF6F3` | page |
| Candy | `#F6CDD4` | big colour blocks, hover fills |
| Candy deep | `#EDB0BC` | borders on candy, chips |
| Claret | `#6E1530` | primary: buttons, headings, dark bands |
| Claret dark | `#3D0A1A` | text (ink) |
| Ink 2 | `#6B4651` | secondary text |
| Vermilion | `#E3482B` | the strand, small accents (decorative; `#B7321A` when used as text) |
| Rule | `#EBD3D7` | hairlines |
| Chrome | `#F1ECEC` | cards on candy |

- **Type:** **Gloock** (high-contrast display serif with ball terminals and a bit of swagger) for headings, prices and the wordmark; **Commissioner** (variable) for body and UI, tabular figures for prices and times. Body 17–18px on desktop, 16px minimum on phones.
- **Signature details:**
  0. **Hero.** A full-bleed claret block with the headline in candy and the salon photo flush to the right edge, then “Chairs today” as its own strip below: each stylist’s next free time today, like the salon’s diary. No status bar, no floating card.
  1. **The strand.** One hand-drawn hair strand (a trochoid curve drawn in SVG from code). When its loop factor is above 1 it knots into a fankle; below 1 it relaxes into a smooth wave. It is the logo mark (one hand-drawn strand: tail in, a loop, an over-under crossing, tail out; also the favicon), it underlines “fankle” in the hero (knotted until you book, then it relaxes into a wave), it is the booking progress bar (each step undoes one knot until the confirmation is a clean wave) and it untangles above the book-a-chair band when that scrolls into view. Nowhere else.
  2. **Length-aware prices.** A “My hair is short / shoulder / long” switch re-prices every service on the page at once, with honest ranges across the team and the time it takes.
  3. **Chairs today.** A strip under the hero lists each stylist’s next free time (or “Back Wed”), so the site feels like the salon’s own diary, not a template. After a booking it shows your ticket.
- **Imagery:** editorial 35mm film look (Kodak Portra 400), soft shop-window light, fine grain; claret panelling, powder-pink lime plaster, chrome, oxblood leather, terrazzo. Team chest-up against the pink wall; finished hair from behind or in profile. No text in any image.
- **Icons:** one inline SVG set, 1.6px stroke, round caps.

## Pages
1. `index.html`: header with mobile menu, hero (“We’ll sort the fankle”) with Chairs today, the story, services and prices by length, the team, recent work, what clients say, find us (drawn map, hours, getting here), book band, footer.
2. `services.html` (“Services & prices”): the full price list with length and stylist-level switches, how our prices work, skin tests before colour, cancellations, questions, book band.
3. **Booking** (both pages, a side sheet / full-screen on phones): service and hair length → stylist or “anyone” (with each person’s price and next free time) → day and time from the rota → your details → confirmed, with a reference and an .ics calendar file. No real submission.

## Tour (about 42 s at 1920×1080)
In tour mode the clock is pinned to Wednesday 11 November, 10:40 (so “Open now until 18:00” shows and the video never dates), the rota is seeded per stylist and day, Femi’s Thursday 14:30 is kept free, and the reference is fixed (FK-7Q4M). Outside tour mode the live clock drives the board, the hours table and availability.

| Time | Beat | Caption |
|---|---|---|
| 0–1 s | Settled hero: knotted strand under “fankle”, Chairs today board. | none |
| 1–5 s | Cursor drifts over the hero. | A website with as much character as the salon |
| 5–10 s | Scroll to prices; switch to “Long”; every price and time changes. | Clear prices for your hair length, before you sit down |
| 10–13 s | The team; rest on Femi; “Book with Femi”. | Clients book the right stylist in a minute |
| 13–31 s | Shoulder length → Curly cut (£64) → Femi → Thu 12 → 14:30 → details typed → Confirm; the progress strand loses a knot at each step. | (same) |
| 31–35 s | Booked: ticket with date, time, price and reference. | Booked, with a reminder text the day before |
| 35–42 s | Done; back to the top. The hero board shows “You’re booked in · Thu 12 Nov, 14:30” and the strand under “fankle” relaxes into a wave. Poster here, held about 3 s. | cleared |

## Image prompts (fal-ai/flux-2-pro unless noted)
Shared look, prefixed to every prompt: “Editorial photograph for an independent hair salon in Leith, Edinburgh. 35mm film look, Kodak Portra 400, soft daylight from a big shop window, gentle film grain, true colour with rich claret reds and powder pinks … No text, no logos, no lettering anywhere.”
- `salon` (1440×1792): wide view inside the converted Victorian shop; tall window left, claret panelling to dado height, powder-pink lime plaster, oxblood leather chairs with chrome bases, brass-framed mirrors, wooden trolley, kentia palm, terrazzo floor, nobody in frame.
- `tools` (1536×1152): uncluttered still life on a claret lacquered trolley by the window: one pair of scissors, tail comb, glass tint bowl of copper colour with a tint brush, bristle brush, folded pink towel. (Second attempt; the first had malformed sectioning clips and scissors.)
- Team (1024×1280, cropped to 1024×1160 to keep hands out of frame): chest-up portrait against powder-pink plaster with claret panelling at the bottom of frame, window light from the left, closed-mouth smile, 85mm. Morven (early fifties, silver pixie, black linen shirt), Kasia (mid thirties, platinum hair with grown-out roots in a low ponytail, gold hoops), Femi (late twenties, big defined coily hair, gold nose stud, rust knit), Ross (early thirties, skin fade, short beard, white T-shirt and claret apron), Isla (about twenty, dark shag with curtain bangs, freckles, cream cardigan).
- Work (1024×1280): shoulder-length 3C curls from behind in an oxblood chair; chin-length blunt bob in profile against claret panelling; long honey balayage from behind; short textured crop with a skin fade from behind. Faces turned away.
- `shopfront` (1600×1072): claret timber shopfront on a cobbled lane in sandstone Leith, blank fascia, bay tree, bike against the wall. Window cards and door stickers then removed with `fal-ai/nano-banana-2/edit` (2K) so there is no text anywhere.
- Round two (after review): the hero and the curls photo were edited with nano-banana-2 so every wall is the same rough lime plaster as the portraits; the shopfront window was repainted to show the real interior (claret panelling, oxblood chairs, brass mirrors, no office ceiling) and the bike redrawn.
- Rejected: a close-up of hands point-cutting a bob (three attempts; every one had a confusing grip or extra fingers), so the site has no hands-at-work photo.
- Every image was inspected at full size (faces, eyes, teeth, hands, scissors, combs, mirror reflections, text). Originals are in the builder’s scratchpad; only WebP exports are in `assets/img/` (1.8 MB in total).

## fal spend
19 flux-2-pro images at $0.03 per processed megapixel (1.3–2.6 MP each, about $0.80) plus one nano-banana-2 edit ($0.08 to $0.12 at 2K). Round two: three more nano-banana-2 edits (about $0.30). Total about **$1.25** of the $4 budget.

## Notes
- Booking is a dialog: focus moves to the step heading, Tab is trapped, Escape closes and focus returns to the button that opened it. Steps re-render without losing the day strip or list scroll position.
- Each stylist has a rota (days in) and a seeded diary with a lunch break; times need a free run as long as the service for the chosen hair length. “Anyone free” gives each time to the first free person in the service’s own order (the specialist first) and shows who it is on the slot.
- Prices scale by level and are rounded to the pound; ranges always name the real cheapest and dearest stylist for that service.
- New colour clients are told about the 48-hour skin test in the form and on the confirmation.
- A booking made on either page is kept in sessionStorage (never sent anywhere), so the homepage board shows it until the day has passed. Tour mode ignores it.
- The video poster is the hero after booking: the ticket on the board and the relaxed strand.
