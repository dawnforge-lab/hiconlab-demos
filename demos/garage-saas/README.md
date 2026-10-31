# Liftbay: workshop software for Calder & Price Motors (demo 3)

A redesign of a real garage management app (`D:\Garage`, summarised in `docs/sources/garage-manager.md`) as a modern SaaS. It shows Hiconlab's web development work: a dense, calm workshop tool where cars move across a board, ramps fill and empty, and a job goes from "work done" to invoiced, paid and handed over, all in the browser with an in-memory store.

## Brand
- **Product:** Liftbay, workshop software for independent garages. Named after the lifts (ramps) every job revolves around.
- **Tenant:** Calder & Price Motors, Unit 3, Fellgate Yard, Kendal LA9 6QZ. 01632 960418, workshop@calderprice.example.
- **Story:** Ruth Calder and Gareth Price run a three-ramp workshop on the edge of Kendal: servicing, brakes, diagnostics and tyres for locals, plus vans for a few small firms on 30-day terms. They moved onto Liftbay on 1 October 2026, so this year's invoice numbers restart at INV-2026-0001 there.
- **Name check (31 Oct 2026):** web searches for "Liftbay" with garage/workshop software and as an app, and for "Calder & Price" / "Calder and Price" garage Kendal, found no business of either name in that trade.
- **People (all fictional):** Ruth Calder (owner), Gareth Price (manager, front desk), mechanics Liam Hartley, Kasia Nowak and Josh Bell. Clients are invented; plates are plausible UK plates.

## Audience
Owners and front-desk staff of small independent UK garages (2–6 ramps), who live in the board all day on a desktop by the counter and check it on their phone in the workshop. They want to see at a glance what's on each ramp, what needs invoicing and what's waiting on parts.

## Art direction: "workshop floor, calm office"
A warm concrete-paper workspace with an ink-black "bay display" running across the top of the board, like the screen above a workshop counter. Hi-vis lime is the only loud colour and is used for what is live: the active nav item, cars on ramps, timers and the primary action. Status colours are muted pigments, never neon.

| Token | Hex | Use |
|---|---|---|
| Paper | `#EFEDE6` | app background |
| Surface | `#FFFFFF` / `#FAF9F5` | cards, panels |
| Line | `#DCD8CD` | hairlines |
| Ink | `#141619` | sidebar, bay display, primary buttons, text |
| Ink 2 | `#3B3E44` | secondary text |
| Muted | `#5F6167` | meta text (AA on paper) |
| Hi-vis lime | `#C9F03E` | live states, primary action on ink, focus halo |
| Steel (Arriving) | `#566477` | status |
| Cobalt (In progress) | `#2B55C4` | status |
| Plum (Waiting parts) | `#87389F` | status, parts banner |
| Green (Ready / paid) | `#1D7F46` | status |
| Stone (Delivered) | `#7D7A70` | status |
| Signal red | `#C9302A` | invoice needed |
| Amber | `#A86103` | over its time |

- **Type:** Archivo (variable, width axis) for everything: expanded heavy cuts (wdth 118–125, wght 760–820) for headings and big numbers, normal width for UI text, condensed bold for number plates. Martian Mono for invoice numbers, times, money in tables and the bay display timers. One family stretched in width gives the industrial, motorsport-adjacent feel without a third typeface.
- **Signature details:**
  1. The **bay display**: ramp tiles drawn as top-down lift schematics (two lift arms, a car outline that slides on when a ramp fills, a lime progress line against the planned hours that turns amber when over time).
  2. **Number plates** as small front plates: white, condensed bold, with the dark "UK" band on the left.
  3. Column headers as thin pigment rules with counts in mono, and cards that carry a coloured left edge only when something needs action (red for invoice needed).
- **Imagery:** none. All icons are one inline SVG set (24px grid, 1.75 stroke, round joins) drawn for this demo. Charts on the Reports screen are inline SVG drawn from the same data the rest of the app uses.

## Screens (one page, hash routes)
- **Board** (`#/board`): date and upcoming count, search, walk-in; alert banners (invoice needed, parts to order, over time on a ramp); the bay display with three ramp tiles; the kanban Arriving today → In progress → Waiting parts → Ready → Delivered with the source's card contents and rules (arrived check, mechanic and ramp picker, waiting-parts reason and ramp picker, "who did the work?", parts-not-arrived confirm, invoiced jobs can't go back, pay before delivery unless a business on terms). Drag with a mouse; every card also has a "Move to" menu for keyboard and touch.
- **Job page** (`#/job/<id>`): the vehicle file. Reported problem, work done (labour and parts, cost + markup), parts requests (Requested → Ordered → Arrived), workshop notes, office notes, vehicle details, previous visits, and the invoice panel (set price on unpriced lines, Subtotal / VAT 20% / Total, create invoice, send by email, mark as paid, mark as delivered, invoice preview).
- **Calendar** (`#/calendar`): month view, each weekday with its cars and a fill bar ("14/24 h · 3 ramps"), weekends closed, a day panel with times and a "may not fit" warning.
- **Vehicles**, **Clients**, **Invoices**, **Outbox**: tables built from the same data, with a vehicle drawer, invoice preview and email previews.
- **Reports** (`#/reports`): 8 KPI tiles; revenue by day for October, top five services, jobs per mechanic, ramp hours used.
- **Settings** (`#/settings`): company and invoicing, workshop and bookings, services, team, roles and permissions.
- **New booking** dialog: phone booking or walk-in; today's bookings land in Arriving today.

At 375px: a top bar, a bottom tab bar with a "More" drawer, a horizontal ramp strip, a column switcher for the board (one column at a time) and "Move to" buttons instead of dragging.

## Data
Everything lives in `assets/js/data.js` and an in-memory store in `assets/js/app.js`. The demo's "today" is Thursday 29 October 2026 and the clock starts at 10:41. October's history (89 invoices, INV-2026-0001 to 0089) is generated from a fixed seed so reports, invoices, vehicles and the calendar agree. Parts are cost × (1 + 25% markup), VAT 20%, issued invoices never change. Reloading resets the demo.

## Files
`index.html` (one page, hash routes), `assets/css/site.css`, `assets/js/data.js` (seed and generated history), `assets/js/app.js` (store, router, board, job page, dialogs, drag), `assets/js/screens.js` (calendar, vehicles, clients, invoices, outbox, reports, settings), `assets/js/tour.js`, `assets/fonts/` (see `FONTS.md`). No images, no fal spend.

## Tour (37 s, recorded at 1536×864 and scaled to 1920×1080)
In the tour the demo clock runs ten times faster, so timers and timestamps visibly move on (10:41 → 10:46).
1. 0–2.5 s: the busy board settles; the cursor rests on the red invoice banner.
2. 2.5–4.5 s: marks LK19 XRT (booked 10:30, running late) as Arrived. The walk-in KM14 OWD was told it would be fitted in after the 10:30 booking, so LK19 goes first.
3. 4.5–7 s: drags it to In progress; the start-work picker opens (Ramps 1 and 2 shown busy with their plates).
4. 7–10 s: picks Josh Bell and Ramp 3, starts the work; the car slides onto Ramp 3 and its timer starts.
5. 10–12 s: the page scrolls back to the top; **poster frame**: the full board with all three ramps live and the three banners, toasts cleared.
6. 12–19 s: opens SF18 UVC from Ready, sets the price on the tyres line (cost £58 + 25% = £72.50 each); Subtotal £205.00, VAT £41.00, Total £246.00.
7. 19–23 s: creates INV-2026-0093 (confirm dialog), then sends it by email to Helen Marsh.
8. 23–29 s: marks it paid by card, then delivered.
9. 29–37 s: back to the board: SF18 UVC sits at the top of Delivered, the red banner and the nav badge are gone. Held for about 3 s.
