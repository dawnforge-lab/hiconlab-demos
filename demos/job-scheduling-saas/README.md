# Stampwell: job software for Hartwell & Lowe Heating (demo 4)

A redesign of a real job-management SaaS for UK trades (`D:\Workflows\JobManagement`, summarised in `docs/sources/job-management.md`) under a new fictional product brand. It shows Hiconlab's web development work: an office that dispatches a call-out onto the right engineer, signs off yesterday's job sheet and turns it into an invoice that gets paid, with the numbers on the Today screen keeping up. Everything runs in the browser from an in-memory store; reloading resets it.

## Brand
- **Product:** Stampwell, job software for trades: schedule, job sheets, invoices. Named after the office rubber stamp, because the moment the product exists for is the sign-off.
- **Tenant:** Hartwell & Lowe Heating, Unit 6, Dyehouse Yard, Stroud GL5 3JR. 01632 960274, office@hartwell-lowe.example.
- **Story:** Tom Hartwell (Gas Safe engineer) started the firm with Jo Lowe, who runs the office. Six people on the tools across the Five Valleys: boilers, radiators, bathrooms, landlord certificates. It is the first week of November, so the phone does not stop.
- **Name check (31 Oct 2026):** the first name, Inkpad, was dropped: it is already an iPad vector app, a notepad app on iOS and Android, and an Obsidian plugin. "Stampwell" was then searched on the web, on the App Store and on Google Play: no app or software of that name came up. The only uses found were a rubber-stamp supplier in Pune, India (Stampwell Marking Products) and a listed farmhouse in England, neither of them software. "Hartwell & Lowe" / "Hartwell and Lowe" heating and plumbing Stroud found no business of that name (the nearest was a dissolved Hartnell Heating & Plumbing in Essex).
- **People (all fictional):** Jo Lowe (office, the user), Tom Hartwell (owner, gas engineer, £60/h), Dan Pryce (heating engineer, £55/h), Priya Shah (heating engineer, £55/h), Kieran Doyle (plumber, £48/h), Megan Ellis (plumber, £48/h), Alfie Cole (apprentice, £28/h). Clients and addresses are invented; postcodes are plausible Stroud-area ones.

## Audience
The person in the office of a 4–10 person trades firm who takes the calls, juggles the diary and chases the money, plus the owner checking the numbers at night. They want to see who is where, catch double-bookings before an engineer does, and get paid for work the day it is signed off.

## Art direction: clean, modern SaaS (second version)
The first build was themed ("signwritten van, duplicate book": a van-green bar, gold coachline, Besley and Courier, rubber stamps, carbon-copy paper, a wall-planner board). The owner found it cluttered and too designed, and asked for a modern SaaS look like the real app. This version starts from the look of `D:\Workflows\JobManagement` (its Tailwind tokens, sidebar, pills and panels) and refines it: neutral surfaces, one blue accent, quiet type, white space, and colour only where it means something.

| Token | Hex | Use |
|---|---|---|
| Background | `#fafafa` | app background |
| Surface | `#ffffff` / `#f4f4f5` | panels, documents / hover, neutral pills |
| Border | `#e4e4e7` / `#d4d4d8` | hairlines / inputs |
| Text | `#09090b` / `#3f3f46` / `#52525b` / `#71717a` | text, secondary, muted, faint (AA on white) |
| Blue | `#2563eb` (soft `#eff5ff`, tint `#dbe7fe`, text `#1d4ed8`) | the one accent: primary buttons, active nav bar, booked and on-site jobs, links |
| Green | `#ecfdf5` / `#15803d` | paid, approved |
| Amber | `#fef3c7` / `#92400e` | sheet to check, part paid |
| Red | `#fef2f2` / `#b91c1c` / `#dc2626` | overdue, urgent, clashes, the now line |

- **Type:** Inter for everything, with tabular figures for money; Geist Mono only for references, times and small labels (as in the real app).
- **Layout:** a 232px white sidebar with a 2px blue bar on the active item, one count badge (job sheets), and the page on `#fafafa`. One primary action per screen.
- **Statuses** are small mono pills in soft tints. The schedule is a plain time grid: booked jobs in a soft blue tint, on-site jobs solid blue, finished jobs grey with a tick, time off hatched grey, travel as a faint dashed line, clashes in red.
- **Documents:** the job sheet and the invoice are plain, well-set documents on white: a title, a meta grid, tables with light rules, totals. Approval and payment show as a green note or pill.
- **Removed from the first version:** the van-green top bar and gold coachline, Besley and Courier Prime, rubber stamps, carbon-copy and hole-punched paper, the wall-planner T-card styling, coloured avatars, the five-figure strip with mini bar chart, the Money in and Today so far panels on Today (merged into one Needs attention list), the overdue badge in the nav, and most status colours.
- **Imagery:** three site photos on the job sheet (before, after, new pipe run), plain and rounded. Icons are one inline SVG set.

### Image prompts (fal.ai)
- Before (FLUX.1 Krea dev, seed 4103): "Amateur smartphone photo taken by a plumber on a job: an old tired single-panel radiator with flaking cream paint and rust spots at the bottom corners, under a white uPVC window in a small British bedroom, grey cord carpet with a dust sheet, old brass radiator valve, pale grey walls. Soft overcast daylight, phone camera, slightly off-level, realistic, no people, no text"
- After (nano-banana edit of the before photo, so the room matches): "Replace the old rusty radiator with a brand new clean white double-panel convector radiator of the same width … white thermostatic radiator valve on the right and a chrome lockshield valve on the left … Keep the same room, window, wall colour, skirting, carpet, camera angle and overcast daylight exactly the same. Realistic phone photo."
- Pipe run (FLUX.1 Krea dev): "Close-up amateur smartphone photo by a plumber: a newly fitted 15mm copper pipe running neatly along the top of a white painted skirting board, held by white plastic pipe clips, rising to the chrome valve of a white radiator …"

## Screens (one page, hash routes)
- **Today** (`#/today`): greeting and date, four figures (on today, sheets to check, waiting to be paid, paid in November) with what changed since 10:12, the team's day as compact lanes, and one Needs attention list (sheets to check and overdue invoices).
- **Schedule** (`#/schedule`): the dispatch board for a day (Mon–Fri tabs), the To schedule tray, time off on the lanes, drag a job onto a lane (15-minute snap) or drag a booking to move it. Assign (and Move, from a job page) does the same from the keyboard or a phone.
- **Jobs** (`#/jobs`, `#/jobs/<id>`): tabs by status; a job page with the progress track, visits (with Move), paperwork, site and team.
- **Job sheets** (`#/sheets`, `#/sheets/<id>`): the review queue and the sheet: work done, parts used, labour, site photos, customer sign-off, planned vs actual, Approve or Send back with a reason, then Create invoice.
- **Invoices** (`#/invoices`, `#/invoices/<id>`): tabs All / Draft / Sent / Overdue / Paid (cards on a phone); the invoice document with the VAT number, lines, Subtotal, VAT 20%, Total; Send, Record payment (full or part, never dated before the invoice).
- **Quotes**, **Clients**: tables from the same data.
- **Reports** (`#/reports`): this week or the last four weeks: cash received (from actual payments, including part payments), invoiced, average invoice, labour hours, cash by day or week, how people paid, invoiced by engineer, top clients.

### Booking rules (one rule for drop, Assign, suggestions and moves)
- Only Gas Safe engineers get gas work; Alfie, the apprentice, only goes out as crew.
- Nothing can start before the next quarter hour after now plus 15 minutes (10:30 at 10:12), or finish after 17:30.
- Time off blocks the lane: Megan's afternoon holiday today, Priya's gas reassessment on Friday afternoon, Alfie's college afternoon on Wednesday.
- No overlap, and the drive either side has to fit: drive time comes from the distance between the two addresses (4 min plus about 3 min a mile).
- When a booking breaks a rule, the card says which rule and why, and offers the nearest engineer free at that time (or the nearest time someone is), the same engineer's next workable slot, or booking anyway (never over time off).

At 375px: a compact bar, a bottom tab bar with More, the tray first, then one engineer's day at a time (it switches to whoever just got the job), Assign instead of dragging, cards for invoices, and tap targets of at least 44px.

## Data
`assets/js/data.js` plus an in-memory store in `assets/js/app.js`; reloading resets the demo. The demo's "today" is Thursday 5 November 2026, 10:12 (in tour mode the clock runs at one minute every three seconds). Refs follow the source: `JOB-YYYYMMDD-NNN`, `INV-YYYYMMDD-NNN`, `QUO-YYYYMMDD-NNN`. VAT 20% on everything (VAT reg. no. GB 284 6170 52, fictional); labour is hours on site minus breaks, times the engineer's rate, written "Labour: Name" on every invoice; parts at sell price. October's invoices and this week's finished work come from a fixed seed, so the schedule, invoices, Today figures and reports agree. This week's generated work goes to clients who are not already in the diary; a few hand-written clients do have two visits this week (Rosa Kemp: a tap on Wednesday and radiator valves on Friday; Lucy Fenwick: a WC valve on Tuesday and a boiler service today). Payments are kept as a list on each invoice, so part payments count in the figures and reports. Most customers pay by bank transfer, some by card, about one in twelve in cash. The sheet in the tour: parts £330.50 + labour £415.00 (Dan 5 h at £55, Alfie 5 h at £28) = £745.50, VAT £149.10, total £894.60; quoted £683.50, the extra pipe run agreed on site. Dates on the invoice are written without a year so the video does not date.

Fal spend: about $0.18 (five FLUX.1 Krea dev images at 1024×768, one FLUX Kontext pro and one nano-banana edit). Used: the seed-4103 "before", the nano-banana "after" (same room) and the first pipe-run image; originals kept in the scratchpad, optimised WebP at 480 and 1000 px in `assets/img/`.

## Files
`index.html`, `assets/css/site.css`, `assets/js/data.js`, `assets/js/app.js` (store, router, shell, Today, Schedule), `assets/js/screens.js` (sheets, invoices, jobs, quotes, clients, reports), `assets/js/tour.js`, `assets/img/`, `assets/fonts/` (see `FONTS.md`).

## Tour (about 39 s at 1536×864, scaled to 1920×1080)
1. 0–1.3 s: Thursday's dispatch board, settled. Mrs Okafor's urgent "no heating or hot water" is in To schedule.
2. 1.3–5 s: caption "Urgent call-outs go straight into someone's day". The card is dragged onto Dan's lane at 11:00; lanes of people who can't take gas work dim.
3. 5–11 s: Dan is on the lounge radiator swap until 12:30: a hatched red clash and a decision card. Caption "Clashes are caught before anyone's double-booked". "Give it to Priya at 11:00" (free 10:30–13:30, a 10 min drive from her last job, Gas Safe).
4. 11–15 s: the job lands in Priya's lane and Grace gets a text. The message clears, then the **poster**: the full board.
5. 15–25 s: Job sheets. Caption (top) "Yesterday's job sheets, checked from the office". Sheet No. 0417 scrolls past parts, labour, photos, signature and planned vs actual. Approve: the sheet is marked approved and the Job sheets count goes from 3 to 2.
6. 25–31 s: caption (top) "Approved work becomes an invoice in one click". Create invoice (INV-20261105-001, £894.60) and send it to Helen.
7. 31–39 s: back to Today. Caption "Customers pay from the email, and the figures keep up". A couple of minutes after it was sent, Helen pays from the link in the email: Paid in November counts up by £894.60, with "1 approved today" and "+1 booked since 10:12". Held about 3 s.
