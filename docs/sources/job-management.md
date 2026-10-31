# Source brief: Job management SaaS (job scheduling)

Read-only study of `D:\Workflows\JobManagement` (shown to customers as CrewDeployed, "TradeFlow" in the code). Demo 4 redesigns it with a modern SaaS look, under a new fictional product brand and a fictional UK trades business.

## What it is
Multi-tenant SaaS for UK trade businesses (plumbers, electricians, heating engineers, builders). The office quotes, creates jobs, schedules crews, approves crews' daily job sheets, invoices and records payments. Crews use the same responsive web app on their phones. GBP, VAT 20%.

## Navigation
Sidebar: Dashboard, Jobs, Job Sheets, Clients, Quotes, Invoices, Schedule, Inventory, Reports, Attendance; admin group Team, Trash; bottom Help, Settings. Below 1024px the menu becomes a drawer.

## Screens
- Dashboard: greeting "Good morning, {name}." with a mono eyebrow. Buttons: Schedule / New quote / New job sheet / New job. Up to 5 KPIs with sparklines (Active jobs, Today's schedule, Sheets pending, Overdue £, Low stock, Pending quotes, Clients). Panels: Today (timeline), Pending approvals, Activity, Low stock.
- Jobs list: tabs All/Active/Awaiting/Done/Paid/Cancelled; columns Ref, Job, Client, Status, Team, Due (Today/Tomorrow chips), Value. Job page: "Move job forward", description, line items, job sheets, time entries, notes, photos, status history; right rail with client, site (open in maps), team, linked quote/invoice.
- Job Sheets review queue: tabs All/Completed/Approved/Rejected, "Group by job". Review page: Parts used, Labour, Site photos, Customer sign-off, Timeline, Planned vs actual, Office review (Approve / Reject with reason).
- Quotes: Draft/Sent/Viewed/Accepted/Converted/Rejected. Client portal: Approve/Reject.
- Invoices: Draft/Sent/Overdue/Paid plus "Ready to invoice". Send, Record payment, Void, PDF.
- Reports: 7d/30d/90d/YTD; KPIs Cash received, Jobs completed, Avg invoice, Team hours; cash over time chart, cash by method, by technician, top clients.
- Inventory with barcodes, Attendance (clock in/out, leave).

## Schedule
- Day / Week / Month calendar time grid (07:00–19:00, 15-minute snap). Drag to move, resize from the bottom edge. Team-member chips filter to one person. "Today" side panel. Clicking a slot opens New entry. A clash shows "Schedule conflict detected" with Save anyway / Cancel.
- Colours by job status: Scheduled blue tint; Live solid blue; Done (to invoice) solid green; Invoiced muted green with a tick; Late red outline; Cancelled grey struck through. Entry types: Break/Travel amber, Holiday red, Training green.
- Assignment: a primary person plus a crew with roles ("Lead", "Apprentice"). Assigned people are flagged "Conflict" or "Holiday" if already booked. Moving the entry reschedules the job.
- A redesign may add a per-person dispatch lane view (the real app is a time grid filtered by person). If added, keep it believable.

## Data model (abridged)
- Job: ref `JOB-YYYYMMDD-001`, title, description, priority LOW/NORMAL/HIGH/URGENT, scheduled and actual start/end, site address, estimated/actual value, client, assignee + crew, tags, linked quote/invoice. Statuses: PENDING → SCHEDULED → IN_PROGRESS → ON_HOLD → COMPLETED → READY_TO_INVOICE → INVOICED → PAID (+ CANCELLED).
- JobSheet (a daily log per visit): workDate, status Draft / Completed / Approved / Rejected, work description, notes, customer signature (name, time), materials (taken/used/returned, unit price), time entries (start/end, break, rate), photos BEFORE/AFTER/GENERAL.
- Client: individual or company, contacts, sites (label, postcode), portal token.
- Team: hourly rate charged to the client; employment status (employee, self-employed, apprentice).
- Invoice: ref `INV-YYYYMMDD-001`, Draft/Sent/Viewed/Paid/Partial/Overdue/Void, subtotal, VAT, total, amount paid, due date, payment terms. Payments: bank transfer, cash, card, other.
- Quote: ref `QUO-…`, Draft/Sent/Viewed/Accepted/Rejected/Expired/Converted, valid until, discount, VAT.
- Roles: owner, admin, manager, technician (+ custom), about 50 permissions. Technicians without "view prices" see no amounts.
- Invoices are not created automatically: "Approve & create invoice" on a completed sheet, or "Create invoice" from Ready to invoice. Automatic: job to Ready to invoice when all sheets are approved; full payment sets invoice and job to Paid; overdue and quote expiry checks.

## Seed data (rename for the demo)
Team rates: owner £55, admin £50, manager £45, technician £32, senior plumber £35, apprentice £28. Products (cost / sell): kitchen sink mixer tap £45/£85, copper pipe 15mm x 3m £8/£15, digital thermostat £25/£55, shower mixer valve £65/£125, lockshield radiator valve £4/£9.50; twin & earth 2.5mm 100m £120, MCB 32A £20, RCBO £55, USB double socket £32. Example jobs: kitchen renovation plumbing, central heating upgrade, emergency repair, full rewire of a residential property, office fit-out.

## Showcase flows
A. Quote → job: quote sent → client opens portal (Sent → Viewed) → Approve (Accepted) → "Convert to job" (lines tagged "From quote").
B. Job → schedule → job sheet on a phone: new job with client, site, start/end, crew with roles → appears on the week grid → technician's phone job sheet (materials, timer, photos, work description) → "Mark as completed" → customer signature "Sign & complete".
C. Approval → invoice → payment: Job Sheets Completed tab → review (parts, labour, photos, sign-off, planned vs actual) → Approve (stock deducted, labour line at hourly rate, job Ready to invoice) → "Approve & create invoice" → Send → Record payment → Paid.

## Current look (move away from it)
Zinc neutrals with blue #2563eb accent, Inter + Geist Mono eyebrows, dense 12.5–13px UI, 220px sidebar with a 2px blue active bar, shadcn-style pills and panels. It is already a "polished modern SaaS" look, so the redesign must be clearly more distinctive, not just a reskin.
