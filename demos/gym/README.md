# Dryside, Leicester (demo 14: gym website)

A website for an independent strength and fitness gym in a drained 1930s swimming baths. A homepage built around this week's timetable and booking, plus a Memberships page with an honest price chooser.

## Brand
- **Name:** Dryside. Leisure centres call the gym-and-sports-hall half of a building “the dry side”. When the pool closed, the whole place became dry side.
- **Town:** Leicester (real city). **Address:** The Old Baths, Kenmore Row, Leicester LE2 0ZZ (fictional street and postcode). **Phone:** 0116 496 0217 (Ofcom drama range). **Email:** hello@dryside.example (not linked out).
- **Story:** Tom Rennie was the last lifeguard at Kenmore Row Baths when the council shut the pool in 2019. In 2022 he and Nadia Parekh, a PE teacher turned strength coach, took on the lease, floored over the pool and kept the tiles. The lifting platforms sit where the deep end was.
- **Name check (31 Oct 2026):** web searches for “Dryside” gym UK, and “Dryside” Leicester gym/fitness/baths, found no business of that name. “Dryside” only appears as a council leisure-centre term for non-pool facilities. My first choice, “Deep End”, was dropped because “Deep End Fitness” is a water-training brand with UK locations. Kenmore Row is invented.
- **Coaches:** Nadia Parekh (co-owner, head coach: barbell, Foundations, Women’s Lifting Club), Tom Rennie (co-owner: circuits, barbell), Grace Okafor (kettlebells, Strong at Sixty; trained as a physio’s assistant), Dele Adeyemi (boxing; ex-amateur boxer), Kuba Zieliński (mobility, kettlebells; ex-gymnast).

## Audience
People in Leicester, 16 to 80, who feel out of place in a big chain gym: complete beginners, women who want to lift, over-60s told to “do some strength work”, people coming back after an injury, students on a budget. They read on a phone, usually in the evening, and want three answers fast: what’s on, is there space, and what does it really cost.

## Art direction
**The old baths, drained.** The site is built from the hall itself: cream glazed brick-bond tile, one teal dado band with a black line above and white coping below, black lane lines with T-ends, a red-and-yellow lane rope, stencilled depth markers and an enamel notice board. Weight-plate colours code the class types. Civic and plain-spoken, not a “fitness brand”: no neon, no black-and-red shouting, no glossy stock, and no blue lead colour (that belongs to the auto-repair demo).

- **Palette** (tokens named after the building)
  | Token | Hex | Use |
  |---|---|---|
  | `--glaze` | `#F6F5F0` | page (white glazed tile) |
  | `--coping` | `#FFFFFF` | header, panels, depth-marker tiles |
  | `--cream` | `#EEE7D3` | the cream wall tile behind the hero and Memberships header |
  | `--joint` / `--joint-dark` | `#DCDAD1` / `#C1BDB0` | grout lines, hairlines |
  | `--lane` | `#121817` | black lane paint: text, lane lines, chosen chips |
  | `--lane-soft` / `--lane-mute` | `#4A5250` / `#5C6462` | secondary and meta text (AA on glaze) |
  | `--dado` | `#1D6A62` | the teal tile band: primary buttons, links, selected day |
  | `--dado-dark` / `--dado-deep` | `#154F49` / `#0E3632` | hover; the notice board, dialog header, footer |
  | `--rope` / `--rope-ink` | `#CF3B2C` / `#A82D20` | lane-rope red: rope, nav underline, “last places”, focus ring |
  | `--float` | `#F1C232` | lane-rope yellow: rope, “places left” on the board |
  | plates | `#C9342A` `#2B58B3` `#EDBB2C` `#23794F` white | 25 / 20 / 15 / 10 / 5 kg plates for Strength, Kettlebells, Circuits, Boxing, Mobility (small tokens only) |
- **Type:** Jost (variable; a 1920s geometric sans in the spirit of the baths’ era signwriting) for headings, the board and buttons, set large and tight; Onest (variable) for reading text and UI; a stencil face (Big Shoulders Stencil) only for the painted depth markers and step numbers. Tabular figures on times and prices.
- **Signature details**
  1. **Depth markers.** Each section is labelled like the painted marks on the pool edge, getting deeper as you scroll: 0.9 m “Shallow end” in the hero, down to 3.0 m “Deep end” in the footer.
  2. **The hero is the wall:** cream brick-bond tile, the baths’ enamel notice board listing the next classes with space (it becomes “Your booking” once you book), then the teal dado band and the hall photo underneath.
  3. **Lane furniture:** the brand mark is the black T painted at the end of a lane, a lane rope runs under the header and between the day tabs, and black T-ended lane lines divide sections.
  4. **Spaces as tiles** and **plate colours** for class types.
- **Imagery:** one hall, described once and used for every photo (below). Fujifilm colour-negative grade, soft cool daylight from the roof light, gentle grain, ordinary members of varied ages, sizes and backgrounds in plain kit. No text, logos or numbers on anything.

## Pages
- `index.html`: header with mobile menu; hero (0.9 m): the tiled wall with the baths’ notice board of the next classes with space (each one opens the booking), which turns into “Your booking” once you book; **This week** (1.2 m): seven day tabs (arrow keys work), filters by class type, coach and “good first sessions only”, places shown as tiles, Book or Waiting list per class, finished classes greyed, an honest empty state that points to a day that fits; booking dialog (who’s coming: first time free / member / pay as you go; details with validation; confirmation with reference, what to bring, cancellation terms and an .ics with UTC times); **Your first session** (1.5 m); **Five kinds of class** (2.0 m); **Coaches** (2.5 m); **What it costs** with the house-rules sign (2.8 m), linking to Memberships; **Why the tiles stayed**; footer “Deep end” (3.0 m) with address, staffed hours (today highlighted), members’ hours, getting here and access.
- `index.html?first=1` opens the timetable with “good first sessions only” on (used by the Memberships page links). `?today=2026-11-03T11:20` pins the clock by hand.
- `memberships.html`: membership chooser (what you want, when you’ll come, concessions, visits a month) with the monthly price, what you get, the first payment and Direct Debit date, an honest “pay as you go is cheaper for you” verdict when it is, and how to leave; every price in one table; pay as you go; the small print in plain English; FAQs; links back to the timetable.

Prices: Gym floor £29 a month (off-peak £22), Gym + classes £45 (off-peak £36); concessions £22 / £17 / £34 / £27. Drop-in class £9, gym day pass £7, ten-class card £75. No joining fee, no minimum term, one month’s notice, two months’ free pause a year.

## Tour (37 s at 1920×1080; “today” is pinned to Tuesday 3 November, 11:20)
| Time | Beat | Caption |
|---|---|---|
| 0–1.2 s | Settled hero: the pool hall photo, the 0.9 m marker, today’s board. | – |
| 1–7 s | Cursor rests on today’s first class with space. | Newcomers see a real gym and a free first session |
| 7–14 s | Scroll to This week. Thursday, then Strength, then Nadia: the list narrows to Lifting Foundations, 18:00, last 2 places. | Find a class by day, type or coach in seconds |
| 14–25 s | Book → “It’s my first time at Dryside” → name, mobile, email typed → 16 or over → Confirm. | Book a free first session in under a minute |
| 25–31 s | Confirmation with reference DS-7Q4K, what to bring and who meets you; Done; the row shows “You’re booked” and the last place. | Booked, with what to bring and who to ask for |
| 31–37 s | Caption cleared, back to the top: the hero board now shows the booking. Poster, then held. | – |

## Images
**The hall** (used for every photo): “the main hall of a 1936 municipal swimming baths in an English city, now a small community gym. The old pool floored over level with matt black rubber tiles, with a border of white glazed coping tiles still outlining the old pool edge. Cream glazed brick tiles to about two metres, one band of glossy dark teal-green tiles at waist height and a thin black tile line above; painted off-white above. A high barrel vault of white-painted curved iron trusses with a long glazed roof light along the ridge. A viewing gallery with dark green iron railings on the left; tall round-arched small-paned windows on the right. Three wooden lifting platforms with plain black racks at the far end. Soft cool overcast daylight, Fujifilm colour negative look, gentle grain, no text anywhere.”

- `hero` / `hall`: the hall prompt above with a woman deadlifting, a man in his sixties carrying two kettlebells and a man stretching (fal-ai/flux-2-pro, 2048×1360, seed 1936), then signs, a clock, platform lettering and plate logos removed with fal-ai/nano-banana-2/edit and the last faint platform marks blurred locally. `hall` is a 4:3 crop of the same photo for the Memberships header.
- Every other photo was made with nano-banana-2/edit from two references: the people from the round-one image and the hall photo above, so the room, light and coaches match. `foundations` (Nadia showing a beginner the hip hinge; a full bar with a plate on each end), `kettlebells` (four members with Kuba squatting alongside; then the room swapped to the hall’s brick-bond tile, cropped to the class), `boxing` (Dele on the pads), `sixty` (Grace and an older member), `chalk` (rack, chalk bowl and the old pool-steps handrail rising from the floor, with a plain bar sleeve).
- Coaches: each portrait was regenerated from that coach’s earlier portrait against the hall, so all five share one wall and light. Grace’s background was then corrected to the teal band. Round avatars in the timetable are crops of the same portraits.

## fal spend
Round one: about $2.10 (16 flux-2-pro images at $0.03 per processed megapixel, 13 nano-banana-2/edit runs). Round two (critic fixes): 2 flux-2-pro hall images (about $0.18) and 15 nano-banana-2/edit runs (6 at 1K, $0.08; 9 at 2K, about $0.12), about $1.75. Total about $3.85.

## Notes
- The live clock runs outside tour mode, so the hero board and timetable show the real “today”; finished classes are greyed and the timetable opens on tomorrow once today is done.
- Christmas Day, Boxing Day and New Year’s Day are closed, and bank holidays run the Sunday timetable (data in `assets/js/data.js`).
- Booking rules: one free first session per person (matched on mobile or email); members say which membership they have, and off-peak or gym-floor members are told a class costs £9 when it does. The arrival line (“ring the bell” for first-timers, “doors open 15 minutes before” for everyone else) is the same in the confirmation, the hero card and the .ics, which is folded at 75 octets with UTC times.
- The hero board skips closed days and shows the hours of the day it lists; on closed days it says so first. The footer highlights today’s hours, says “closed today” on Christmas and New Year, and marks bank holidays.
- Direct Debits are collected on the 1st–28th: a join on the 29th–31st is collected on the 28th, and the first payment runs to the day before.
