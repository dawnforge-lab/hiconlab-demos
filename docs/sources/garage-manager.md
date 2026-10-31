# Source brief: Garage Manager (auto repair shop SaaS)

Read-only study of `D:\Garage` (Next.js 14 + SQLite garage management app). Demo 3 redesigns it with a modern SaaS look, using a new fictional UK garage and a new product brand. The real screens, rules and data shapes are below. (Source confirmation pending: the brief named `D:\Auto-repai-shop`, which is a static garage website.)

## Navigation
Side menu: Board, Calendar, Vehicles, Clients, Invoices, Outbox, Reports, Settings. A primary "+ New booking" button above. The Board item has a badge counting cars that are Ready with no invoice. Bottom: theme switch (Light/Dim/Dark), avatar "Name · role", log out. The menu folds to icons only.

## Screens
- Work Board: date, "N upcoming bookings", Walk-in button. Alert banners: red "N cars need an invoice: [plates]", purple "N parts to order", amber "still on Ramp N after its planned time". Ramp tiles, then the kanban.
- Job page (vehicle file): plate, make/model, client and contact, Business badge, "service · booked date · est h". Status select, mechanic and ramp, No charge, Fit in, Cancel. "Reported by the client" box. Panels: Work done, Parts needed (Requested → Ordered → Arrived), Invoice, Vehicle details (make/model/year/colour/mileage/VIN/MOT due/service due), Workshop notes, Office notes (hidden from the workshop), Photos, Previous visits timeline.
- New booking: tabs Booking (phone) and Walk-in now. Phone, registration, name, email, Private/Business (company, VAT number, address), service, "What the client said", appointment picker.
- Calendar: month grid, each day shows cars and a fill bar ("6/16 h · 2 lifts"), Closed, online bookings off. Day panel: "X of Y hours booked on N lifts", "may not fit" warning, the day's cars "10:00–12:00".
- Vehicles: Vehicle / Visits / Last visit / Last mileage. Vehicle page: service history, details, who booked it, email the service-history PDF.
- Clients: Client / Contact / Cars / Visits / Open / Last booking. Business clients have payment terms in days.
- Invoices: Invoice / Client / Vehicle / Total / Emailed / Paid (Paid, Not paid, "Due 12 Nov", Overdue).
- Outbox: every email sent (to, subject, time, attachment, status) with an HTML preview.
- Reports: 8 KPI cards (revenue this month ex VAT + VAT, total revenue, open bookings, bookings this month, average invoice, invoices issued, no-shows, cancellations), top 5 services, jobs per mechanic (jobs, finished, ramps used), jobs per ramp (jobs, hours, finished). No charts yet; a redesign can add them.
- Settings: Company & invoicing, Workshop & bookings, Services, Team, Roles & permissions (about 19 areas × None/View/Edit).

## Kanban board
Columns: Arriving today → In Progress → Waiting Parts → Ready → Delivered (today only, "N older in vehicle history →").

Card: plate chip, mechanic initials, top-right chip (arrival time, red if missed, Walk-in / Fit in tag; days in work, red after 5 days; handover time on Delivered), make and model, service, 2-line problem text. Badges: "N previous no-shows", "Check details", "2 parts requested", "Parts arrived", "N to price", "No charge". Waiting Parts cards show the reason and "On Ramp 2" or "Off the ramp". Ready cards show red "Work done — invoice needed" (red ring) or green "Invoiced — waiting for client" with the invoice number. Footers: Arrived / Reschedule / No-show; "Arrived 09:52 · waiting for a ramp"; Mark as paid → Mark as delivered; "Hand over · pay by …" for business terms.

Rules:
- To In Progress the car must have arrived. If it isn't on a ramp, a picker asks for a mechanic and a ramp (busy ramps disabled showing their plate; "Every ramp has a car on it").
- To Waiting Parts a picker asks the reason (Waiting for parts / Owner's decision / Waiting for the client's OK / Waiting for another job / Other) and Stays on Ramp N / Move to Ramp M / Off the ramp.
- To Ready: confirm if requested parts haven't arrived; ask "Who did the work?" if no mechanic.
- Invoiced jobs can't go back.

Ramp tiles: "RAMP 1", plate, elapsed "1 h 20 min", "mechanic · service"; amber "over its time"; "Waiting Parts · reason"; a free ramp is a dashed "Free" tile.

## Data model (abridged)
- clients: full_name, phone, email(s), payment_terms_days.
- vehicles: plate (unique), make, model, year, colour, mileage, vin, mot_due, service_due; previous plates.
- bookings (= jobs): service_type, problem_description, mileage, status, tracking_code (XXXX-XXXX), preferred_date/time, arrival_time, est_hours, customer_type private/business, company, mechanic, walk_in, fit_in, no_charge, arrived_at, delivered_at, ramp, on_ramp, ramp_started_at, wait_reason.
- work_items: title, description, category (Labour / part / other), cost, markup_pct, qty, needs_price.
- parts_requests: name, qty, note, status requested → ordered → arrived.
- invoices: number INV-YYYY-0001 (sequential per year), issued_at, totals ex VAT / VAT / incl VAT, emailed_at, paid_at, due_date; invoice_items. Parts are cost × (1 + markup), default markup 25%; VAT 20%. Issued invoices are never edited; extra work goes on an additional invoice.
- Roles: Owner, Manager, Receptionist, Mechanic.

## Seed data (rename everything for the demo)
Board examples:
| Status | Plate | Car | Job |
|---|---|---|---|
| Arriving 10:00 | LK19 XRT | — | Brakes, front squeak |
| Arriving 12:00 | YD21 HBN | — | Engine diagnostics, warning light (1 previous no-show) |
| In Progress, Ramp 1 | MA17 PLV | Ford Focus 2017, 68,400 mi | Battery drain; diagnostic £60; note "~120 mA on radio circuit"; part request "Battery 70Ah" |
| In Progress, Ramp 2 | BV20 KTE | VW Golf 2020, 41,200 mi | General service £120, oil filter £8.50, 5 × 5W-30 oil £7.20 |
| Waiting Parts | WR16 ZNA | Vauxhall Astra 2016, 92,800 mi | Rear clunk; labour £90, 2 × rear shock £42 (ordered, ETA Thursday) |
| Ready, no invoice | SF18 UVC | Toyota Yaris 2018 | Tyres; fitting £30 × 2, 2 × 185/65 R15 at £58 cost → £205 + VAT £41 = £246 |
| Delivered | NX15 FJD | BMW 320d 2015, 121,000 mi | Soft brake pedal; labour £110, discs £64, pads £32 (cost) → £230 + £46 = £276 |
| Delivered | PE68 RXA | Nissan Qashqai 2018 | AC regas £75, cabin filter £14 |

History: clutch with DMF (£380 labour, £420 kit), cam belt kit (£220 + £145), interim service £85.

Services and hours: General Service 2, Oil & Filter 0.25, Brakes 2, Diagnostics 1, Clutch & Gearbox 6, Cam Belts 4, Suspension 3, Tyres & Bearings 1, AC & Heating 1, Electrical & Battery 1.5, Commercial Van 3, Seasonal Check 0.5. Workshop: Mon–Fri 08:00–16:00, 2 lifts, bookings up to 42 days ahead.

## Showcase flows
A. Online booking → tracking: plate (big yellow plate input) → service cards → day/time (free times only) → details (Private/Business) → confirm → "You're booked in, Sam!" with reference and "What happens next" → confirmation email in the outbox → card appears in Arriving today.

B. Board to Ready: Arrived → drag to In Progress → mechanic + ramp picker → ramp tile fills → mechanic adds lines (one unpriced: "1 to price") and requests a part → "1 part to order" banner → Waiting Parts picker (reason, stays on ramp) → parts arrive → Ready → red "invoice needed".

C. Invoice to handover: Invoice panel "Invoice needed" → Set price on unpriced lines → Subtotal / VAT 20% / Total → Create invoice (INV-2026-0009) → Send by email ("your vehicle SF18 UVC is ready!", PDF) → Mark as paid → Mark as delivered → card moves to Delivered.

Client tracking page: reference header, plate and car hero, status note, stepper Booked → Work in progress (or waiting for parts) → Ready; Ready shows "Your vehicle is ready to collect"; Collected shows "thank you" and the link expires.

## Current look (move away from it)
Navy brand palette (#213690 / #132055), plate yellow #f9d10c as primary buttons, Geist, slate-100 page, rounded-2xl cards with shadow, emoji used as badge icons, Light/Dim/Dark themes.
