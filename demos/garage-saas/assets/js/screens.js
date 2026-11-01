/*
 * Liftbay demo: calendar, vehicles, clients, invoices, outbox, reports, settings.
 * Uses the store and helpers that app.js puts on window.LB.
 */
(function () {
  'use strict';
  var L = window.LB, S = L.S, D = L.D, U = L.U, V = L.views;
  var esc = L.esc, icon = L.icon, money = L.money, plate = L.plate;
  var TODAY = D.TODAY;

  function allBookings() { return S.history.concat(S.jobs, S.upcoming); }
  function pageHead(title, sub, actions) {
    return '<header class="page-head"><div><p class="eyebrow">Calder &amp; Price Motors · Kendal</p><h1 class="page-title">' + title + '</h1>' + (sub ? '<p class="page-sub">' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="head-actions">' + actions + '</div>' : '') + '</header>';
  }
  function searchBox(id, label, value, ph) {
    return '<label class="search"><span class="sr-only">' + label + '</span>' + icon('search') + '<input type="search" id="' + id + '" data-fk="' + id + '" placeholder="' + ph + '" value="' + esc(value || '') + '" autocomplete="off"></label>';
  }
  function liveSearch(id, key) {
    var input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', function () {
      S[key] = input.value; S[key + 'Page'] = 1;
      var pos = input.selectionStart; L.commit();
      var again = document.getElementById(id); again.focus(); try { again.setSelectionRange(pos, pos); } catch (e) { /* ignore */ }
    });
  }

  // ---- Calendar ------------------------------------------------------------
  S.calMonth = '2026-10'; S.calDay = TODAY;
  var CAP = D.company.hoursPerDay * D.company.ramps;
  function dayJobs(d) {
    return allBookings().filter(function (j) { return j.date === d; }).sort(function (a, b) { return (a.time || '00').localeCompare(b.time || '00'); });
  }
  function dayHours(list) { return list.filter(function (j) { return j.status !== 'cancelled'; }).reduce(function (s, j) { return s + j.estHours; }, 0); }
  function fillBar(h) {
    var pct = Math.min(100, h / CAP * 100);
    return '<div class="fill-bar' + (h > CAP ? ' is-full' : h >= CAP * 0.85 ? ' is-high' : '') + '"><i style="width:' + pct + '%"></i></div>';
  }
  V.calendar = function () {
    var ym = S.calMonth.split('-').map(Number);
    var first = new Date(ym[0], ym[1] - 1, 1, 12), days = new Date(ym[0], ym[1], 0).getDate();
    var lead = (first.getDay() + 6) % 7;
    var minM = '2026-10', maxM = '2026-12';
    var h = pageHead('Calendar', 'Mon–Fri, 08:00–16:00 · ' + D.company.ramps + ' ramps · ' + CAP + ' workshop hours a day · bookings up to ' + D.company.bookAhead + ' days ahead');
    h += '<div class="cal-wrap"><section class="panel" aria-labelledby="cal-h"><div class="cal-head">' +
      '<button type="button" class="icon-btn" data-action="cal-prev" aria-label="Previous month"' + (S.calMonth <= minM ? ' disabled' : '') + '>' + icon('chevLeft') + '</button>' +
      '<h2 id="cal-h">' + L.MONTHS[ym[1] - 1] + ' ' + ym[0] + '</h2>' +
      '<button type="button" class="icon-btn" data-action="cal-next" aria-label="Next month"' + (S.calMonth >= maxM ? ' disabled' : '') + '>' + icon('chevRight') + '</button>' +
      '<button type="button" class="btn btn-sm" data-action="cal-today">Today</button>' +
      '<div class="cal-legend"><span><i style="background:#9FA2A9"></i>Booked</span><span><i style="background:var(--amber)"></i>Nearly full</span><span><i style="background:var(--red)"></i>Over</span></div></div>' +
      (S.calMonth === minM ? '<p class="panel-note" style="margin-bottom:10px">Bookings before 1 October are in your previous system.</p>' : '') +
      '<div class="cal" role="group" aria-labelledby="cal-h">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (d) { return '<div class="cal-dow" aria-hidden="true">' + d + '</div>'; }).join('');
    for (var i = 0; i < lead; i++) h += '<div class="day is-out" aria-hidden="true"></div>';
    for (var d = 1; d <= days; d++) {
      var iso = ym[0] + '-' + U.pad(ym[1]) + '-' + U.pad(d), wd = U.dow(iso);
      if (wd === 0 || wd === 6) { h += '<div class="day is-closed"><span class="day-n">' + d + '</span><span class="day-closed">Closed</span></div>'; continue; }
      var list = dayJobs(iso), hrs = dayHours(list);
      var shown = list.filter(function (j) { return j.status !== 'cancelled'; });
      // Each day carries a count and how full it is; the cars themselves are in the day panel.
      h += '<button type="button" class="day' + (iso === TODAY ? ' is-today' : '') + '" aria-pressed="' + (S.calDay === iso) + '" data-action="cal-day" data-day="' + iso + '">' +
        '<span class="day-n"><span class="sr-only">' + L.DAYS[wd] + ' </span>' + d + '<span class="sr-only"> ' + L.MONTHS[ym[1] - 1] + (shown.length ? ',' : ', nothing booked') + '</span></span>' +
        (shown.length ? '<span class="day-fill"><span class="fill-txt"><b>' + shown.length + '<span class="fill-unit"> ' + (shown.length === 1 ? 'car' : 'cars') + '</span></b><span class="fill-h">' + L.halves(hrs) + '\u00a0h<span class="sr-only"> of ' + CAP + ' booked</span></span></span>' + fillBar(hrs) + '</span>' : '') + '</button>';
    }
    h += '</div></section>';
    var sel = S.calDay, list2 = dayJobs(sel), hrs2 = dayHours(list2), wd2 = U.dow(sel);
    h += '<section class="panel day-panel" aria-live="polite" aria-labelledby="day-h"><p class="eyebrow">' + (sel === TODAY ? 'Today' : sel < TODAY ? 'Past day' : 'Coming up') + '</p><h3 id="day-h">' + L.fmtLong(sel) + '</h3>';
    if (wd2 === 0 || wd2 === 6) h += '<p class="panel-note" style="margin-top:8px">Closed at weekends.</p>';
    else {
      h += '<p class="page-sub" style="margin:6px 0 10px"><b>' + L.halves(hrs2) + ' of ' + CAP + '\u00a0hours</b> booked on ' + D.company.ramps + ' ramps</p>' + fillBar(hrs2);
      if (hrs2 > CAP) h += '<div class="notice" style="margin-top:12px">' + icon('alert') + '<span>May not fit: ' + (hrs2 - CAP) + ' h over. Think about moving a long job.</span></div>';
      h += '<ul class="day-list" style="margin-top:8px">' + (list2.length ? list2.map(function (j) {
        var v = L.veh(j), end = j.time ? U.hm(Number(j.time.slice(0, 2)) * 60 + Number(j.time.slice(3)) + Math.round(j.estHours * 60)) : '';
        var st = j.status === 'cancelled' ? '<span class="flag flag-red">Cancelled</span>' : j.status === 'no_show' ? '<span class="flag flag-red">No-show</span>' : j.status === 'booked' ? (j.online ? '<span class="flag">Booked online</span>' : '') : '<span class="status st-' + j.status + '">' + ({ new: j.arrivedAt ? 'Here, waiting for a ramp' : 'Arriving', in_progress: 'In progress', waiting_parts: 'Waiting parts', ready: 'Ready', delivered: 'Delivered' })[j.status] + '</span>';
        return '<li><span class="day-time">' + (j.time ? j.time + '–' + end : j.fitIn ? 'Fit in' : 'Walk-in') + '</span><div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + plate(j.plate, 'sm') + st + '</div>' +
          '<p class="day-what"><a href="#/job/' + j.id + '">' + esc(L.carName(v)) + '</a><span class="day-sep"> · </span><span>' + esc(j.service) + ' · ' + L.hoursTxt(j.estHours) + '</span></p></div></li>';
      }).join('') : '<li style="display:block" class="panel-note">Nothing booked yet.</li>') + '</ul>';
      if (sel >= TODAY) h += '<button type="button" class="btn btn-block" style="margin-top:12px" data-action="new-booking">' + icon('plus') + 'Book a car in</button>';
    }
    h += '</section></div>';
    return h;
  };
  function shiftMonth(n) { var p = S.calMonth.split('-').map(Number), d = new Date(p[0], p[1] - 1 + n, 1); S.calMonth = d.getFullYear() + '-' + U.pad(d.getMonth() + 1); }
  L.actions['cal-prev'] = function () { shiftMonth(-1); L.commit(); };
  L.actions['cal-next'] = function () { shiftMonth(1); L.commit(); };
  L.actions['cal-today'] = function () { S.calMonth = TODAY.slice(0, 7); S.calDay = TODAY; L.commit(); };
  L.actions['cal-day'] = function (b) {
    S.calDay = b.dataset.day; L.commit();
    var again = document.querySelector('[data-day="' + S.calDay + '"]'); if (again) again.focus({ preventScroll: true });
    if (window.innerWidth <= 1180) { var p = document.querySelector('.day-panel'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };

  // ---- Vehicles ------------------------------------------------------------
  S.vehQ = ''; S.vehQPage = 1;
  function vehicleRows() {
    var visits = {};
    S.history.concat(S.jobs).forEach(function (j) {
      if (j.status !== 'delivered') return;
      var r = visits[j.plate] || (visits[j.plate] = { n: 0, last: '', miles: 0 });
      r.n++; if (j.date > r.last) { r.last = j.date; r.miles = j.mileage; }
    });
    return Object.keys(S.vehicles).map(function (p) {
      var v = S.vehicles[p], r = visits[p] || { n: 0, last: '', miles: 0 };
      var old = v.history.filter(function (x) { return x.note !== 'No-show'; });
      var lastOld = old.length ? old.slice().sort(function (a, b) { return b.date.localeCompare(a.date); })[0] : null;
      if (!r.last && lastOld) r.miles = lastOld.mileage;
      return { v: v, visits: r.n + old.length, last: r.last || (lastOld ? lastOld.date : ''), miles: r.miles || v.mileage };
    }).filter(function (r) { return r.last; }).sort(function (a, b) { return b.last.localeCompare(a.last); });
  }
  V.vehicles = function () {
    var rows = vehicleRows(), q = S.vehQ.trim().toLowerCase().replace(/\s+/g, '');
    if (q) rows = rows.filter(function (r) { var c = S.clients[r.v.clientId]; return (r.v.plate + L.carName(r.v) + c.name + (c.company || '')).toLowerCase().replace(/\s+/g, '').indexOf(q) >= 0; });
    var shown = rows.slice(0, 25 * S.vehQPage);
    var h = pageHead('Vehicles', '<b>' + vehicleRows().length + '</b> cars and vans with a visit on record', searchBox('veh-q', 'Find a vehicle', S.vehQ, 'Plate, car or owner'));
    h += '<section class="panel big-table" aria-label="Vehicles"><div class="table-wrap"><table class="table"><thead><tr><th>Vehicle</th><th>Owner</th><th class="r">Visits</th><th>Last visit</th><th class="r">Last mileage</th><th>MOT due</th></tr></thead><tbody>' +
      (shown.length ? shown.map(function (r) {
        var c = S.clients[r.v.clientId], motSoon = r.v.motDue <= U.addDays(TODAY, 30);
        return '<tr class="is-row" data-action="open-vehicle" data-plate="' + esc(r.v.plate) + '"><td><div class="cell-vehicle">' + plate(r.v.plate) + '<div><button type="button" class="link-btn cell-strong" data-action="open-vehicle" data-plate="' + esc(r.v.plate) + '">' + esc(L.carName(r.v)) + '</button><div class="cell-sub">' + r.v.year + ' · ' + esc(r.v.colour) + '</div><div class="cell-sub sm-only">' + esc(S.clients[r.v.clientId].company || S.clients[r.v.clientId].name) + '</div></div></div></td>' +
          '<td class="hide-sm">' + esc(c.company || c.name) + '</td><td class="r money hide-sm">' + r.visits + '</td><td class="c-end"><span class="cell-sub">' + L.fmtDate(r.last) + '</span></td><td class="r money hide-sm">' + (r.miles ? r.miles.toLocaleString('en-GB') + ' mi' : '—') + '</td>' +
          '<td class="hide-sm">' + (motSoon ? '<span class="flag flag-amber">' + L.fmtDate(r.v.motDue) + '</span>' : L.fmtDate(r.v.motDue)) + '</td></tr>';
      }).join('') : '<tr><td colspan="6" class="panel-note">No vehicle matches “' + esc(S.vehQ) + '”.</td></tr>') + '</tbody></table></div>' +
      (rows.length > shown.length ? '<div class="show-more"><button type="button" class="btn" data-action="veh-more">Show more · ' + (rows.length - shown.length) + ' left</button></div>' : '') + '</section>';
    return h;
  };
  V.vehicles.after = function () { liveSearch('veh-q', 'vehQ'); };
  L.actions['veh-more'] = function () { S.vehQPage++; L.commit(); };
  L.actions['open-vehicle'] = function (b) {
    var v = S.vehicles[b.dataset.plate], c = S.clients[v.clientId];
    var jobs = S.history.concat(S.jobs, S.upcoming).filter(function (j) { return j.plate === v.plate; }).sort(function (a, b2) { return b2.date.localeCompare(a.date); });
    var active = jobs.find(function (j) { return L.onBoard(j) && j.status !== 'delivered'; });
    var hist = jobs.filter(function (j) { return j.status === 'delivered'; }).map(function (j) { return { date: j.date, service: j.service, miles: j.mileage, total: L.invoicesOf(j).reduce(function (s, i) { return s + i.total; }, 0), id: j.id }; })
      .concat(v.history.map(function (x) { return { date: x.date, service: x.service, miles: x.mileage, total: x.total, note: x.note, old: true }; })).sort(function (a, b2) { return b2.date.localeCompare(a.date); });
    var next = jobs.find(function (j) { return j.status === 'booked'; });
    var d = L.openDialog({
      drawer: true, title: esc(L.carName(v)), sub: esc(v.plate) + ' · ' + v.year + ' · ' + esc(v.colour),
      body: '<div style="margin-bottom:16px">' + plate(v.plate, 'lg') + '</div>' +
        (active ? '<a class="btn btn-primary btn-block" style="margin-bottom:14px" href="#/job/' + active.id + '">' + icon('wrench') + 'Open today’s job · ' + esc(active.service) + '</a>' : '') +
        (next ? '<div class="notice info">' + icon('calendar') + '<span>Booked in for <a href="#/job/' + next.id + '"><b>' + esc(next.service) + '</b> on ' + L.fmtDay(next.date) + ' at ' + next.time + '</a></span></div>' : '') +
        '<div class="client-box"><div class="who">' + esc(c.company || c.name) + '</div><span>' + esc(c.phone) + (c.email ? ' · ' + esc(c.email) : '') + '</span></div>' +
        '<dl class="dl" style="margin-bottom:18px"><dt>Mileage</dt><dd>' + (v.mileage ? v.mileage.toLocaleString('en-GB') + ' mi' : '—') + '</dd><dt>VIN</dt><dd class="mono">' + esc(v.vin) + '</dd><dt>MOT due</dt><dd>' + L.fmtDate(v.motDue) + '</dd><dt>Service due</dt><dd>' + L.fmtDate(v.serviceDue) + '</dd></dl>' +
        '<h3 style="font-weight:600;font-size:15px;margin-bottom:10px">Service history</h3><ol class="timeline">' + (hist.length ? hist.map(function (x) {
          return '<li><div class="tl-top"><span>' + (x.id ? '<a href="#/job/' + x.id + '">' + esc(x.service) + '</a>' : esc(x.service)) + '</span><span class="mono">' + (x.note === 'No-show' ? 'no-show' : money(x.total)) + '</span></div><div class="tl-sub">' + L.fmtDate(x.date) + ' · ' + (x.miles || 0).toLocaleString('en-GB') + ' mi' + (x.old ? ' · from your old system' : '') + '</div></li>';
        }).join('') : '<li>No visits yet.</li>') + '</ol>',
      foot: '<button type="button" class="btn" data-close>Close</button>' + (c.email ? '<button type="button" class="btn btn-primary" data-send>' + icon('mail') + 'Email service history</button>' : ''),
    });
    var s = d.el.querySelector('[data-send]');
    if (s) s.addEventListener('click', function () {
      S.outbox.unshift({ id: 'm-h-' + Date.now(), kind: 'history', to: c.email, subject: 'Service history for ' + v.plate, at: L.now(), attachment: 'Service history ' + v.plate + '.pdf', status: 'Delivered', plate: v.plate });
      d.close(); L.toast('Service history for ' + esc(v.plate) + ' emailed to ' + esc(c.email));
    });
  };
  // Links inside drawers close the drawer before routing.
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('.scrim a[href^="#/"]'); if (a) { var s = a.closest('.scrim'); var x = s && s.querySelector('[data-close]'); if (x) x.click(); } }, true);

  // ---- Clients -------------------------------------------------------------
  S.cliQ = ''; S.cliQPage = 1;
  V.clients = function () {
    var by = {};
    allBookings().forEach(function (j) {
      var r = by[j.clientId] || (by[j.clientId] = { cars: {}, visits: 0, open: 0, last: '', next: '', any: '' });
      r.cars[j.plate] = 1;
      if (j.status === 'delivered') r.visits++;
      if (['new', 'in_progress', 'waiting_parts', 'ready', 'booked'].indexOf(j.status) >= 0) r.open++;
      if (j.status === 'delivered' && j.date > r.last) r.last = j.date;
      if (j.status === 'booked' && (!r.next || j.date < r.next)) r.next = j.date;
      if (j.date > r.any) r.any = j.date;
    });
    var rows = Object.keys(by).map(function (id) { return { c: S.clients[id], r: by[id] }; }).sort(function (a, b) { return b.r.any.localeCompare(a.r.any); });
    var all = rows.length;
    var q = S.cliQ.trim().toLowerCase();
    if (q) rows = rows.filter(function (x) { return (x.c.name + ' ' + (x.c.company || '') + ' ' + x.c.phone + ' ' + (x.c.email || '')).toLowerCase().indexOf(q) >= 0; });
    var shown = rows.slice(0, 25 * S.cliQPage);
    var h = pageHead('Clients', '<b>' + all + '</b> clients · 2 business accounts on payment terms', searchBox('cli-q', 'Find a client', S.cliQ, 'Name, company, phone or email'));
    h += '<section class="panel big-table" aria-label="Clients"><div class="table-wrap"><table class="table"><thead><tr><th>Client</th><th>Contact</th><th class="r">Cars</th><th class="r">Visits</th><th class="r">Open</th><th>Last visit</th><th>Next booking</th></tr></thead><tbody>' +
      (shown.length ? shown.map(function (x) {
        var c = x.c, r = x.r;
        return '<tr><td><div class="cell-strong">' + esc(c.company || c.name) + '</div><div class="cell-sub">' + (c.company ? esc(c.name) + ' · ' : '') + (c.type === 'business' ? '<span class="tag tag-line" style="height:20px">' + c.termsDays + '-day terms</span>' : 'Private') + '</div><div class="cell-sub sm-only">' + esc(c.phone) + '</div></td>' +
          '<td class="hide-sm"><div>' + esc(c.phone) + '</div><div class="cell-sub">' + esc(c.email || 'No email') + '</div></td><td class="r money hide-sm">' + Object.keys(r.cars).length + '</td><td class="r money hide-sm">' + r.visits + '</td>' +
          '<td class="r hide-sm">' + (r.open ? '<span class="cell-strong">' + r.open + '</span>' : '<span class="cell-sub">0</span>') + '</td><td class="hide-sm"><span class="cell-sub">' + (r.last ? L.fmtDate(r.last) : 'First visit due') + '</span></td><td class="c-end"><span class="cell-sub">' + (r.next ? L.fmtDay(r.next) : r.open ? 'On the board' : '—') + '</span></td></tr>';
      }).join('') : '<tr><td colspan="7" class="panel-note">No client matches “' + esc(S.cliQ) + '”.</td></tr>') + '</tbody></table></div>' +
      (rows.length > shown.length ? '<div class="show-more"><button type="button" class="btn" data-action="cli-more">Show more · ' + (rows.length - shown.length) + ' left</button></div>' : '') + '</section>';
    return h;
  };
  V.clients.after = function () { liveSearch('cli-q', 'cliQ'); };
  L.actions['cli-more'] = function () { S.cliQPage++; L.commit(); };

  // ---- Invoices ------------------------------------------------------------
  S.invFilter = 'all'; S.invPage = 1;
  function invState(i) {
    if (i.paidAt) return { key: 'paid', html: '<span class="paid-txt">Paid</span>' };
    if (i.dueDate && i.dueDate < TODAY) return { key: 'overdue', html: '<span class="tag tag-red">Overdue · ' + L.fmtDay(i.dueDate) + '</span>' };
    if (i.dueDate) return { key: 'unpaid', html: '<span class="tag tag-amber">Due ' + L.fmtDay(i.dueDate) + '</span>' };
    return { key: 'unpaid', html: '<span class="cell-sub">Not paid</span>' };
  }
  V.invoices = function () {
    var all = S.invoices.slice().sort(function (a, b) { return b.number.localeCompare(a.number); });
    var sum = function (l, f) { return l.reduce(function (s, i) { return s + i[f || 'total']; }, 0); };
    var paid = all.filter(function (i) { return i.paidAt; }), unpaid = all.filter(function (i) { return !i.paidAt; }), overdue = unpaid.filter(function (i) { return i.dueDate && i.dueDate < TODAY; });
    var list = S.invFilter === 'paid' ? paid : S.invFilter === 'unpaid' ? unpaid : S.invFilter === 'overdue' ? overdue : all;
    var shown = list.slice(0, 30 * S.invPage);
    var h = pageHead('Invoices', 'Numbered in order from INV-2026-0001 since you moved to Liftbay on 1 October. Issued invoices are never edited.');
    h += '<div class="stat-strip"><div class="stat"><div class="stat-label">' + icon('receipt') + 'Issued in October</div><div class="stat-value">' + all.length + '</div><div class="stat-foot">' + money(sum(all)) + ' incl. VAT</div></div>' +
      '<div class="stat"><div class="stat-label">' + icon('checkCircle') + 'Paid</div><div class="stat-value">' + L.money0(sum(paid)) + '</div><div class="stat-foot">' + L.plural(paid.length, 'invoice') + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + icon('clock') + 'Waiting for payment</div><div class="stat-value">' + L.money0(sum(unpaid)) + '</div><div class="stat-foot">' + L.plural(unpaid.length, 'invoice') + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + icon('alert') + 'Overdue</div><div class="stat-value" style="color:' + (overdue.length ? 'var(--red)' : 'inherit') + '">' + L.money0(sum(overdue)) + '</div><div class="stat-foot">' + (overdue.length ? L.plural(overdue.length, 'invoice') + ' on business terms' : 'Nothing overdue') + '</div></div></div>';
    h += '<div class="list-tools"><div class="chips" role="group" aria-label="Filter invoices">' + [['all', 'All', all.length], ['unpaid', 'Not paid', unpaid.length], ['overdue', 'Overdue', overdue.length], ['paid', 'Paid', paid.length]].map(function (f) {
      return '<button type="button" class="chip" aria-pressed="' + (S.invFilter === f[0]) + '" data-action="inv-filter" data-f="' + f[0] + '">' + f[1] + ' <span class="n">' + f[2] + '</span></button>';
    }).join('') + '</div></div>';
    h += '<section class="panel big-table" aria-label="Invoices"><div class="table-wrap"><table class="table"><thead><tr><th>Invoice</th><th>Client</th><th>Vehicle</th><th class="r">Total</th><th>Emailed</th><th>Paid</th></tr></thead><tbody>' +
      (shown.length ? shown.map(function (i) {
        var c = S.clients[i.clientId], st = invState(i);
        return '<tr class="is-row" data-action="open-invoice" data-inv="' + i.id + '"><td><button type="button" class="link-btn mono" data-action="open-invoice" data-inv="' + i.id + '">' + i.number + '</button><div class="cell-sub">' + L.fmtDate(i.issuedAt) + '</div><div class="sm-only sm-inv">' + esc(c.company || c.name) + ' ' + plate(i.plate, 'sm') + '</div></td>' +
          '<td class="hide-sm">' + esc(c.company || c.name) + '</td><td class="hide-sm">' + plate(i.plate, 'sm') + '</td><td class="r money c-end"><b>' + money(i.total) + '</b><div class="cell-sub">' + money(i.sub) + ' + VAT</div></td>' +
          '<td class="hide-sm">' + (i.sends.length ? '<span class="cell-sub">' + L.fmtDay(i.sends[i.sends.length - 1].at) + ', ' + L.fmtTime(i.sends[i.sends.length - 1].at) + '</span>' : '<span class="cell-sub">Not sent</span>') + '</td><td>' + st.html + '</td></tr>';
      }).join('') : '<tr><td colspan="6" class="panel-note">Nothing here.</td></tr>') + '</tbody></table></div>' +
      (list.length > shown.length ? '<div class="show-more"><button type="button" class="btn" data-action="inv-more">Show more · ' + (list.length - shown.length) + ' left</button></div>' : '') + '</section>';
    return h;
  };
  L.actions['inv-filter'] = function (b) { S.invFilter = b.dataset.f; S.invPage = 1; L.commit(); };
  L.actions['inv-more'] = function () { S.invPage++; L.commit(); };
  L.actions['open-invoice'] = function (b) {
    var i = L.invoice(b.dataset.inv), j = L.job(i.jobId);
    var d = L.openDialog({
      title: esc(i.number), sub: esc(i.plate) + ' · ' + esc(L.cli(j).company || L.cli(j).name) + ' · ' + invState(i).html, cls: 'dialog-doc',
      body: docFor(i, j), foot: '<button type="button" class="btn" data-close>Close</button>' + (L.onBoard(j) || j.status !== 'delivered' ? '<a class="btn" href="#/job/' + j.id + '">' + icon('wrench') + 'Open job</a>' : '') +
        (!i.paidAt ? '<button type="button" class="btn btn-primary" data-paid>' + icon('card') + 'Mark as paid</button>' : '') + '<button type="button" class="btn" data-print>' + icon('printer') + 'Print</button>',
    });
    var p = d.el.querySelector('[data-paid]');
    if (p) p.addEventListener('click', function () { d.close(); i.paidAt = L.now(); i.paidBy = 'Bank transfer'; L.commit(); L.toast(esc(i.number) + ' marked as paid'); });
    d.el.querySelector('[data-print]').addEventListener('click', function () { window.print(); });
  };
  function docFor(i, j) {
    var c = L.cli(j), v = L.veh(j), co = S.company;
    return '<div class="doc"><div class="doc-top"><div><div class="doc-co">' + esc(co.name) + '</div><div class="doc-small">' + co.address.map(esc).join(', ') + '<br>' + esc(co.phone) + ' · ' + esc(co.email) + '<br>VAT ' + esc(co.vatNumber) + '</div></div>' +
      '<div class="doc-title"><b>Invoice</b><span class="mono">' + i.number + '</span>' + (i.paidAt ? '<br><span class="paid-stamp">PAID</span>' : '') + '</div></div>' +
      '<div class="doc-cols"><div><h3>Bill to</h3>' + esc(c.company || c.name) + '<br><span class="doc-small">' + (c.address ? c.address.map(esc).join('<br>') : esc(c.email || c.phone)) + '</span></div>' +
      '<div><h3>Vehicle</h3>' + esc(j.plate) + '<br><span class="doc-small">' + esc(L.carName(v)) + '</span></div><div><h3>Dates</h3><span class="doc-small">Issued ' + L.fmtDate(i.issuedAt) + '<br>' + (i.dueDate ? 'Due ' + L.fmtDate(i.dueDate) : 'Due on collection') + '</span></div></div>' +
      '<table class="table"><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Each</th><th class="r">Amount</th></tr></thead><tbody>' + i.lines.map(function (l) { return '<tr><td>' + esc(l.title) + '</td><td class="r money">' + l.qty + '</td><td class="r money">' + money(l.unit) + '</td><td class="r money">' + money(l.total) + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<div class="doc-totals"><div class="sum-row"><span>Subtotal</span><b>' + money(i.sub) + '</b></div><div class="sum-row"><span>VAT 20%</span><b>' + money(i.vat) + '</b></div><div class="sum-row total"><span>Total</span><b>' + money(i.total) + '</b></div></div>' +
      '<p class="doc-foot">' + esc(co.invoiceFooter) + ' Company no. ' + esc(co.companyNumber) + '.</p></div>';
  }

  // ---- Outbox --------------------------------------------------------------
  S.outSel = null;
  var KIND = { invoice: ['receipt', 'Invoice'], ready: ['car', 'Ready to collect'], booking: ['calendar', 'Booking'], history: ['history', 'Service history'] };
  function emailBody(m) {
    var j = m.jobId ? L.job(m.jobId) : null, c = j ? L.cli(j) : null, name = c ? c.name.split(' ')[0] : 'there';
    var brand = '<div class="email-brand"><span class="tenant-badge" aria-hidden="true">C&amp;P</span>Calder &amp; Price Motors</div>';
    var body;
    if (m.kind === 'invoice') {
      var i = L.invoice(m.invoiceId);
      body = '<h2>Your invoice for ' + esc(i.plate) + '</h2><p>Hi ' + esc(name) + ',</p><p>Thanks for bringing your ' + esc(L.carName(L.veh(j))) + ' to us. Your invoice <b>' + i.number + '</b> for <b>' + money(i.total) + '</b> (including ' + money(i.vat) + ' VAT) is attached.</p>' +
        (j.status === 'ready' ? '<p>Your car is ready to collect. We’re open until 4pm today.</p>' : '') + (i.dueDate && !i.paidAt ? '<p>Payment is due by ' + L.fmtLong(i.dueDate) + '.</p>' : '') +
        '<span class="email-attach">' + icon('file') + m.attachment + '</span>';
    } else if (m.kind === 'ready') {
      body = '<h2>' + esc(j.plate) + ' is ready to collect</h2><p>Hi ' + esc(name) + ',</p><p>Good news: the work on your ' + esc(L.carName(L.veh(j))) + ' is finished and it’s ready for you. Come in any time before 4pm; we’ll go through what we did when you pick it up.</p>';
    } else if (m.kind === 'booking') {
      body = '<h2>You’re booked in</h2><p>Hi ' + esc(name) + ',</p><p>Thanks for booking with us. Here are the details:</p><p><b>' + esc(j.plate) + '</b> · ' + esc(j.service) + '<br>' + L.fmtLong(j.date) + (j.time ? ' at ' + j.time : '') + '</p><p>Drop the car at Unit 3, Fellgate Yard. If anything changes, just reply to this email or ring us on 01632 960418.</p>';
    } else {
      body = '<h2>Service history for ' + esc(m.plate) + '</h2><p>Hi,</p><p>As promised, the full service history we hold for this vehicle is attached.</p><span class="email-attach">' + icon('file') + esc(m.attachment) + '</span>';
    }
    return '<div class="email-card">' + brand + body + '<p class="email-foot">Calder &amp; Price Motors · Unit 3, Fellgate Yard, Kendal LA9 6QZ · 01632 960418<br>Sent with Liftbay</p></div>';
  }
  V.outbox = function () {
    var list = S.outbox.slice(0, 40);
    if (!S.outSel || !S.outbox.some(function (m) { return m.id === S.outSel; })) S.outSel = list[0] && list[0].id;
    var sel = S.outbox.find(function (m) { return m.id === S.outSel; });
    var h = pageHead('Outbox', 'Every email Liftbay has sent for you: invoices, booking confirmations and “ready to collect” messages.');
    h += '<div class="outbox"><section class="panel mail-list" aria-label="Sent emails"><ul>' + list.map(function (m) {
      var k = KIND[m.kind] || KIND.booking;
      return '<li><button type="button" class="mail-item" data-action="out-sel" data-m="' + m.id + '" aria-current="' + (m.id === S.outSel) + '"><span class="mail-ico ' + m.kind + '">' + icon(k[0]) + '</span>' +
        '<span class="mail-subj">' + esc(m.subject) + '</span><span class="mail-when">' + L.fmtWhen(m.at) + '</span><span class="mail-to">' + esc(m.to) + (m.attachment ? ' · ' + icon('file').replace('<svg', '<svg style="display:inline;width:13px;height:13px;vertical-align:-2px"') + ' ' + esc(m.attachment) : '') + '</span><span class="mail-status">' + m.status + '</span></button></li>';
    }).join('') + '</ul></section>';
    h += '<section class="mail-preview" aria-label="Email preview">' + (sel ? '<div class="email"><dl class="email-meta"><dt>To</dt><dd>' + esc(sel.to) + '</dd><dt>Subject</dt><dd><b>' + esc(sel.subject) + '</b></dd><dt>Sent</dt><dd>' + L.fmtWhen(sel.at) + ' · ' + sel.status + '</dd></dl><div class="email-body">' + emailBody(sel) + '</div></div>' : '<p class="panel-note">Nothing sent yet.</p>') + '</section></div>';
    return h;
  };
  L.actions['out-sel'] = function (b) {
    S.outSel = b.dataset.m; L.commit();
    var again = document.querySelector('[data-m="' + S.outSel + '"]'); if (again) again.focus({ preventScroll: true });
    if (window.innerWidth <= 1180) { var p = document.querySelector('.mail-preview'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };

  // ---- Reports -------------------------------------------------------------
  function reportData() {
    var oct = S.invoices.filter(function (i) { return i.issuedAt.slice(0, 7) === '2026-10'; });
    var weekStart = U.addDays(TODAY, -((U.dow(TODAY) + 6) % 7));
    var lastWeekStart = U.addDays(weekStart, -7);
    var sum = function (l, f) { return l.reduce(function (s, i) { return s + i[f]; }, 0); };
    var week = oct.filter(function (i) { return i.issuedAt.slice(0, 10) >= weekStart; });
    var lastWeekSamePoint = oct.filter(function (i) { var d = i.issuedAt.slice(0, 10); return d >= lastWeekStart && d <= U.addDays(TODAY, -7); });
    var bookings = allBookings();
    var octJobs = bookings.filter(function (j) { return j.date.slice(0, 7) === '2026-10'; });
    var open = S.upcoming.length + S.jobs.filter(function (j) { return ['new', 'in_progress', 'waiting_parts', 'ready'].indexOf(j.status) >= 0; }).length;
    var days = [];
    for (var d = '2026-10-01'; d <= TODAY; d = U.addDays(d, 1)) { var w = U.dow(d); if (w > 0 && w < 6) days.push({ d: d, v: sum(oct.filter(function (i) { return i.issuedAt.slice(0, 10) === d; }), 'sub') }); }
    var bySvc = {};
    S.history.concat(S.jobs).forEach(function (j) {
      if (j.status !== 'delivered' && !j.invoiceIds.length) return;
      if (j.date.slice(0, 7) !== '2026-10' && (j.deliveredAt || '').slice(0, 7) !== '2026-10') return;
      var r = bySvc[j.service] || (bySvc[j.service] = { n: 0, v: 0 });
      r.n++; r.v += L.invoicesOf(j).reduce(function (s, i) { return s + i.sub; }, 0);
    });
    var services = Object.keys(bySvc).map(function (k) { return { name: k, n: bySvc[k].n, v: bySvc[k].v }; }).sort(function (a, b) { return b.n - a.n || b.v - a.v; }).slice(0, 5);
    var mech = S.team.filter(function (t) { return t.mechanic; }).map(function (t) {
      var js = S.history.concat(S.jobs).filter(function (j) { return j.mechanic === t.id && j.date.slice(0, 7) === '2026-10'; });
      var fin = js.filter(function (j) { return j.status === 'delivered' || j.status === 'ready'; });
      var hrs = js.reduce(function (s, j) { return s + (j.rampHours || (j.status === 'delivered' || j.status === 'ready' ? j.estHours : 0)); }, 0);
      return { name: t.name, id: t.id, n: js.length, fin: fin.length, hrs: Math.round(hrs) };
    });
    var ramps = [1, 2, 3].map(function (r) {
      var js = S.history.filter(function (j) { return j.ramp === r && j.status === 'delivered'; });
      var hrs = js.reduce(function (s, j) { return s + (j.rampHours || j.estHours); }, 0);
      return { r: r, n: js.length, hrs: Math.round(hrs), avail: (days.length - 1) * D.company.hoursPerDay };
    });
    return {
      oct: oct, revenue: sum(oct, 'sub'), vat: sum(oct, 'vat'), week: sum(week, 'sub'), lastWeek: sum(lastWeekSamePoint, 'sub'), open: open,
      bookingsMonth: octJobs.length, avg: oct.length ? sum(oct, 'sub') / oct.length : 0, noShows: octJobs.filter(function (j) { return j.status === 'no_show'; }).length,
      cancels: octJobs.filter(function (j) { return j.status === 'cancelled'; }).length, days: days, services: services, mech: mech, ramps: ramps,
    };
  }

  function spark(days) {
    var w = 220, h = 34, max = Math.max.apply(null, days.map(function (d) { return d.v; }));
    var pts = days.map(function (d, i) { return (i / (days.length - 1) * w).toFixed(1) + ',' + (h - d.v / max * (h - 4) - 2).toFixed(1); }).join(' ');
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="34" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts + '" fill="none" stroke="#0F6E66" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  }

  function dayChart(days) {
    var narrow = window.innerWidth <= 760;
    var W = narrow ? 330 : 900, H = narrow ? 210 : 260, pl = narrow ? 40 : 46, pr = narrow ? 4 : 10, pt = 14, pb = 34;
    var max = Math.ceil(Math.max.apply(null, days.map(function (d) { return d.v; })) / 500) * 500;
    var full = days.filter(function (d) { return d.d !== TODAY; });
    var avg = full.reduce(function (s, d) { return s + d.v; }, 0) / full.length;
    var bw = (W - pl - pr) / days.length, gap = Math.max(4, bw * 0.28);
    var y = function (v) { return pt + (H - pt - pb) * (1 - v / max); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="rev-h rev-desc"><desc id="rev-desc">Revenue ex VAT for each working day in October, from ' + L.money0(Math.min.apply(null, full.map(function (d) { return d.v; }))) + ' to ' + L.money0(Math.max.apply(null, full.map(function (d) { return d.v; }))) + '. Average ' + L.money0(avg) + ' a day.</desc>';
    for (var g = 0; g <= max; g += max / 4) s += '<line class="grid-line" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(g) + '" y2="' + y(g) + '"/><text class="axis-txt" x="' + (pl - 8) + '" y="' + (y(g) + 3.5) + '" text-anchor="end">' + (g ? '£' + (g / 1000).toFixed(g % 1000 ? 1 : 0) + 'k' : '£0') + '</text>';
    days.forEach(function (d, i) {
      var x = pl + i * bw + gap / 2, bh = Math.max(2, H - pb - y(d.v)), isToday = d.d === TODAY;
      var label = L.fmtDay(d.d) + ': ' + money(d.v) + (isToday ? ' so far' : '');
      s += '<rect class="hit" x="' + (pl + i * bw) + '" y="' + pt + '" width="' + bw + '" height="' + (H - pt - pb) + '" tabindex="0" data-tip="' + esc(label) + '"><title>' + esc(label) + '</title></rect>';
      s += '<path class="bar' + (isToday ? ' is-hi' : '') + '" d="M' + x + ',' + (H - pb) + 'v-' + (bh - 4) + 'q0,-4 4,-4h' + (bw - gap - 8) + 'q4,0 4,4v' + (bh - 4) + 'z"/>';
      var dn = Number(d.d.slice(8));
      if ((narrow ? i % 5 === 0 : i % 2 === 0) || isToday) s += '<text class="axis-txt" x="' + (x + (bw - gap) / 2) + '" y="' + (H - pb + 16) + '" text-anchor="middle">' + dn + '</text>';
    });
    s += '<line class="avg-line" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(avg) + '" y2="' + y(avg) + '"/>';
    return { svg: s + '</svg>', avg: avg };
  }

  function hbars(rows, valueKey, fmt, labelW, label) {
    var narrow = window.innerWidth <= 760;
    var W = narrow ? 320 : 520, rowH = 38, pl = narrow ? Math.min(labelW || 150, 128) : labelW || 150, pr = 64, H = rows.length * rowH;
    var max = Math.max.apply(null, rows.map(function (r) { return r[valueKey]; }));
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label + ': ' + rows.map(function (r) { return r.name + ' ' + fmt(r[valueKey]); }).join(', ')) + '">';
    rows.forEach(function (r, i) {
      var y = i * rowH, bw = Math.max(4, (W - pl - pr) * r[valueKey] / max);
      var tip = r.tip || (r.name + ': ' + fmt(r[valueKey]));
      s += '<text class="lbl-txt" x="0" y="' + (y + 22) + '">' + esc(r.name) + '</text>';
      s += '<rect class="hit" x="' + pl + '" y="' + (y + 4) + '" width="' + (W - pl) + '" height="' + (rowH - 8) + '" tabindex="0" data-tip="' + esc(tip) + '"><title>' + esc(tip) + '</title></rect>';
      s += '<path class="bar" d="M' + pl + ',' + (y + 9) + 'h' + (bw - 4) + 'q4,0 4,4v' + (rowH - 26) + 'q0,4 -4,4h-' + (bw - 4) + 'z"/>';
      s += '<text class="val-txt" x="' + (pl + bw + 8) + '" y="' + (y + 22) + '">' + fmt(r[valueKey]) + '</text>';
    });
    return s + '</svg>';
  }

  S.repTables = {};
  function chartPanel(id, title, sub, chart, table, foot, wide) {
    var showT = S.repTables[id];
    return '<section class="panel chart' + (wide ? ' chart-wide' : '') + '" aria-labelledby="' + id + '-h"><div class="panel-head"><div><h2 id="' + id + '-h">' + title + '</h2><p class="panel-note">' + sub + '</p></div>' +
      '<div class="aside"><button type="button" class="btn btn-sm btn-ghost" data-action="rep-table" data-t="' + id + '" aria-pressed="' + !!showT + '">' + (showT ? 'Show chart' : 'Show as table') + '</button></div></div>' +
      (showT ? '<div class="table-wrap data-table">' + table + '</div>' : chart) + (foot ? '<div class="chart-foot">' + foot + '</div>' : '') + '</section>';
  }

  V.reports = function () {
    var R = reportData();
    var dc = dayChart(R.days);
    var weekDelta = R.lastWeek ? Math.round((R.week - R.lastWeek) / R.lastWeek * 100) : 0;
    var h = pageHead('Reports', 'October 2026 so far · ' + R.days.length + ' working days · figures ex VAT unless shown',
      '<div class="seg" role="group" aria-label="Period"><button type="button" aria-pressed="true">This month</button><button type="button" aria-pressed="false" data-action="rep-period">Last month</button></div>');
    h += '<div class="kpis">' +
      '<div class="stat kpi-hero dk"><div class="stat-label">' + icon('pound') + 'Revenue this month</div><div class="stat-value">' + money(R.revenue) + '</div><div class="stat-foot">+ ' + money(R.vat) + ' VAT</div>' + spark(R.days) + '</div>' +
      '<div class="stat"><div class="stat-label">' + icon('calendar') + 'Revenue this week</div><div class="stat-value">' + L.money0(R.week) + '</div><div class="stat-foot"><span class="' + (weekDelta >= 0 ? 'up' : '') + '">' + (weekDelta >= 0 ? '+' : '') + weekDelta + '%</span> on the same point last week</div></div>' +
      '<div class="stat"><div class="stat-label">' + icon('receipt') + 'Average invoice</div><div class="stat-value">' + money(R.avg) + '</div><div class="stat-foot">Across ' + R.oct.length + ' invoices</div></div>' +
      '<div class="stat"><div class="stat-label">' + icon('file') + 'Invoices issued</div><div class="stat-value">' + R.oct.length + '</div><div class="stat-foot">INV-2026-0001 to ' + R.oct[R.oct.length - 1].number.slice(-4) + '</div></div>' +
      '<div class="stat"><div class="stat-label">' + icon('calendar') + 'Bookings this month</div><div class="stat-value">' + R.bookingsMonth + '</div><div class="stat-foot">Including today and tomorrow</div></div>' +
      '<div class="stat"><div class="stat-label">' + icon('clock') + 'Open bookings</div><div class="stat-value">' + R.open + '</div><div class="stat-foot">On the board or booked ahead</div></div>' +
      '<div class="stat"><div class="stat-label">' + icon('user') + 'No-shows</div><div class="stat-value">' + R.noShows + '</div><div class="stat-foot">' + (R.noShows / R.bookingsMonth * 100).toFixed(1) + '% of bookings</div></div>' +
      '<div class="stat"><div class="stat-label">' + icon('x') + 'Cancellations</div><div class="stat-value">' + R.cancels + '</div><div class="stat-foot">All with more than a day’s notice</div></div></div>';
    h += '<div class="charts">';
    h += chartPanel('rev', 'Revenue by day', 'Invoiced each working day in October, ex VAT', dc.svg,
      '<table class="table"><thead><tr><th>Day</th><th class="r">Revenue ex VAT</th></tr></thead><tbody>' + R.days.map(function (d) { return '<tr><td>' + L.fmtDay(d.d) + '</td><td class="r money">' + money(d.v) + '</td></tr>'; }).join('') + '</tbody></table>',
      '<div class="legend"><span><i></i>Invoiced</span><span><i class="hi"></i>Today so far</span><span><i class="avg"></i>Daily average ' + L.money0(dc.avg) + '</span></div><span>Best day: ' + L.fmtDay(R.days.slice().sort(function (a, b) { return b.v - a.v; })[0].d) + '</span>', true);
    h += chartPanel('svc', 'Top 5 services', 'Finished jobs this month', hbars(R.services.map(function (s) { return { name: s.name, n: s.n, tip: s.name + ': ' + s.n + ' jobs, ' + L.money0(s.v) }; }), 'n', function (v) { return v + ' jobs'; }, null, 'Top 5 services this month'),
      '<table class="table"><thead><tr><th>Service</th><th class="r">Jobs</th><th class="r">Revenue</th></tr></thead><tbody>' + R.services.map(function (s) { return '<tr><td>' + esc(s.name) + '</td><td class="r money">' + s.n + '</td><td class="r money">' + money(s.v) + '</td></tr>'; }).join('') + '</tbody></table>',
      'Revenue from these five: ' + L.money0(R.services.reduce(function (s, x) { return s + x.v; }, 0)));
    h += chartPanel('mech', 'Jobs per mechanic', 'Jobs started this month', hbars(R.mech.map(function (m) { return { name: m.name, n: m.n, tip: m.name + ': ' + m.n + ' jobs, ' + m.fin + ' finished, ' + m.hrs + ' ramp hours' }; }), 'n', function (v) { return v + ' jobs'; }, 120, 'Jobs per mechanic this month'),
      '<table class="table"><thead><tr><th>Mechanic</th><th class="r">Jobs</th><th class="r">Finished</th><th class="r">Ramp hours</th></tr></thead><tbody>' + R.mech.map(function (m) { return '<tr><td>' + esc(m.name) + '</td><td class="r money">' + m.n + '</td><td class="r money">' + m.fin + '</td><td class="r money">' + m.hrs + '</td></tr>'; }).join('') + '</tbody></table>',
      R.mech.map(function (m) { return esc(m.name.split(' ')[0]) + ' ' + m.fin + ' finished'; }).join(' · '));
    h += '<section class="panel chart chart-wide" aria-labelledby="ramps-h"><div class="panel-head"><div><h2 id="ramps-h">Ramp hours used</h2><p class="panel-note">Hours with a car on each ramp, against ' + R.ramps[0].avail + ' open hours this month (to yesterday)</p></div></div>' +
      R.ramps.map(function (r) { var pct = Math.round(r.hrs / r.avail * 100); return '<div class="meter"><div class="meter-top"><b>Ramp ' + r.r + '</b><span>' + r.hrs + ' h of ' + r.avail + ' h · ' + pct + '% · ' + r.n + ' jobs</span></div><div class="meter-bar" role="img" aria-label="Ramp ' + r.r + ': ' + pct + '% used"><i style="width:' + pct + '%"></i></div></div>'; }).join('') +
      '<p class="meter-sub">Quieter ramps leave room for walk-ins and fit-ins. Long jobs (clutches, cam belts) go on Ramp 3 when it’s free.</p></section>';
    h += '</div>';
    return h;
  };
  V.reports.after = function () {
    var tip = null;
    function show(e) {
      var t = e.target.closest && e.target.closest('[data-tip]'); if (!t) return;
      if (!tip) { tip = document.createElement('div'); tip.className = 'chart-tip'; tip.setAttribute('aria-hidden', 'true'); document.body.appendChild(tip); }
      tip.textContent = t.dataset.tip;
      var r = t.getBoundingClientRect();
      tip.style.left = (e.type === 'focusin' ? r.left + r.width / 2 : e.clientX) + 'px';
      tip.style.top = (e.type === 'focusin' ? r.top + 10 : e.clientY) + 'px';
    }
    function hide() { if (tip) { tip.remove(); tip = null; } }
    var m = document.getElementById('main');
    m.querySelectorAll('.chart svg').forEach(function (s) {
      s.addEventListener('mousemove', show); s.addEventListener('mouseleave', hide);
      s.addEventListener('focusin', show); s.addEventListener('focusout', hide);
    });
    window.addEventListener('hashchange', hide, { once: true });
  };
  var wasNarrow = window.innerWidth <= 760;
  window.addEventListener('resize', function () {
    var n = window.innerWidth <= 760;
    if (n !== wasNarrow) { wasNarrow = n; if (L.route().name === 'reports') L.commit(); }
  });
  L.actions['rep-table'] = function (b) { S.repTables[b.dataset.t] = !S.repTables[b.dataset.t]; L.commit(); };
  L.actions['rep-period'] = function () { L.toast('September is in your previous system. Liftbay reports start from 1 October.'); };

  // ---- Settings ------------------------------------------------------------
  S.setTab = 'company';
  var AREAS = ['Board', 'Bookings', 'Calendar', 'Walk-ins', 'Job cards', 'Work items', 'Prices', 'Parts', 'Workshop notes', 'Office notes', 'Photos', 'Invoices', 'Payments & collection', 'Vehicles', 'Clients', 'Outbox', 'Reports', 'Team', 'Settings'];
  var ROLES = ['Owner', 'Manager', 'Receptionist', 'Mechanic'];
  S.perms = S.perms || AREAS.map(function (a) {
    var mech = ({ Board: 'Edit', 'Job cards': 'Edit', 'Work items': 'Edit', Parts: 'Edit', 'Workshop notes': 'Edit', Photos: 'Edit', Calendar: 'View', Vehicles: 'View' })[a] || 'None';
    var rec = ({ Settings: 'None', Team: 'None', Reports: 'View', Prices: 'View', 'Work items': 'View', Parts: 'View', 'Workshop notes': 'View', Photos: 'View' })[a] || 'Edit';
    var man = a === 'Settings' || a === 'Team' ? 'View' : 'Edit';
    return { area: a, Owner: 'Edit', Manager: man, Receptionist: rec, Mechanic: mech };
  });
  function field(label, name, value, opts) {
    opts = opts || {};
    return '<label class="field' + (opts.full ? ' full' : '') + '"><span>' + label + '</span>' + (opts.money ? '<span class="input-money">' : '') + '<input class="input" name="' + name + '" value="' + esc(value) + '"' + (opts.type ? ' type="' + opts.type + '"' : '') + '>' + (opts.money ? '</span>' : '') + '</label>';
  }
  V.settings = function () {
    var co = S.company;
    var tabs = [['company', 'Company & invoicing'], ['workshop', 'Workshop & bookings'], ['services', 'Services'], ['team', 'Team'], ['roles', 'Roles & permissions']];
    var h = pageHead('Settings', 'Changes apply to everyone at Calder &amp; Price straight away.');
    h += '<div class="settings"><div class="tabs-v" role="tablist" aria-label="Settings sections" aria-orientation="vertical">' + tabs.map(function (t) {
      return '<button type="button" role="tab" id="st-' + t[0] + '" aria-controls="sp-' + t[0] + '" aria-selected="' + (S.setTab === t[0]) + '" data-action="set-tab" data-t="' + t[0] + '"' + (S.setTab === t[0] ? '' : ' tabindex="-1"') + '>' + t[1] + '</button>';
    }).join('') + '</div><section class="panel" role="tabpanel" id="sp-' + S.setTab + '" aria-labelledby="st-' + S.setTab + '">';
    if (S.setTab === 'company') {
      h += '<div class="panel-head"><h2>Company & invoicing</h2></div><form data-form="settings"><div class="form-grid">' +
        field('Trading name', 'name', co.name) + field('Company number', 'cn', co.companyNumber) + field('Address', 'addr', co.address.join(', '), { full: true }) +
        field('Phone', 'phone', co.phone, { type: 'tel' }) + field('Email', 'email', co.email, { type: 'email' }) + field('VAT number', 'vat', co.vatNumber) +
        '<label class="field"><span>Default parts markup</span><select class="select" name="markup">' + [15, 20, 25, 30].map(function (m) { return '<option' + (m === co.defaultMarkup ? ' selected' : '') + '>' + m + '%</option>'; }).join('') + '</select></label>' +
        field('Next invoice number', 'next', 'INV-2026-' + String(S.nextInv).padStart(4, '0')) + field('VAT rate', 'vatrate', co.vatRate + '%') +
        '<label class="field full"><span>Invoice footer</span><textarea class="textarea" name="footer">' + esc(co.invoiceFooter) + '</textarea></label></div>' +
        '<div class="form-actions"><button type="reset" class="btn">Undo changes</button><button type="submit" class="btn btn-primary">Save changes</button></div></form>';
    } else if (S.setTab === 'workshop') {
      h += '<div class="panel-head"><h2>Workshop & bookings</h2></div><form data-form="settings"><div class="hours-grid" style="margin-bottom:20px">' +
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(function (d, i) {
          var open = i < 5;
          return '<b>' + d + '</b><label class="field"><span class="sr-only">' + d + ' opens</span><input class="input" type="time" value="08:00"' + (open ? '' : ' disabled') + '></label><label class="field"><span class="sr-only">' + d + ' closes</span><input class="input" type="time" value="16:00"' + (open ? '' : ' disabled') + '></label>' +
            '<label class="switch h-closed"><input type="checkbox"' + (open ? ' checked' : '') + '><span class="track"></span><span>' + (open ? 'Open' : 'Closed') + '</span></label>';
        }).join('') + '</div><div class="form-grid">' +
        '<label class="field"><span>Ramps</span><input class="input" type="number" min="1" max="10" value="' + co.ramps + '"></label>' +
        '<label class="field"><span>Book up to <small>(days ahead)</small></span><input class="input" type="number" min="1" value="' + co.bookAhead + '"></label>' +
        '<label class="switch full"><input type="checkbox"' + (co.onlineBookings ? ' checked' : '') + '><span class="track"></span><span>Take bookings online</span></label>' +
        '<label class="switch full"><input type="checkbox" checked><span class="track"></span><span>Email clients when their car is ready</span></label></div>' +
        '<div class="form-actions"><button type="reset" class="btn">Undo changes</button><button type="submit" class="btn btn-primary">Save changes</button></div></form>';
    } else if (S.setTab === 'services') {
      h += '<div class="panel-head"><h2>Services</h2><span class="panel-note">What clients can book, and how long each takes on a ramp</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Service</th><th class="r">Ramp time</th><th class="r">Labour from</th><th>Online</th></tr></thead><tbody>' +
        D.services.map(function (s, i) { return '<tr><td class="cell-strong">' + esc(s.name) + '</td><td class="r money">' + L.hoursTxt(s.hours) + '</td><td class="r money">' + money(s.from) + '</td><td><label class="switch"><input type="checkbox"' + (i !== 4 ? ' checked' : '') + '><span class="track"></span><span class="sr-only">Bookable online: ' + esc(s.name) + '</span></label></td></tr>'; }).join('') + '</tbody></table></div>';
    } else if (S.setTab === 'team') {
      h += '<div class="panel-head"><h2>Team</h2><div class="aside"><button type="button" class="btn btn-sm" data-action="invite">' + icon('plus') + 'Invite someone</button></div></div>' +
        S.team.map(function (t) { return '<div class="team-row">' + L.avatar(t.id, 'avatar-lg') + '<div><div class="who">' + esc(t.name) + '</div><div class="sub">' + esc(t.email) + ' · ' + esc(t.phone) + '</div></div><span class="tag ' + (t.role === 'Owner' ? 'tag-ink' : 'tag-line') + '">' + t.role + '</span></div>'; }).join('');
    } else {
      h += '<div class="panel-head"><h2>Roles & permissions</h2><span class="panel-note">' + AREAS.length + ' areas · None, View or Edit</span></div><div class="table-wrap perm-wrap"><table class="table perm"><thead><tr><th>Area</th>' + ROLES.map(function (r) { return '<th>' + r + '</th>'; }).join('') + '</tr></thead><tbody>' +
        S.perms.map(function (p, i) { return '<tr><td>' + esc(p.area) + '</td>' + ROLES.map(function (r) { return '<td><label class="sr-only" for="pm-' + i + '-' + r + '">' + r + ': ' + esc(p.area) + '</label><select class="select" id="pm-' + i + '-' + r + '" data-perm="' + i + '" data-role="' + r + '"' + (r === 'Owner' ? ' disabled' : '') + '>' + ['None', 'View', 'Edit'].map(function (o) { return '<option' + (p[r] === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    }
    h += '</section></div>';
    return h;
  };
  V.settings.after = function () {
    document.querySelectorAll('[data-perm]').forEach(function (s) { s.addEventListener('change', function () { S.perms[s.dataset.perm][s.dataset.role] = s.value; L.toast(esc(s.dataset.role) + ' can now ' + (s.value === 'None' ? 'not see ' : s.value === 'View' ? 'view ' : 'edit ') + esc(S.perms[s.dataset.perm].area)); }); });
    document.querySelectorAll('.switch input').forEach(function (c) { c.addEventListener('change', function () { var t = c.parentNode.querySelector('span:last-child'); if (t && /^(Open|Closed)$/.test(t.textContent)) t.textContent = c.checked ? 'Open' : 'Closed'; }); });
    var tl = document.querySelector('.tabs-v');
    if (tl) tl.addEventListener('keydown', function (e) {
      var b = Array.prototype.slice.call(tl.querySelectorAll('[role="tab"]')), i = b.indexOf(document.activeElement);
      if (i < 0) return;
      var n = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? i - 1 : null;
      if (n == null) return;
      e.preventDefault(); n = (n + b.length) % b.length; b[n].click();
    });
  };
  L.actions['set-tab'] = function (b) { S.setTab = b.dataset.t; L.commit(); var t = document.getElementById('st-' + S.setTab); if (t) t.focus(); };
  L.actions['invite'] = function () { L.toast('Invites are switched off in this demo.'); };
  L.forms.settings = function () { L.toast('Settings saved'); };
})();
