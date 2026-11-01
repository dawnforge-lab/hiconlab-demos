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

## Art direction: "calm workshop office"
Redesigned after the owner's review ("cluttered and way too colourful"). Liftbay now looks like a well-made modern SaaS tool: neutral light surfaces, hairlines instead of fills, quiet type, generous white space and one restrained petrol accent. No theme, no decoration. Colour is kept for meaning: red means "act now" (invoice needed, late, overdue), amber means "keep an eye on it" (over its planned time, waiting parts, due), the accent marks what is live or done and the one primary action on each screen. Everything else is grey.

| Token | Hex | Use |
|---|---|---|
| Canvas | `#F5F5F6` | sidebar and page behind the content sheet |
| Surface | `#FFFFFF` / `#FAFAFB` | content sheet, cards, panels |
| Sunken | `#F4F4F6` | board lanes, quiet fills |
| Line | `#E8E8EB` / `#DADADF` | hairlines, borders |
| Ink | `#18191C` | text, "Ready" dot |
| Ink 2 | `#46484E` | secondary text |
| Muted | `#696B72` | meta text (AA on white and canvas) |
| Petrol (accent) | `#0F6E66` | primary buttons, active nav icon, focus ring, ramp progress, "in progress", paid/sent ticks |
| Red | `#C2362C` | invoice needed, late, overdue (text and small dots only) |
| Amber | `#965A00` | over time, waiting parts, payment due |

- **Accent choice:** petrol teal, not lime and not blue (the parallel Stampwell redesign uses blue). It is used sparingly: about one filled button per screen.
- **Type:** Archivo at its normal width for everything (weights 400–650, a real but modest scale: 26 / 18 / 15 / 14 / 13), tabular figures for money and times. JetBrains Mono only for invoice numbers and the VIN.
- **Shell:** a light sidebar on the grey canvas with the content on a white sheet (rounded, hairline border), like Linear or Vercel.
- **Signature details (quiet ones):**
  1. **Ramps summary:** one white card split into three cells (ramp, plate, elapsed time, mechanic and job, a 3px bar against the planned hours that turns amber when over). It replaces the old black bay display.
  2. **Number plates** stay recognisable but quiet: white, a hairline border, condensed bold Archivo and a thin grey band where the GB strip would be.
  3. **Status dots** instead of coloured badges: each column header and status label carries one small dot (grey arriving, petrol in progress, amber waiting, ink ready, hollow delivered).
- **Badges:** tinted pills are kept only for invoice due and overdue on the Invoices list. Everywhere else a state is a word with a small dot (`.flag`: "Invoice needed" in red, "Waiting for payment" and "Needs a price" in amber, "Paid" with a petrol dot) or plain text (Paid and Not paid in lists, open-job counts). Neutral outline tags remain only for "Business" and "Hidden from the workshop".
- **Quiet cards:** no "today" stamp on cars that came in today; on desktop the card's divider and Move button appear on hover or keyboard focus (always shown on touch); a late booking shows one action (Arrived), with Reschedule and No-show in its Move menu.
- **Calendar:** each day shows only a count, hours booked and a fill bar; the cars, times and jobs are in the day panel.
- **What was removed or demoted from the first build:** the three tinted alert banners became one line of text with two small dots (over-time now lives only on its ramp); the black bay display, lift schematics, dot texture and lime went; coloured column rules and tinted drop zones went; card badges (amber, plum, green, outline pills) became one grey meta line; filled red/green/plum state blocks became a single line of text, red only for "invoice needed"; the red ring on alert cards went; problem text shows only on Arriving cards; card buttons are all secondary (no black or green buttons on the board); the dark invoice slip and dark KPI tile are now light; charts are grey with the accent for today.
- **Imagery:** none. One inline SVG icon set (24px grid, 1.75 stroke, round joins). Charts on Reports are inline SVG from the same data.

## Screens (one page, hash routes)
- **Board** (`#/board`): date and upcoming count, search, walk-in; one "needs attention" line (cars to invoice, parts to order); the ramps summary (over time shows on its ramp); the kanban Arriving today → In progress → Waiting parts → Ready → Delivered with the source's card contents and rules (arrived check, mechanic and ramp picker, waiting-parts reason and ramp picker, "who did the work?", parts-not-arrived confirm, invoiced jobs can't go back, pay before delivery unless a business on terms). Drag with a mouse; every card also has a "Move to" menu for keyboard and touch.
- **Job page** (`#/job/<id>`): the vehicle file. Reported problem, work done (labour and parts, cost + markup), parts requests (Requested → Ordered → Arrived), workshop notes, office notes, vehicle details, previous visits, and the invoice panel (set price on unpriced lines, Subtotal / VAT 20% / Total, create invoice, send by email, mark as paid, mark as delivered, invoice preview).
- **Calendar** (`#/calendar`): month view, each weekday with its cars and a fill bar ("14/24 h · 3 ramps"), weekends closed, a day panel with times and a "may not fit" warning.
- **Vehicles**, **Clients**, **Invoices**, **Outbox**: tables built from the same data, with a vehicle drawer, invoice preview and email previews.
- **Reports** (`#/reports`): 8 KPI tiles; revenue by day for October, top five services, jobs per mechanic, ramp hours used.
- **Settings** (`#/settings`): company and invoicing, workshop and bookings, services, team, roles and permissions.
- **New booking** dialog: phone booking or walk-in; today's bookings land in Arriving today.

At 375px: a light top bar, a bottom tab bar with a "More" drawer, short attention chips, a horizontal ramp strip, a column switcher for the board (one column at a time) and "Move to" buttons instead of dragging.

## Data
Everything lives in `assets/js/data.js` and an in-memory store in `assets/js/app.js`. The demo's "today" is Thursday 29 October 2026 and the clock starts at 10:41. October's history (89 invoices, INV-2026-0001 to 0089) is generated from a fixed seed so reports, invoices, vehicles and the calendar agree. Parts are cost × (1 + 25% markup), VAT 20%, issued invoices never change. Reloading resets the demo.

## Files
`index.html` (one page, hash routes), `assets/css/site.css`, `assets/js/data.js` (seed and generated history), `assets/js/app.js` (store, router, board, job page, dialogs, drag), `assets/js/screens.js` (calendar, vehicles, clients, invoices, outbox, reports, settings), `assets/js/tour.js`, `assets/fonts/` (see `FONTS.md`). No images, no fal spend.

## Tour (38 s, recorded at 1536×864 and scaled to 1920×1080)
In the tour the demo clock runs ten times faster, so timers and timestamps visibly move on (10:41 → 10:46). Five captions, none in the poster.
1. 0–2.5 s: the board settles; caption "The whole workshop on one live board"; the cursor rests on the "1 car needs an invoice" line.
2. 2.5–4.5 s: marks LK19 XRT (booked 10:30, running late) as Arrived. The walk-in KM14 OWD was told it would be fitted in after the 10:30 booking, so LK19 goes first.
3. 4.5–7 s: caption "Get cars on ramps in a couple of clicks"; drags it to In progress; the start-work picker opens (Ramps 1 and 2 shown busy with their plates).
4. 7–10 s: picks Josh Bell and Ramp 3, starts the work; Ramp 3 fills in the ramps summary and its timer starts.
5. 10–12 s: the page scrolls back to the top; **poster frame**: the full board with all three ramps in use (Ramp 3 “Just started”), toasts cleared.
6. 12–19 s: caption "Enter the cost, the markup’s added for you"; opens SF18 UVC from Ready, sets the price on the tyres line (cost £58 + 25% = £72.50 each); Subtotal £205.00, VAT £41.00, Total £246.00.
7. 19–23 s: caption "Invoice, email and take payment in a few clicks"; creates INV-2026-0093 (confirm dialog), then sends it by email to Helen Marsh.
8. 23–29 s: marks it paid by card, then delivered.
9. 29–38 s: caption "Paid and handed over, and the board keeps up"; back to the board: SF18 UVC sits at the top of Delivered, the invoice line and the nav badge are gone. Held for about 3 s.
