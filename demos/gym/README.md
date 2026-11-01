# Kingfield Gym, Leicester (demo 14: gym website)

A website for a small independent gym with coached classes. It has a homepage built around this week's timetable and booking, and a Memberships page with an honest price chooser.

## Brand
- **Name:** Kingfield Gym. A plain gym name.
- **Town:** Leicester (real city).
  - **Address:** Unit 4, Wharf Yard, Leicester LE3 0ZZ (fictional yard and postcode).
  - **Phone:** 0116 496 0217 (Ofcom drama range).
  - **Email:** hello@kingfieldgym.example (not linked out).
- **Story:** Nadia Parekh, a former PE teacher, and Tom Rennie, a former leisure-centre instructor, opened Kingfield in 2022 in an old print workshop. It is a small gym with capped, coached classes and plainly written prices, for people who feel out of place in a big chain gym: beginners, over-60s, women who want to lift, and people coming back after an injury.
- **Name check (1 Nov 2026):**
  - Web searches for “Kingfield Gym” Leicester and “Kingfield Gym” / “Kingfield Fitness” UK found no gym or fitness business of that name.
  - Kingfield is a district of Woking, and the only results there were a karate class and school activities. There was also an unrelated “Kingsfield” physio in Falkirk.
  - History: the earlier concept brand, “Dryside” (a gym in old swimming baths), was dropped after the owner’s review because it was confusing.
- **Coaches:**
  - Nadia Parekh: co-owner and head coach (barbell, Lifting Foundations, Women’s Lifting Club).
  - Tom Rennie: co-owner (circuits, barbell).
  - Grace Okafor: kettlebells and Strong at Sixty.
  - Dele Adeyemi: boxing.
  - Kuba Zieliński: mobility and kettlebells.

## Art direction
The look is clean and modern, with no theme: white and soft-grey surfaces, near-black ink and one persimmon accent used only for actions. It has generous white space, rounded cards and real photos, and is plainly a local gym. It is kept apart from the other local-business demos:
- Fanlight Dental (sage),
- Fankle (claret and pink),
- Hollis & Daughter (saffron on Pennant ink),
- Ten to Two (royal blue).

| Token | Hex | Use |
|---|---|---|
| `--page` / `--surface` | `#FFFFFF` / `#F6F6F3` | page, alternate bands and panels |
| `--line` / `--line-strong` | `#E4E4DF` / `#CDCDC6` | hairlines, borders |
| `--ink` / `--ink-2` / `--ink-3` | `#15181B` / `#50565C` / `#62686E` | text, secondary text, meta text; selected day and filter chips |
| `--accent` | `#B8441A` | persimmon: primary buttons, the brand square, booking states (`#A33C16` as text, `#FBEEE7` tint) |
| class dots | `#C0392B` `#2F6DB0` `#D8A31A` `#2E7D4F` `#8B9097` | 12px dots for Strength, Kettlebells, Circuits, Boxing and Mobility only |

- **Type:** Jost (variable) for the wordmark, headings, times, prices and buttons, and Onest (variable) for reading text and UI. Tabular figures throughout.
- **Imagery:** one written description of the space, used for every photo (see below), with the same five coaches throughout.

## Pages
- **`index.html`:**
  - Header with a mobile menu.
  - Hero: the headline on a dark panel beside the gym photo (“Coached classes in Leicester, from your first lift to Strong at Sixty”), with a strip underneath listing today’s next classes with space. Each class opens the booking, and the strip turns into “Your booking” once you book.
  - Wordmark: a rounded persimmon “K” tile with “Kingfield” in Jost bold and “Gym” in regular.
  - **This week’s classes**:
    - Seven day tabs (arrow keys work).
    - Filters by class type, coach and “good first sessions only”.
    - Places shown as dots, Book or Waiting list per class, and finished classes greyed.
    - An honest empty state that points to a day that fits.
  - Booking dialog:
    - Who’s coming: first time (free, once per person), member (by plan) or pay as you go.
    - Details with validation.
    - Confirmation with a reference, what to bring, arrival and cancellation terms, and an .ics file (UTC times, folded at 75 octets).
  - **Your first session**, **Five kinds of class**, **The coaches**, **What it costs** (with “The short version” of the terms, linking to Memberships) and **About us**.
  - Footer with address, staffed hours (today highlighted), members’ hours, getting here and access.
- **`memberships.html`:**
  - The chooser asks four things: what you want, when you’ll come, concessions and visits a month.
  - It shows the monthly price and what you get, plus the first payment (pro-rated for joins on the 29th–31st) and the Direct Debit date.
  - It gives an honest “pay as you go is cheaper for you” verdict when that is true, and says how to leave.
  - Below it: every price in one table, pay as you go, the small print in plain English, and FAQs.
- **URL options:**
  - `index.html?first=1` opens the timetable with “good first sessions only” on.
  - `?today=2026-11-03T11:20` pins the clock by hand.

## Prices
| Membership | Standard | Concession |
|---|---|---|
| Gym floor | £29 a month (off-peak £22) | £22 (off-peak £17) |
| Gym and classes | £45 a month (off-peak £36) | £34 (off-peak £27) |

- Pay as you go: drop-in class £9, gym day pass £7, ten-class card £75.
- Terms: no joining fee, no minimum term, one month’s notice, two months’ free pause a year.

## Tour (about 37 s at 1920×1080; “today” is pinned to Tuesday 3 November, 11:20)
| Time | Beat | Caption |
|---|---|---|
| 0–1 s | Settled hero: the gym photo, the headline and today’s classes. | – |
| 1–7 s | The cursor rests on “Book a free first session”; today’s classes sit in the strip below. | Newcomers see the gym and book a free first session (top, after the cursor settles) |
| 7–14 s | Scroll to the timetable and choose Thursday, then Strength, then Nadia. The list narrows to Lifting Foundations, 18:00, last 2 places. | Find a class by day, type or coach in seconds |
| 14–25 s | Book, choose “It’s my first time”, type the name, mobile and email, tick 16 or over, then Confirm. | Book a free first session in under a minute |
| 25–31 s | The confirmation shows the reference (KG-7Q4K), what to bring and who meets you. Done: the row shows “You’re booked” and the last place. | Booked, with what to bring and who to ask for |
| 31–37 s | The caption clears and the page scrolls back to the top, where the hero panel now shows the booking. Poster, then held. | – |

## Images
**The space** (used for every photo): “a small independent gym in a converted brick workshop in Leicester: white-painted brick walls, a tall ceiling with exposed white steel beams and black pendant lights, large black steel-framed windows with soft daylight, mid-grey rubber floor tiles, light oak lifting platforms in front of plain black wall-mounted racks, a black kettlebell rack and a few large green plants. Clean, bright and calm. Fujifilm colour negative look, soft natural daylight, gentle grain, no text, logos or numbers anywhere.”

- `hero` / `hall`: generated with fal-ai/flux-2-pro (2048×1360, seed 5202). Lettering and a wall fixture were removed with fal-ai/nano-banana-2/edit, then a second edit gave the woman real kettlebells and removed a malformed rower in the foreground. A final edit removed a leggings logo and tiny labels on the rig uprights. The Memberships header uses `members`, a 4:3 crop of the Strong at Sixty photo.
- `foundations`, `kettlebells`, `boxing`, `sixty`: each was made with nano-banana-2/edit from two references, the people from the earlier class photos and the room above. That keeps the members and coaches identical and puts everyone in the same gym. `kettlebells` is cropped to 4:3. `foundations` was edited again to make the platform plain oak flush with the rubber floor.
- `chalk`: a barbell resting in a wall J-hook, a chalk bowl and a window in the same room (nano-banana-2/edit from the room photo, then edited so the bar sits in the hook).
- Coaches: each portrait keeps the coach from the earlier set, with the background changed to the same brick wall and window. The round avatars in the timetable are crops of the same portraits.

## fal spend
Approximate cost, from list prices:

| Round | What | Cost |
|---|---|---|
| 1 | first build | $2.10 |
| 2 | critic fixes | $1.75 |
| 3 | this rebrand: 2 flux-2-pro room images (about $0.18) and 11 nano-banana-2/edit runs (6 at 2K, 5 at 1K; about $1.12) | about $1.30 |
| 4 | critic fixes: 4 nano-banana-2/edit runs at 2K | about $0.48 |
| **Total** | | **about $5.60** |

## Notes
- **Live clock:** it runs outside tour mode. Finished classes are greyed, and the timetable opens on the next day that has classes.
- **Closures:** Christmas Day, Boxing Day and New Year’s Day are closed, and bank holidays run the Sunday timetable. The hero panel skips closed days and shows the hours of the day it lists. The footer highlights today’s hours and says when the gym is closed.
- **Booking rules:**
  - One free first session per person, matched on mobile or email.
  - Members say which membership they have. Off-peak and gym-floor members are told when a class costs £9.
  - The arrival line is the same in the confirmation, the hero panel and the .ics: “say hello at the front desk” for first-timers, “doors open 15 minutes before” for everyone else.
- **Direct Debits:** collected on the 1st–28th. A join on the 29th–31st is collected on the 28th, and the first payment is pro-rated to the day before.
