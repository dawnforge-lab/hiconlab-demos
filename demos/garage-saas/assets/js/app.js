/*
 * Liftbay demo: in-memory store, router, board, job page, dialogs and drag.
 * Other screens (calendar, lists, reports, settings) live in screens.js.
 */
(function () {
  'use strict';

  var D = window.LB_DATA;
  var U = D.util;
  var TODAY = D.TODAY;

  // ---- Store ---------------------------------------------------------------
  var S = {
    jobs: D.jobs, history: D.history, upcoming: D.upcoming, invoices: D.invoices, outbox: D.outbox,
    clients: D.clients, vehicles: D.vehicles, team: D.team, company: D.company,
    nextInv: D.nextInvoiceNo,
    flash: null, rampFlash: null,
    mobileCol: 'new', query: '',
    priceEdit: null, addLine: false, addPart: false,
  };
  try { var savedCol = localStorage.getItem('liftbay.board.col'); if (savedCol) S.mobileCol = savedCol; } catch (e) { /* storage blocked */ }

  var COLS = [
    { id: 'new', label: 'Arriving today', short: 'Arriving', color: 'var(--steel)' },
    { id: 'in_progress', label: 'In progress', short: 'In progress', color: 'var(--cobalt)' },
    { id: 'waiting_parts', label: 'Waiting parts', short: 'Waiting', color: 'var(--plum)' },
    { id: 'ready', label: 'Ready', short: 'Ready', color: 'var(--green)' },
    { id: 'delivered', label: 'Delivered', short: 'Delivered', color: 'var(--stone)' },
  ];
  function colLabel(id) { var c = COLS.find(function (x) { return x.id === id; }); return c ? c.label : id; }

  // ---- Small helpers -------------------------------------------------------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return '£' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function money0(n) { return '£' + Math.round(n || 0).toLocaleString('en-GB'); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function dateOf(s) { return new Date(s.slice(0, 10) + 'T12:00:00'); }
  function fmtDate(s) { var d = dateOf(s); return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear(); }
  function fmtDay(s) { var d = dateOf(s); return DAYS[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3); }
  function fmtLong(s) { var d = dateOf(s); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function fmtTime(s) { return s ? s.slice(11, 16) : ''; }
  function fmtWhen(s) { if (!s) return ''; return (s.slice(0, 10) === TODAY ? 'Today' : fmtDay(s)) + ', ' + fmtTime(s); }
  function halves(h) { var w = Math.floor(h), f = h - w; return f ? (w ? w : '') + '½' : String(w); }
  function hoursTxt(h) { return halves(h) + '\u00a0h'; }
  function durTxt(min) { min = Math.max(0, Math.round(min)); var h = Math.floor(min / 60), m = min % 60; return h ? h + '\u00a0h ' + U.pad(m) + '\u00a0min' : m + '\u00a0min'; }
  function initials(name) { var p = name.trim().split(/\s+/); return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); }
  function firstName(name) { return name.split(' ')[0]; }

  // Demo clock: Thursday 29 October 2026 from 10:41, running in real time.
  // In the recorded tour it runs ten times faster so times visibly move on.
  var t0 = Date.now();
  var rate = window.HiconTour && HiconTour.active ? 10 : 1;
  window.addEventListener('tour:start', function () { t0 = Date.now(); });
  function nowMin() { return D.CLOCK_START + Math.floor((Date.now() - t0) * rate / 60000); }
  // Only move focus around for people using the keyboard.
  var kbd = false;
  document.addEventListener('keydown', function (e) { if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ' || e.key.indexOf('Arrow') === 0) kbd = true; }, true);
  document.addEventListener('pointerdown', function () { kbd = false; }, true);
  function now() { return TODAY + 'T' + U.hm(nowMin()); }
  function minOf(iso) { if (!iso) return 0; var day = (dateOf(iso) - dateOf(TODAY)) / 864e5; return day * 1440 + Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16)); }

  // ---- Icons (one set, 24px grid, 1.75 stroke) ------------------------------
  var P = {
    board: '<rect x="3.5" y="4" width="4.5" height="16" rx="1.4"/><rect x="9.75" y="4" width="4.5" height="11" rx="1.4"/><rect x="16" y="4" width="4.5" height="7" rx="1.4"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    car: '<path d="M3.5 16.5v-4.4l1.9-5a1.6 1.6 0 0 1 1.5-1.1h10.2a1.6 1.6 0 0 1 1.5 1.1l1.9 5v4.4z"/><path d="M3.5 12h17M6 16.5V19M18 16.5V19"/><path d="M7 14.3h1.5M15.5 14.3H17"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c.6-3.4 3.1-5.4 6.2-5.4s5.6 2 6.2 5.4"/><path d="M15.5 4.9a3.3 3.3 0 0 1 0 6.3M17.6 14.9c1.9.7 3.2 2.4 3.6 5.1"/>',
    receipt: '<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
    send: '<path d="M20.5 3.5 10.5 13.5"/><path d="M20.5 3.5 14.2 20.5l-3.7-7-7-3.7z"/>',
    chart: '<path d="M4 4v16h16"/><path d="M8.5 16v-4M12.5 16V8.5M16.5 16v-6"/>',
    settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.3 2.6 2.6 4.9-5.4"/>',
    wrench: '<path d="M15.2 4.2a4.6 4.6 0 0 0-5.5 6.1l-5.6 5.6a2 2 0 0 0 2.8 2.8l5.6-5.6a4.6 4.6 0 0 0 6.1-5.5l-2.8 2.8-2.9-.7-.7-2.9z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    alert: '<path d="M10.3 4.6 2.9 17.5A2 2 0 0 0 4.6 20.5h14.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4.2M12 16.8v.2"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    more: '<circle cx="5.5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18.5" cy="12" r="1.2"/>',
    chevLeft: '<path d="m14.5 6-6 6 6 6"/>',
    chevRight: '<path d="m9.5 6 6 6-6 6"/>',
    chevDown: '<path d="m6 9.5 6 6 6-6"/>',
    move: '<path d="M4 8h13M14 4.5 17.5 8 14 11.5M20 16H7M10 12.5 6.5 16l3.5 3.5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    box: '<path d="M12 3.2 4 7.2v9.6l8 4 8-4V7.2z"/><path d="m4 7.2 8 4 8-4M12 11.2v9.6"/>',
    note: '<path d="M5 4h14v10.5L13.5 20H5z"/><path d="M13.5 20v-5.5H19M8.5 9h7M8.5 12.5h3.5"/>',
    phone: '<path d="M5.2 4h3.2l1.6 4.1-2.1 1.3a10.5 10.5 0 0 0 6.7 6.7l1.3-2.1 4.1 1.6v3.2a1.6 1.6 0 0 1-1.7 1.6A15.6 15.6 0 0 1 3.6 5.7 1.6 1.6 0 0 1 5.2 4z"/>',
    building: '<path d="M4 20.5V5.6L13 3v17.5M13 9l7 2v9.5M2.5 20.5h19M7.5 8h2M7.5 12h2M7.5 16h2M16 14h1.5M16 17.5h1.5"/>',
    printer: '<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12.5h6M9 16h6"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.2M12 7.8v.2"/>',
    lift: '<path d="M5.5 3v18M18.5 3v18M3 21h5M16 21h5"/><rect x="3" y="11" width="18" height="3" rx="1"/>',
    pause: '<rect x="6.5" y="5" width="3.6" height="14" rx="1"/><rect x="13.9" y="5" width="3.6" height="14" rx="1"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/>',
    bank: '<path d="M3 9.5 12 4l9 5.5M5 10.5v7.5M9.5 10.5v7.5M14.5 10.5v7.5M19 10.5v7.5M3 20.5h18"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.7-3.7 3.5-5.7 7-5.7s6.3 2 7 5.7"/>',
    handover: '<path d="M7.5 13.5h3.2a1.8 1.8 0 0 1 0 3.5H8"/><path d="M3 12h2.5l5-1.5h2.2M3 19.5h3.5l6.5 1 8-4.5a1.7 1.7 0 0 0-2-2.7l-4.8 2.3"/><circle cx="17" cy="6.5" r="3"/>',
    history: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.6"/><path d="M4 4v4.6h4.6M12 8v4.3l2.8 1.7"/>',
    tag: '<path d="M3.5 12.4V4.5a1 1 0 0 1 1-1h7.9l8.1 8.1a1.4 1.4 0 0 1 0 2l-6.9 6.9a1.4 1.4 0 0 1-2 0z"/><circle cx="8" cy="8" r="1.4"/>',
    pound: '<path d="M16.5 7.2a3.6 3.6 0 0 0-7 1.1v4.2c0 3.2-1 5.2-3 6.5h11.5M6.5 13h8"/>',
    walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="m9.5 21 2-6.5 3 2.5V21M8 11.5l2.5-3.5 3.5.5 2 3.5 2.5 1M11.5 14.5 10.5 8"/>',
  };
  function icon(name, cls) { return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + ' fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + P[name] + '</svg>'; }
  function plate(p, size) { return '<span class="plate' + (size ? ' plate-' + size : '') + '"><span class="plate-uk" aria-hidden="true">UK</span><span class="plate-txt">' + esc(p) + '</span></span>'; }
  function person(id) { return S.team.find(function (t) { return t.id === id; }); }
  function avatar(id, cls) { var t = person(id); if (!t) return ''; return '<span class="avatar' + (cls ? ' ' + cls : '') + '" title="' + esc(t.name) + '"><span class="sr-only">' + esc(t.name) + '</span><span aria-hidden="true">' + initials(t.name) + '</span></span>'; }

  // ---- Derived state -------------------------------------------------------
  function job(id) { return S.jobs.find(function (j) { return j.id === id; }) || S.history.find(function (j) { return j.id === id; }) || S.upcoming.find(function (j) { return j.id === id; }); }
  function veh(j) { return S.vehicles[j.plate]; }
  function cli(j) { return S.clients[j.clientId]; }
  function carName(v) { return v ? v.make + ' ' + v.model : ''; }
  function invoice(id) { return S.invoices.find(function (i) { return i.id === id; }); }
  function invoicesOf(j) { return j.invoiceIds.map(invoice); }
  function unpricedOf(j) { return j.items.filter(function (l) { return l.cost == null; }).length; }
  function uninvoiced(j) { return j.items.filter(function (l) { return !l.invoiceId; }); }
  function needsInvoice(j) { return j.status === 'ready' && !j.noCharge && (j.invoiceIds.length === 0 || uninvoiced(j).length > 0); }
  function unpaidOf(j) { return invoicesOf(j).filter(function (i) { return !i.paidAt; }); }
  function partsWaiting(j) { return j.parts.reduce(function (n, p) { return n + (p.status !== 'arrived' ? p.qty : 0); }, 0); }
  function partsRequested(j) { return j.parts.filter(function (p) { return p.status === 'requested'; }); }
  function qtyOf(list) { return list.reduce(function (n, p) { return n + p.qty; }, 0); }
  function isHere(j) { return j.status !== 'new' || !!j.arrivedAt || j.walkIn; }
  function onBoard(j) { if (j.status === 'no_show' || j.status === 'cancelled' || j.status === 'booked') return false; return j.status === 'delivered' ? (j.deliveredAt || '').slice(0, 10) === TODAY : (j.status !== 'new' || j.date === TODAY); }
  function boardJobs() { return S.jobs.filter(onBoard); }
  function rampJob(r) { return S.jobs.find(function (j) { return j.onRamp && j.ramp === r && (j.status === 'in_progress' || j.status === 'waiting_parts'); }); }
  function elapsed(j) { return j.rampStartedAt ? nowMin() - minOf(j.rampStartedAt) : 0; }
  function isOver(j) { return j.status === 'in_progress' && j.onRamp && elapsed(j) > j.estHours * 60; }
  function daysIn(j) { var from = (j.arrivedAt || j.date || TODAY).slice(0, 10); return Math.round((dateOf(TODAY) - dateOf(from)) / 864e5); }

  function alerts() {
    var list = [];
    var inv = boardJobs().filter(needsInvoice);
    if (inv.length) list.push({ kind: 'red', key: 'invoice', icon: 'receipt', first: inv[0], short: 'Invoice: ' + inv[0].plate + (inv.length > 1 ? ' +' + (inv.length - 1) : ''), html: '<b>' + plural(inv.length, 'car needs', 'cars need') + ' an invoice:</b> ' + inv.map(function (j) { return '<a href="#/job/' + j.id + '">' + esc(j.plate) + '</a>'; }).join(', ') });
    var parts = [];
    boardJobs().forEach(function (j) { partsRequested(j).forEach(function (p) { parts.push({ j: j, p: p }); }); });
    if (parts.length) list.push({ kind: 'plum', key: 'parts', icon: 'box', first: parts[0].j, short: 'Order part: ' + parts[0].j.plate + (parts.length > 1 ? ' +' + (parts.length - 1) : ''), html: '<b>' + plural(parts.length, 'part') + ' to order:</b> ' + parts.map(function (x) { return esc(x.p.name) + ' for <a href="#/job/' + x.j.id + '">' + esc(x.j.plate) + '</a>'; }).join(', ') });
    var over = S.jobs.filter(isOver);
    var overShort = over.length ? 'Over time: ' + over[0].plate + (over.length > 1 ? ' +' + (over.length - 1) : '') : '';
    if (over.length === 1) list.push({ kind: 'amber', key: 'over', icon: 'clock', first: over[0], short: overShort, html: '<a href="#/job/' + over[0].id + '">' + esc(over[0].plate) + '</a> is still on <b>Ramp ' + over[0].ramp + '</b> after its planned ' + hoursTxt(over[0].estHours) });
    else if (over.length) list.push({ kind: 'amber', key: 'over', icon: 'clock', first: over[0], short: overShort, html: '<b>' + over.length + ' cars</b> are past their planned time: ' + over.map(function (j) { return '<a href="#/job/' + j.id + '">' + esc(j.plate) + '</a> (Ramp ' + j.ramp + ')'; }).join(', ') });
    return list;
  }

  // ---- Toasts and screen-reader announcements --------------------------------
  function clearToasts() { var box = document.getElementById('toasts'); if (box) box.innerHTML = ''; }
  function toast(msg, opts) {
    opts = opts || {};
    var box = document.getElementById('toasts');
    var t = document.createElement('div');
    t.className = 'toast' + (opts.err ? ' err' : '');
    t.innerHTML = icon(opts.err ? 'alert' : 'checkCircle') + '<span>' + msg + '</span>';
    box.appendChild(t);
    while (box.children.length > 2) box.firstChild.remove();
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 320); }, opts.ms || 3800);
  }
  function announce(msg) { var l = document.getElementById('sr-live'); l.textContent = ''; setTimeout(function () { l.textContent = msg; }, 30); }

  // ---- Router --------------------------------------------------------------
  var views = {};
  var route = { name: 'board', param: null };
  var NAV = [
    { id: 'board', label: 'Board', icon: 'board' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar' },
    { id: 'vehicles', label: 'Vehicles', icon: 'car' },
    { id: 'clients', label: 'Clients', icon: 'users' },
    { id: 'invoices', label: 'Invoices', icon: 'receipt' },
    { id: 'outbox', label: 'Outbox', icon: 'send' },
    { id: 'reports', label: 'Reports', icon: 'chart' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];
  var TITLES = { board: 'Workshop', calendar: 'Calendar', vehicles: 'Vehicles', clients: 'Clients', invoices: 'Invoices', outbox: 'Outbox', reports: 'Reports', settings: 'Settings' };

  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '').split('/');
    var name = h[0] || 'board';
    if (name === 'job' && h[1] && job(h[1])) return { name: 'job', param: h[1] };
    if (!views[name] || name === 'job') name = 'board';
    return { name: name, param: h[1] || null };
  }

  function renderNav() {
    var badge = boardJobs().filter(needsInvoice).length;
    var active = route.name === 'job' ? 'board' : route.name;
    document.getElementById('nav').innerHTML = NAV.map(function (n, i) {
      return (i === 6 ? '<div class="nav-label">Business</div>' : i === 0 ? '<div class="nav-label">Workshop</div>' : '') +
        '<a href="#/' + n.id + '"' + (active === n.id ? ' aria-current="page"' : '') + ' data-nav="' + n.id + '">' + icon(n.icon) + '<span>' + n.label + '</span>' +
        (n.id === 'board' && badge ? '<span class="nav-badge" title="Cars ready with no invoice"><span class="sr-only">, </span>' + badge + '<span class="sr-only"> to invoice</span></span>' : '') + '</a>';
    }).join('');
    var tabs = ['board', 'calendar', 'invoices', 'reports'];
    document.getElementById('tabbar').innerHTML = tabs.map(function (id) {
      var n = NAV.find(function (x) { return x.id === id; });
      return '<a href="#/' + id + '"' + (active === id ? ' aria-current="page"' : '') + '>' + icon(n.icon) + '<span>' + n.label + '</span>' +
        (id === 'board' && badge ? '<span class="nav-badge"><span class="sr-only">, </span>' + badge + '<span class="sr-only"> to invoice</span></span>' : '') + '</a>';
    }).join('') + '<button type="button" data-action="open-drawer" aria-label="More pages and settings">' + icon('menu') + '<span>More</span></button>';
  }

  function footer() {
    return '<footer class="foot"><span>A Hiconlab demo. All businesses, people and data are fictional.</span><span><b>Liftbay</b> 4.12 · Calder &amp; Price Motors, Kendal</span></footer>';
  }

  var painted = false;
  function render(opts) {
    opts = opts || {};
    var main = document.getElementById('main');
    var fk = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.fk : null;
    var html = views[route.name](route.param);
    main.innerHTML = '<div class="view">' + html + footer() + '</div>';
    if (!opts.fresh || !painted) main.firstChild.style.animation = 'none';
    painted = true;
    renderNav();
    if (views[route.name].after) views[route.name].after(route.param);
    if (fk) { var back = main.querySelector('[data-fk="' + fk + '"]'); if (back) back.focus({ preventScroll: true }); }
    document.title = (route.name === 'job' ? job(route.param).plate : TITLES[route.name]) + ' · Calder & Price Motors · Liftbay';
  }

  function go() {
    var prev = route;
    route = parseHash();
    closeMenu();
    closeDrawer();
    clearToasts();
    if (prev.name !== route.name || prev.param !== route.param) { S.priceEdit = null; S.addLine = false; S.addPart = false; }
    render({ fresh: true });
    window.scrollTo(0, 0);
    var h1 = document.querySelector('#main h1');
    if (h1 && !(window.HiconTour && HiconTour.active)) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
  }
  function commit() { render(); }

  // ---- Board ---------------------------------------------------------------
  function rampArt(hasCar) {
    return '<svg class="ramp-art" viewBox="0 0 92 104" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
      '<rect x="2" y="2" width="88" height="100" rx="7" stroke-dasharray="3 5"/>' +
      '<rect x="5" y="44" width="8" height="16" rx="1.5" fill="currentColor" stroke="none"/><rect x="79" y="44" width="8" height="16" rx="1.5" fill="currentColor" stroke="none"/>' +
      (hasCar
        ? '<path d="M13 47 31 30M13 57l18 17M79 47 61 30M79 57 61 74"/>' +
          '<g class="car" stroke-width="1.6"><rect x="27" y="12" width="38" height="80" rx="13" fill="#24282E"/><path d="M31 35c9-5 21-5 30 0M31 70c9 4 21 4 30 0"/><path d="M33 38v29M59 38v29" opacity=".55"/><path d="M27 31h-3M65 31h3"/></g>'
        : '<path d="M13 49h14M13 55h14M79 49H65M79 55H65"/>') +
      '</svg>';
  }

  function rampTile(r) {
    var j = rampJob(r);
    if (!j) return '<div class="ramp is-free"><div class="ramp-body"><div class="ramp-head"><span class="ramp-dot"></span>RAMP ' + r + '</div><div class="ramp-free">Free</div><div class="ramp-meta">Ready for the next car</div></div>' + rampArt(false) + '</div>';
    var v = veh(j), el = elapsed(j), over = isOver(j), waiting = j.status === 'waiting_parts';
    var pct = Math.min(100, Math.round(el / (j.estHours * 60) * 100));
    var cls = 'ramp' + (over ? ' is-over' : '') + (waiting ? ' is-waiting' : '') + (S.rampFlash === r ? ' is-filling' : '');
    return '<a class="' + cls + '" href="#/job/' + j.id + '" data-ramp="' + r + '">' +
      '<div class="ramp-body"><div class="ramp-head"><span class="ramp-dot"></span>RAMP ' + r + '</div>' +
      '<div class="ramp-row">' + plate(j.plate, 'sm') + '<span class="ramp-time" data-elapsed="' + j.id + '">' + durTxt(el) + '</span></div>' +
      (waiting ? '<div class="ramp-state">Waiting parts · ' + esc(j.waitReason || 'Waiting') + '</div>' : over ? '<div class="ramp-state">Over its ' + hoursTxt(j.estHours) + '</div>' : '') +
      '<div class="ramp-meta"><b>' + esc(person(j.mechanic) ? person(j.mechanic).name : 'No mechanic') + '</b> · ' + esc(j.service) + '</div>' +
      '<div class="ramp-track" aria-hidden="true"><i style="width:' + pct + '%"></i></div></div>' + rampArt(true) + '</a>';
  }

  function whenChip(j, col) {
    if (col === 'new') {
      if (j.walkIn) return '<span class="card-when is-walkin">' + (j.fitIn ? 'Fit in' : 'Walk-in') + '</span>';
      var late = !j.arrivedAt && j.time && U.hm(nowMin()) > j.time;
      return '<span class="card-when ' + (late ? 'is-late' : 'is-time') + '" title="' + (late ? 'Due at ' + j.time + ', not here yet' : 'Booked for ' + j.time) + '">' + esc(j.time || '') + '</span>';
    }
    if (col === 'delivered') return '<span class="card-when" title="Handed over">' + fmtTime(j.deliveredAt) + '</span>';
    var d = daysIn(j);
    return '<span class="card-when' + (d >= 5 ? ' is-late' : '') + '" title="In the workshop since ' + fmtDay(j.arrivedAt || j.date) + '">' + (d === 0 ? 'today' : d + ' d') + '</span>';
  }

  function cardHTML(j) {
    var v = veh(j), c = cli(j), col = j.status;
    var badges = [];
    if (col === 'new' && c.noShows) badges.push('<span class="tag tag-amber">' + plural(c.noShows, 'previous no-show') + '</span>');
    if (j.reviewNote) badges.push('<span class="tag tag-amber" title="' + esc(j.reviewNote) + '">' + icon('alert') + 'Check details</span>');
    if (j.noCharge) badges.push('<span class="tag tag-stone">No charge</span>');
    if (c.type === 'business' && col !== 'delivered') badges.push('<span class="tag tag-line">' + icon('building') + 'Business</span>');
    var req = qtyOf(partsRequested(j)), waitingParts = partsWaiting(j);
    if (col !== 'delivered' && col !== 'ready') {
      if (req) badges.push('<span class="tag tag-plum">' + icon('box') + plural(req, 'part') + ' requested</span>');
      else if (waitingParts && col !== 'waiting_parts') badges.push('<span class="tag tag-plum">' + icon('box') + plural(waitingParts, 'part') + ' on order</span>');
      else if (!waitingParts && j.parts.length && (col === 'in_progress' || col === 'waiting_parts')) badges.push('<span class="tag tag-green">' + icon('check') + 'Parts arrived</span>');
      if (unpricedOf(j)) badges.push('<span class="tag tag-amber">' + unpricedOf(j) + ' to price</span>');
    }
    var state = '', inv = '', foot = '', alert = false;
    if (col === 'waiting_parts') state = '<div class="card-state plum">' + icon('pause') + '<span>' + esc(j.waitReason || 'Waiting') + (j.parts.some(function (p) { return p.eta && p.status === 'ordered'; }) ? ' · due ' + esc(j.parts.find(function (p) { return p.eta; }).eta) : '') + '</span></div>';
    if (col === 'ready') {
      if (needsInvoice(j)) {
        alert = true;
        state = '<div class="card-state red">' + icon('receipt') + '<span>Work done · ' + (j.invoiceIds.length ? 'additional invoice needed' : 'invoice needed') + (unpricedOf(j) ? ' · ' + unpricedOf(j) + ' to price' : '') + '</span></div>';
      } else if (unpaidOf(j).length) {
        state = '<div class="card-state green">' + icon('checkCircle') + '<span>Invoiced · waiting for the client</span></div>';
      } else {
        state = '<div class="card-state green">' + icon('checkCircle') + '<span>' + (j.noCharge && !j.invoiceIds.length ? 'No charge' : 'Paid') + ' · ready to hand over</span></div>';
      }
    }
    if ((col === 'ready' || col === 'delivered') && j.invoiceIds.length) inv = '<div class="card-inv">' + icon('receipt') + invoicesOf(j).map(function (i) { return i.number; }).join(', ') + '</div>';

    if (col === 'new') {
      if (!j.arrivedAt) {
        foot = '<button type="button" class="btn btn-primary btn-sm" data-action="arrived" data-id="' + j.id + '" data-fk="arr-' + j.id + '">' + icon('check') + 'Arrived</button>';
        if (j.time && U.hm(nowMin()) > j.time) state = '<div class="card-late"><span title="Booked for ' + j.time + ', not here yet">Late</span><span class="card-late-acts"><button type="button" class="link-btn" data-action="reschedule" data-id="' + j.id + '">Reschedule</button><button type="button" class="link-btn" data-action="no-show" data-id="' + j.id + '">No-show</button></span></div>';
      }
      else foot = '<span class="card-foot-note ok">' + icon('check') + 'Arrived ' + fmtTime(j.arrivedAt) + ' · waiting for a ramp</span>';
    } else if (col === 'in_progress') {
      foot = '<span class="card-foot-note">' + (j.onRamp ? 'On Ramp ' + j.ramp : 'Off the ramp') + (person(j.mechanic) ? ' · ' + esc(firstName(person(j.mechanic).name)) : '') + '</span>';
    } else if (col === 'waiting_parts') {
      foot = '<span class="card-foot-note">' + (j.onRamp ? 'On Ramp ' + j.ramp : 'Off the ramp') + '</span>';
    } else if (col === 'ready') {
      if (needsInvoice(j)) foot = '<a class="btn btn-sm" href="#/job/' + j.id + '" data-fk="inv-' + j.id + '">' + icon('receipt') + 'Invoice</a>';
      else if (unpaidOf(j).length) {
        foot = '<button type="button" class="btn btn-primary btn-sm" data-action="pay" data-id="' + j.id + '" data-fk="pay-' + j.id + '">' + icon('card') + 'Mark as paid</button>';
        if (c.type === 'business' && c.termsDays) foot += '<button type="button" class="btn btn-sm" data-action="handover-terms" data-id="' + j.id + '">Hand over · pay by ' + fmtDay(unpaidOf(j)[0].dueDate) + '</button>';
      } else foot = '<button type="button" class="btn btn-go btn-sm" data-action="deliver" data-id="' + j.id + '" data-fk="del-' + j.id + '">' + icon('handover') + 'Mark as delivered</button>';
    } else if (col === 'delivered') {
      var unpaid = unpaidOf(j);
      foot = unpaid.length && unpaid[0].dueDate ? '<span class="card-foot-note" style="color:var(--amber);font-weight:650">Not paid · due ' + fmtDay(unpaid[0].dueDate) + '</span>' : '<span class="card-foot-note">Handed over ' + fmtTime(j.deliveredAt) + '</span>';
    }
    var moveBtn = '<button type="button" class="move-btn" data-action="move-menu" data-id="' + j.id + '" aria-haspopup="menu" aria-expanded="false" data-fk="mv-' + j.id + '" aria-label="Move ' + esc(j.plate) + ' to another column">' + icon('move') + '<span aria-hidden="true">Move</span></button>';

    var cls = 'card' + (alert ? ' is-alert' : '') + (col === 'delivered' ? ' is-delivered' : '') + (S.flash === j.id ? ' is-new' : '');
    return '<article class="' + cls + '" data-id="' + j.id + '" data-status="' + col + '">' +
      '<div class="card-top"><div class="card-id">' + plate(j.plate) + (j.mechanic && col !== 'new' ? avatar(j.mechanic) : '') + '</div>' + whenChip(j, col) + '</div>' +
      '<a class="card-title" href="#/job/' + j.id + '" draggable="false">' + esc(carName(v)) + '<span class="sr-only">, ' + esc(j.plate) + '</span></a>' +
      '<p class="card-service">' + esc(j.service) + '</p>' +
      (col !== 'ready' && col !== 'delivered' ? '<p class="card-problem">' + esc(j.problem) + '</p>' : '') +
      '<div class="card-badges">' + badges.join('') + '</div>' + state + inv +
      '<div class="card-foot">' + foot + moveBtn + '</div></article>';
  }

  function matches(j) {
    var q = S.query.trim().toLowerCase();
    if (!q) return true;
    var v = veh(j), qc = q.replace(/\s+/g, '');
    return j.plate.toLowerCase().replace(/\s+/g, '').indexOf(qc) >= 0 || carName(v).toLowerCase().indexOf(q) >= 0 || j.service.toLowerCase().indexOf(q) >= 0 || cli(j).name.toLowerCase().indexOf(q) >= 0;
  }

  function boardColumns() {
    var all = boardJobs().filter(matches);
    var out = {};
    COLS.forEach(function (c) { out[c.id] = []; });
    all.forEach(function (j) { out[j.status].push(j); });
    out.new.sort(function (a, b) { return (a.arrivedAt ? 0 : 1) - (b.arrivedAt ? 0 : 1) || (a.time || '00').localeCompare(b.time || '00'); });
    out.delivered.sort(function (a, b) { return b.deliveredAt.localeCompare(a.deliveredAt); });
    out.ready.sort(function (a, b) { return (needsInvoice(b) ? 1 : 0) - (needsInvoice(a) ? 1 : 0); });
    return out;
  }

  views.board = function () {
    var toArrive = S.jobs.filter(function (j) { return j.status === 'new' && j.date === TODAY && !j.arrivedAt && !j.walkIn; }).length;
    var ahead = S.upcoming.length;
    var busy = [1, 2, 3].filter(rampJob).length;
    var cols = boardColumns();
    var older = S.history.filter(function (j) { return j.status === 'delivered'; }).length + S.jobs.filter(function (j) { return j.status === 'delivered' && !onBoard(j); }).length;
    var al = alerts();
    var h = '';
    h += '<header class="page-head"><div><p class="eyebrow" data-clock>' + fmtLong(TODAY) + ' · ' + U.hm(nowMin()) + '</p><div class="head-inline"><h1 class="page-title">Workshop</h1>' +
      '<p class="page-sub"><b>' + toArrive + '</b> still to arrive today · <b>' + ahead + '</b> upcoming bookings</p></div></div>' +
      '<div class="head-actions"><label class="search"><span class="sr-only">Find a car on the board</span>' + icon('search') + '<input type="search" id="board-search" data-fk="board-search" placeholder="Plate, car or client" value="' + esc(S.query) + '" autocomplete="off"></label>' +
      '<button type="button" class="btn" data-action="walk-in">' + icon('walk') + 'Walk-in</button></div></header>';
    h += '<div class="alerts" aria-label="Needs attention">' + al.map(function (a) { return '<div class="alert alert-' + a.kind + '" data-alert="' + a.key + '">' + icon(a.icon) + '<p>' + a.html + '</p></div>'; }).join('') + '</div>';
    if (al.length) h += '<nav class="alert-pills" aria-label="Needs attention (short)">' + al.map(function (a) { return '<a class="alert-pill alert-' + a.kind + '" href="#/job/' + a.first.id + '">' + icon(a.icon) + '<span>' + esc(a.short) + '</span></a>'; }).join('') + '</nav>';
    h += '<section class="bay dk" aria-label="Ramps"><div class="bay-intro"><div><div class="bay-label">Ramps in use</div><div class="bay-count">' + busy + '<span> / 3</span></div></div><p class="bay-hint">Live from the workshop. Times count from when the car went up.</p></div>' + [1, 2, 3].map(rampTile).join('') + '</section>';
    h += '<section aria-labelledby="board-h"><div class="board-tools"><h2 id="board-h">Today’s board</h2><p class="board-hint">' + icon('move') + 'Drag a card to move it, or use Move on the card</p></div>';
    h += '<div class="col-switch" role="tablist" aria-label="Board columns">' + COLS.map(function (c) {
      return '<button type="button" role="tab" id="tab-' + c.id + '" aria-controls="col-' + c.id + '" aria-selected="' + (S.mobileCol === c.id) + '" data-action="show-col" data-col="' + c.id + '"><i style="background:' + c.color + '"></i>' + c.short + ' <span class="n">' + cols[c.id].length + '</span></button>';
    }).join('') + '</div>';
    h += '<div class="board-scroll"><div class="board">' + COLS.map(function (c) {
      var list = cols[c.id];
      return '<div class="col' + (S.mobileCol === c.id ? ' is-shown' : '') + '" id="col-' + c.id + '" data-status="' + c.id + '" role="region" aria-label="' + c.label + ', ' + plural(list.length, 'car') + '">' +
        '<div class="col-head"><span class="col-name">' + c.label + '</span><span class="col-count">' + list.length + '</span></div>' +
        '<div class="col-body">' + (list.length ? list.map(cardHTML).join('') : '<p class="col-empty">' + (S.query ? 'No match' : c.id === 'new' ? 'Everyone booked today is here' : 'Nothing here') + '</p>') +
        (c.id === 'delivered' && !S.query ? '<a class="col-more" href="#/vehicles">Showing today’s · ' + older + ' older in vehicle history →</a>' : '') + '</div></div>';
    }).join('') + '</div></div></section>';
    return h;
  };
  views.board.after = function () {
    S.flash = null; S.rampFlash = null;
    var input = document.getElementById('board-search');
    input.addEventListener('input', function () {
      S.query = input.value;
      var pos = input.selectionStart;
      commit();
      var again = document.getElementById('board-search');
      again.focus(); try { again.setSelectionRange(pos, pos); } catch (e) { /* type=search */ }
    });
  };

  // ---- Moves and their rules ------------------------------------------------
  function moveBlock(j, to) {
    if (j.status === to) return 'It’s here now';
    if (j.status === 'delivered' && j.invoiceIds.length) return 'Handed over and invoiced';
    if (j.invoiceIds.length && (to === 'new' || to === 'in_progress' || to === 'waiting_parts')) return 'Invoiced, can’t go back';
    if (!isHere(j) && to !== 'new') return 'Mark it as arrived first';
    if (to === 'delivered' && j.status !== 'ready') return 'Only from Ready';
    if (to === 'delivered' && needsInvoice(j)) return 'Create the invoice first';
    return null;
  }

  function refuse(j, msg) {
    toast(msg, { err: true, ms: 5200 });
    announce(msg);
    var el = document.querySelector('.card[data-id="' + j.id + '"]');
    if (el) { el.classList.remove('is-shake'); void el.offsetWidth; el.classList.add('is-shake'); }
  }

  function requestMove(id, to) {
    var j = job(id);
    if (!j || j.status === to) return;
    var block = moveBlock(j, to);
    if (block) {
      var msgs = {
        'Mark it as arrived first': j.plate + ' isn’t marked as arrived yet. Press Arrived on its card first.',
        'Invoiced, can’t go back': j.plate + ' has been invoiced, so it can’t go back. Add extra work as a new line for an additional invoice.',
        'Handed over and invoiced': j.plate + ' has been handed over and invoiced.',
        'Only from Ready': 'Only cars on Ready can be handed over. Finish the work on ' + j.plate + ' first.',
        'Create the invoice first': 'Create the invoice for ' + j.plate + ' before it’s handed over.',
      };
      return refuse(j, msgs[block] || block);
    }
    if (to === 'new') return doMove(j, 'new', {});
    if (to === 'in_progress') return j.onRamp ? doMove(j, 'in_progress', {}) : openStartPicker(j);
    if (to === 'waiting_parts') return openWaitPicker(j);
    if (to === 'ready') {
      var next = function () { if (j.mechanic) doMove(j, 'ready', {}); else openDoneByPicker(j); };
      var pending = partsWaiting(j);
      if (pending) return confirmDialog({ title: j.plate + ': ' + (pending === 1 ? '1 part hasn’t' : pending + ' parts haven’t') + ' arrived yet', text: 'Is the work really finished?', ok: 'Yes, it’s finished', onOk: next });
      return next();
    }
    if (to === 'delivered') {
      if (unpaidOf(j).length) { var c = cli(j); if (c.type === 'business' && c.termsDays) return openTermsDialog(j); return openPayDialog(j, true); }
      return deliver(j);
    }
  }

  function doMove(j, to, o) {
    var from = j.status;
    var msg = j.plate + ' moved to ' + colLabel(to);
    if (to === 'new') { j.onRamp = false; j.ramp = null; j.rampStartedAt = null; }
    if (to === 'in_progress') {
      if (o.ramp) { j.ramp = o.ramp; j.onRamp = true; j.rampStartedAt = now(); S.rampFlash = o.ramp; }
      if (o.mechanic) j.mechanic = o.mechanic;
      j.waitReason = null;
      if (o.ramp) msg = j.plate + ' is on Ramp ' + o.ramp + ' with ' + person(j.mechanic).name;
    }
    if (to === 'waiting_parts') {
      j.waitReason = o.reason;
      if (o.where === 'off') { j.onRamp = false; }
      else if (o.where === 'move') { j.ramp = o.toRamp; j.onRamp = true; S.rampFlash = o.toRamp; }
      msg = j.plate + ' is waiting: ' + o.reason.charAt(0).toLowerCase() + o.reason.slice(1) + (j.onRamp ? ' (on Ramp ' + j.ramp + ')' : ' (off the ramp)');
    }
    if (to === 'ready') { j.onRamp = false; j.readyAt = now(); if (o.mechanic) j.mechanic = o.mechanic; j.waitReason = null; msg = j.plate + ' is ready. Time to invoice it.'; }
    if (to === 'delivered') { j.deliveredAt = now(); }
    j.status = to;
    S.flash = j.id;
    if (from !== to && window.innerWidth <= 760) { S.mobileCol = to; }
    commit();
    toast(esc(msg));
    announce(msg);
    return true;
  }

  function markArrived(j) {
    j.arrivedAt = now();
    S.flash = j.id;
    commit();
    var m = j.plate + ' arrived at ' + fmtTime(j.arrivedAt);
    toast(esc(m)); announce(m);
    var mv = document.querySelector('[data-fk="mv-' + j.id + '"]');
    if (kbd && mv && document.activeElement === document.body) mv.focus({ preventScroll: true });
  }

  function deliver(j) {
    var c = cli(j);
    j.status = 'delivered'; j.deliveredAt = now(); j.onRamp = false; S.flash = j.id;
    commit();
    var m = j.plate + ' handed over to ' + (c.company || c.name);
    toast(esc(m)); announce(m);
  }

  // ---- Dialogs ---------------------------------------------------------------
  var openDialogs = [];
  function focusables(root) { return Array.prototype.filter.call(root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'), function (el) { return el.offsetParent !== null || el.type === 'radio'; }); }

  function openDialog(o) {
    closeMenu();
    var back = document.activeElement;
    var scrim = document.createElement('div');
    scrim.className = 'scrim' + (o.drawer ? ' drawer-scrim' : '');
    var id = 'dlg-' + Date.now();
    scrim.innerHTML = '<div class="dialog ' + (o.drawer ? 'drawer ' : '') + (o.cls || '') + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '">' +
      '<div class="dialog-head"><div><h2 id="' + id + '">' + o.title + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div><button type="button" class="icon-btn" data-close aria-label="Close">' + icon('x') + '</button></div>' +
      '<div class="dialog-body">' + (o.body || '') + '</div>' + (o.foot ? '<div class="dialog-foot">' + o.foot + '</div>' : '') + '</div>';
    document.body.appendChild(scrim);
    var dlg = scrim.firstChild;
    var api = {
      el: dlg,
      close: function () {
        scrim.remove();
        openDialogs = openDialogs.filter(function (d) { return d !== api; });
        document.removeEventListener('keydown', onKey, true);
        if (o.onClose) o.onClose();
        if (back && !document.contains(back) && back.dataset && back.dataset.fk) back = document.querySelector('[data-fk="' + back.dataset.fk + '"]');
        if (back && document.contains(back) && back !== document.body) back.focus({ preventScroll: true });
        else if (kbd) { var m = document.getElementById('main'); m.focus({ preventScroll: true }); }
      },
    };
    function onKey(e) {
      if (openDialogs[openDialogs.length - 1] !== api) return;
      if (e.key === 'Escape') { e.preventDefault(); api.close(); return; }
      if (e.key === 'Tab') {
        var f = focusables(dlg).filter(function (el) { return el.type !== 'radio' || el.checked || !dlg.querySelector('input[name="' + el.name + '"]:checked'); });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!dlg.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey, true);
    scrim.addEventListener('mousedown', function (e) { if (e.target === scrim) api.close(); });
    dlg.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', api.close); });
    openDialogs.push(api);
    if (o.onOpen) o.onOpen(api);
    var auto = dlg.querySelector('[autofocus]') || dlg.querySelector('.dialog-body input:not([type="radio"]):not([disabled]), .dialog-body select, .dialog-body textarea') || dlg.querySelector('.dialog-body input:checked') || focusables(dlg)[1] || focusables(dlg)[0];
    if (auto) setTimeout(function () { auto.focus({ preventScroll: true }); }, 30);
    return api;
  }

  function confirmDialog(o) {
    var d = openDialog({
      title: esc(o.title), sub: o.text ? esc(o.text) : '', cls: '', body: o.body || '',
      foot: '<button type="button" class="btn" data-close>' + (o.cancel || 'Cancel') + '</button><button type="button" class="btn ' + (o.okCls || 'btn-primary') + '" data-ok autofocus>' + esc(o.ok || 'OK') + '</button>',
    });
    d.el.querySelector('[data-ok]').addEventListener('click', function () { d.close(); o.onOk(); });
    return d;
  }

  function mechanicChoices(j, name) {
    return S.team.filter(function (t) { return t.mechanic; }).map(function (t) {
      var busyOn = S.jobs.filter(function (x) { return x.id !== j.id && x.onRamp && x.mechanic === t.id && x.status === 'in_progress'; });
      return '<label class="choice"><input type="radio" name="' + name + '" value="' + t.id + '"' + (j.mechanic === t.id ? ' checked' : '') + '>' + avatar(t.id, 'avatar-lg') +
        '<span class="choice-main">' + esc(t.name) + (busyOn.length ? '<span class="choice-sub warn">Also on Ramp ' + busyOn[0].ramp + ' · ' + esc(busyOn[0].plate) + '</span>' : '<span class="choice-sub">Free now</span>') + '</span><span class="tick"></span></label>';
    }).join('');
  }

  function openStartPicker(j) {
    var free = [1, 2, 3].filter(function (r) { return !rampJob(r); });
    var ramps = [1, 2, 3].map(function (r) {
      var on = rampJob(r);
      return '<label class="choice choice-ramp"><input type="radio" name="ramp" value="' + r + '"' + (on ? ' disabled' : '') + (free.length === 1 && !on ? ' checked' : '') + '><span class="ramp-no">' + r + '</span>' +
        '<span class="choice-main"><span class="sr-only">Ramp ' + r + ', </span>' + (on ? 'Busy<span class="choice-sub">' + esc(on.plate) + '</span>' : 'Free<span class="choice-sub">Ready now</span>') + '</span><span class="tick"></span></label>';
    }).join('');
    var d = openDialog({
      title: esc(j.plate) + ' → In progress', sub: 'Who’s on it, and which ramp is it going on?',
      body: (free.length ? '' : '<div class="notice red">' + icon('alert') + '<span>Every ramp has a car on it. Move one to Ready or Waiting parts first.</span></div>') +
        '<fieldset class="field-group"><legend>Mechanic</legend><div class="choices cols-1">' + mechanicChoices(j, 'mech') + '</div></fieldset>' +
        '<fieldset class="field-group"><legend>Ramp</legend><div class="choices">' + ramps + '</div></fieldset>',
      foot: '<button type="button" class="btn" data-close>Cancel</button><button type="button" class="btn btn-primary" data-start disabled>' + icon('lift') + 'Start work</button>',
    });
    var btn = d.el.querySelector('[data-start]');
    function check() { btn.disabled = !(d.el.querySelector('input[name="mech"]:checked') && d.el.querySelector('input[name="ramp"]:checked')); }
    d.el.addEventListener('change', check); check();
    btn.addEventListener('click', function () {
      var m = d.el.querySelector('input[name="mech"]:checked').value, r = Number(d.el.querySelector('input[name="ramp"]:checked').value);
      d.close(); doMove(j, 'in_progress', { mechanic: m, ramp: r });
    });
  }

  function openWaitPicker(j) {
    var pend = partsWaiting(j);
    var reasonBlock = pend
      ? '<div class="notice info">' + icon('box') + '<span>Reason: <b>' + plural(pend, 'part') + (j.parts.some(function (p) { return p.status === 'requested'; }) ? ' requested' : ' on order') + '</b></span></div>'
      : '<div class="notice info">' + icon('info') + '<span>No parts are on order for ' + esc(j.plate) + '. If it needs one, request it on the job page first so the office can order it.</span></div>' +
        '<fieldset class="field-group"><legend>Why is it waiting?</legend><div class="choices">' + D.waitReasons.concat(['Other']).map(function (r) {
        return '<label class="choice"><input type="radio" name="reason" value="' + esc(r) + '"><span class="choice-main">' + esc(r) + '</span><span class="tick"></span></label>';
      }).join('') + '</div><label class="field" style="margin-top:10px" hidden data-other><span>Other reason</span><input class="input" name="other" placeholder="A few words"></label></fieldset>';
    var where = '';
    if (j.onRamp) {
      var opts = '<label class="choice"><input type="radio" name="where" value="stay" checked><span class="choice-main">Stays on Ramp ' + j.ramp + '<span class="choice-sub">The ramp stays busy</span></span><span class="tick"></span></label>';
      [1, 2, 3].forEach(function (r) { if (r !== j.ramp) { var on = rampJob(r); opts += '<label class="choice"><input type="radio" name="where" value="move:' + r + '"' + (on ? ' disabled' : '') + '><span class="choice-main">Move to Ramp ' + r + '<span class="choice-sub">' + (on ? 'Busy · ' + esc(on.plate) : 'Free') + '</span></span><span class="tick"></span></label>'; } });
      opts += '<label class="choice"><input type="radio" name="where" value="off"><span class="choice-main">Off the ramp<span class="choice-sub">Frees Ramp ' + j.ramp + '</span></span><span class="tick"></span></label>';
      where = '<fieldset class="field-group"><legend>Where is the car while it waits?</legend><div class="choices cols-1">' + opts + '</div></fieldset>';
    }
    var d = openDialog({
      title: esc(j.plate) + ' → Waiting parts', body: reasonBlock + where,
      foot: '<button type="button" class="btn" data-close>Cancel</button><button type="button" class="btn btn-primary" data-ok' + (pend ? '' : ' disabled') + '>' + icon('pause') + 'Move to Waiting parts</button>',
    });
    d.el.addEventListener('change', function () {
      var r = d.el.querySelector('input[name="reason"]:checked');
      var other = d.el.querySelector('[data-other]');
      if (other) other.hidden = !(r && r.value === 'Other');
      if (!pend) d.el.querySelector('[data-ok]').disabled = !r;
    });
    d.el.querySelector('[data-ok]').addEventListener('click', function () {
      var reason;
      if (pend) reason = plural(pend, 'part') + (j.parts.some(function (p) { return p.status === 'requested'; }) ? ' requested' : ' on order');
      else {
        reason = d.el.querySelector('input[name="reason"]:checked').value;
        if (reason === 'Other') { reason = d.el.querySelector('input[name="other"]').value.trim(); if (!reason) { d.el.querySelector('input[name="other"]').focus(); return; } }
      }
      var w = j.onRamp ? d.el.querySelector('input[name="where"]:checked').value : 'off';
      d.close();
      doMove(j, 'waiting_parts', { reason: reason, where: w.indexOf('move:') === 0 ? 'move' : w, toRamp: w.indexOf('move:') === 0 ? Number(w.slice(5)) : null });
    });
  }

  function openDoneByPicker(j) {
    var d = openDialog({
      title: esc(j.plate) + ' → Ready', sub: 'Who did the work?',
      body: '<fieldset class="field-group"><legend class="sr-only">Mechanic</legend><div class="choices cols-1">' + mechanicChoices(j, 'mech') + '</div></fieldset>',
      foot: '<button type="button" class="btn" data-close>Cancel</button><button type="button" class="btn btn-primary" data-ok disabled>' + icon('check') + 'Move to Ready</button>',
    });
    var b = d.el.querySelector('[data-ok]');
    d.el.addEventListener('change', function () { b.disabled = !d.el.querySelector('input[name="mech"]:checked'); });
    b.addEventListener('click', function () { var m = d.el.querySelector('input[name="mech"]:checked').value; d.close(); doMove(j, 'ready', { mechanic: m }); });
  }

  function openPayDialog(j, thenDeliver) {
    var c = cli(j), unpaid = unpaidOf(j);
    var amount = unpaid.reduce(function (s, i) { return s + i.total; }, 0);
    var methods = [['Card', 'card'], ['Cash', 'cash'], ['Bank transfer', 'bank']];
    var d = openDialog({
      title: 'Has ' + esc(c.company || c.name) + ' paid?', sub: esc(j.plate) + ' · ' + unpaid.map(function (i) { return i.number; }).join(', ') + ' · <b>' + money(amount) + '</b>',
      body: '<fieldset class="field-group"><legend>How did they pay?</legend><div class="choices">' + methods.map(function (m, i) {
        return '<label class="choice"><input type="radio" name="method" value="' + m[0] + '"' + (i === 0 ? ' checked' : '') + '>' + icon(m[1]) + '<span class="choice-main">' + m[0] + '</span><span class="tick"></span></label>';
      }).join('') + '</div></fieldset>',
      foot: '<button type="button" class="btn" data-close>Not yet</button><button type="button" class="btn btn-primary" data-ok data-fk="pay-ok">' + icon('check') + (thenDeliver ? 'Paid · hand over' : 'Mark as paid') + '</button>',
    });
    d.el.querySelector('[data-ok]').addEventListener('click', function () {
      var m = d.el.querySelector('input[name="method"]:checked').value;
      d.close();
      unpaid.forEach(function (i) { i.paidAt = now(); i.paidBy = m; });
      if (thenDeliver) { deliver(j); return; }
      commit();
      var msg = money(amount) + ' paid by ' + m.toLowerCase() + ' for ' + j.plate;
      toast(esc(msg)); announce(msg);
    });
  }

  function openTermsDialog(j) {
    var c = cli(j), inv = unpaidOf(j)[0];
    confirmDialog({ title: 'Hand ' + j.plate + ' over before payment?', text: c.company + ' is on ' + c.termsDays + '-day terms and pays ' + inv.number + ' by ' + fmtDay(inv.dueDate) + '.', ok: 'Hand over', okCls: 'btn-go', onOk: function () { deliver(j); } });
  }

  // ---- Move menu -------------------------------------------------------------
  var menu = null;
  function closeMenu() {
    if (!menu) return;
    var b = menu.button; menu.el.remove();
    if (b) b.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', menu.onKey, true);
    document.removeEventListener('mousedown', menu.onOut, true);
    menu = null;
  }
  function openMoveMenu(btn) {
    var j = job(btn.dataset.id);
    if (menu && menu.button === btn) { closeMenu(); return; }
    closeMenu();
    var el = document.createElement('div');
    el.className = 'menu'; el.setAttribute('role', 'menu'); el.setAttribute('aria-label', 'Move ' + j.plate + ' to');
    el.innerHTML = '<div class="menu-title">Move ' + esc(j.plate) + ' to</div>' + COLS.filter(function (c) { return c.id !== j.status; }).map(function (c) {
      var why = moveBlock(j, c.id);
      return '<button type="button" role="menuitem" data-to="' + c.id + '"' + (why ? ' aria-disabled="true"' : '') + '><span class="dot" style="background:' + c.color + '"></span>' + c.label + (why ? '<small>' + why + '</small>' : '') + '</button>';
    }).join('');
    document.body.appendChild(el);
    var r = btn.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    var left = Math.min(window.innerWidth - w - 12, Math.max(12, r.right - w));
    var top = r.bottom + 6 + h > window.innerHeight - 8 ? r.top - h - 6 : r.bottom + 6;
    el.style.left = left + 'px'; el.style.top = Math.max(8, top) + 'px';
    btn.setAttribute('aria-expanded', 'true');
    var items = Array.prototype.slice.call(el.querySelectorAll('button'));
    items[0].focus({ preventScroll: true });
    function onKey(e) {
      var i = items.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(); btn.focus(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
      else if (e.key === 'Tab') { closeMenu(); }
    }
    function onOut(e) { if (!el.contains(e.target) && e.target !== btn && !btn.contains(e.target)) closeMenu(); }
    el.addEventListener('click', function (e) {
      var it = e.target.closest('button[data-to]'); if (!it) return;
      var to = it.dataset.to, id = j.id;
      closeMenu();
      if (kbd) btn.focus({ preventScroll: true });
      if (it.getAttribute('aria-disabled') === 'true') { requestMove(id, to); return; }
      requestMove(id, to);
      var mv = document.querySelector('[data-fk="mv-' + id + '"]');
      if (kbd && mv && !openDialogs.length) mv.focus({ preventScroll: true });
    });
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onOut, true);
    menu = { el: el, button: btn, onKey: onKey, onOut: onOut };
  }

  // ---- Drag and drop (mouse and pen; touch uses Move) ------------------------
  var drag = null, lastDrop = 0, suppressClick = 0;
  document.addEventListener('dragstart', function (e) { if (e.target.closest && e.target.closest('.card')) e.preventDefault(); });
  document.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || e.pointerType === 'touch') return;
    var card = e.target.closest && e.target.closest('.card');
    if (!card || e.target.closest('button, input, select, textarea, .card-foot')) return;
    drag = { id: card.dataset.id, card: card, sx: e.clientX, sy: e.clientY, started: false };
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (!drag.started) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
      var r = drag.card.getBoundingClientRect();
      drag.ox = drag.sx - r.left; drag.oy = drag.sy - r.top;
      drag.ghost = drag.card.cloneNode(true);
      drag.ghost.classList.add('card-ghost'); drag.ghost.classList.remove('is-new');
      drag.ghost.setAttribute('aria-hidden', 'true');
      drag.ghost.style.width = r.width + 'px';
      document.body.appendChild(drag.ghost);
      drag.card.classList.add('is-dragging');
      drag.started = true;
      var bd = document.querySelector('.board'); if (bd) bd.classList.add('is-dragging');
      var src = drag.card.closest('.col'); if (src) src.classList.add('is-source');
      closeMenu();
    }
    drag.ghost.style.left = (e.clientX - drag.ox) + 'px';
    drag.ghost.style.top = (e.clientY - drag.oy) + 'px';
    var under = document.elementFromPoint(e.clientX, e.clientY);
    var col = under && under.closest('.col');
    document.querySelectorAll('.col.is-over').forEach(function (c) { if (c !== col) c.classList.remove('is-over'); });
    if (col && col.dataset.status !== job(drag.id).status) col.classList.add('is-over');
    drag.over = col;
  });
  window.addEventListener('pointerup', function (e) {
    if (!drag) return;
    var d = drag; drag = null;
    if (!d.started) return;
    document.querySelectorAll('.board.is-dragging, .col.is-source').forEach(function (n) { n.classList.remove('is-dragging', 'is-source'); });
    suppressClick = Date.now();
    d.ghost.remove();
    d.card.classList.remove('is-dragging');
    document.querySelectorAll('.col.is-over').forEach(function (c) { c.classList.remove('is-over'); });
    var under = document.elementFromPoint(e.clientX, e.clientY);
    var col = (under && under.closest('.col')) || d.over;
    lastDrop = Date.now();
    if (col && col.dataset.status !== job(d.id).status) requestMove(d.id, col.dataset.status);
  });
  window.addEventListener('pointercancel', function () { if (drag && drag.ghost) { drag.ghost.remove(); drag.card.classList.remove('is-dragging'); } drag = null; });
  document.addEventListener('click', function (e) { if (Date.now() - suppressClick < 300 && e.target.closest && e.target.closest('.card')) { e.preventDefault(); e.stopPropagation(); } }, true);
  // The tour also sends tour:drop; only use it if the pointer events did not land.
  document.addEventListener('tour:drop', function (e) {
    if (Date.now() - lastDrop < 600) return;
    var card = e.target.closest && e.target.closest('.card'); var col = e.detail && e.detail.target && e.detail.target.closest('.col');
    if (card && col) requestMove(card.dataset.id, col.dataset.status);
  });

  // ---- Job page ------------------------------------------------------------
  function itemsTable(j) {
    var rows = j.items.map(function (l) {
      var unpriced = l.cost == null;
      var isPart = l.cat === 'part';
      var locked = l.invoiceId ? invoice(l.invoiceId) : null;
      var act = '';
      if (unpriced) act = S.priceEdit === l.id ? '' : '<button type="button" class="btn btn-sm btn-primary" data-action="set-price" data-line="' + l.id + '" data-fk="price-' + l.id + '">' + icon('tag') + 'Set price</button>';
      else if (locked) act = '<span class="lock" title="On ' + locked.number + '">' + icon('lock') + '<span class="lock-no">' + locked.number + '</span></span>';
      else act = '<button type="button" class="icon-btn" data-action="remove-line" data-line="' + l.id + '" aria-label="Remove ' + esc(l.title) + '">' + icon('x') + '</button>';
      var row = '<tr class="' + (unpriced ? 'item-unpriced' : '') + '" data-line="' + l.id + '">' +
        '<td><div class="item-title">' + esc(l.title) + '</div><div class="item-cat">' + icon(isPart ? 'box' : 'wrench') + (isPart ? 'Part' : l.cat === 'labour' ? 'Labour' : 'Other') + (l.addedBy ? ' · added by ' + esc(firstName(person(l.addedBy).name)) : '') + '</div></td>' +
        '<td class="r money c-qty">' + l.qty + '</td>' +
        '<td class="r money c-cost">' + (isPart ? (unpriced ? '—' : money(l.cost)) : '—') + '</td>' +
        '<td class="r money c-mark">' + (isPart ? l.markup + '%' : '—') + '</td>' +
        '<td class="r money c-each">' + (unpriced ? '<span class="tag tag-amber">Needs a price</span>' : (l.qty > 1 ? l.qty + ' × ' : '') + money(U.unitPrice(l))) + '</td>' +
        '<td class="r money c-total"><b>' + (unpriced ? '—' : money(U.lineTotal(l))) + '</b></td>' +
        '<td class="r c-act">' + act + '</td></tr>';
      if (S.priceEdit === l.id) {
        row += '<tr class="item-unpriced"><td colspan="7"><form class="price-form" data-form="price" data-line="' + l.id + '">' +
          '<label class="field"><span>Cost each</span><span class="input-money"><input class="input" name="cost" id="price-cost" inputmode="decimal" autocomplete="off" required></span></label>' +
          '<label class="field"><span>Markup</span><select class="select" name="markup">' + [0, 10, 15, 20, 25, 30, 40].map(function (m) { return '<option' + (m === (isPart ? l.markup : 0) ? ' selected' : '') + ' value="' + m + '">' + m + '%</option>'; }).join('') + '</select></label>' +
          '<p class="price-calc" data-calc>Enter the cost to see the client’s price</p>' +
          '<div style="display:flex;gap:8px;margin-left:auto"><button type="button" class="btn" data-action="cancel-price">Cancel</button><button type="submit" class="btn btn-primary" data-fk="price-save">' + icon('check') + 'Save price</button></div></form></td></tr>';
      }
      return row;
    }).join('');
    var t = U.totalsOf(j.items.filter(function (l) { return l.cost != null; }));
    return '<div class="table-wrap"><table class="table items"><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Cost</th><th class="r">Markup</th><th class="r">Each</th><th class="r">Total</th><th class="r"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="7" class="panel-note">Nothing added yet. The mechanic’s lines appear here as they work.</td></tr>') + '</tbody></table></div>' +
      (j.items.length ? '<div class="items-total"><span>Work so far, ex VAT</span><b>' + money(t.sub) + '</b></div>' : '');
  }

  function addLineForm() {
    return '<form class="add-line" data-form="line"><div class="field-row">' +
      '<label class="field"><span>Type</span><select class="select" name="cat"><option value="labour">Labour</option><option value="part">Part</option><option value="other">Other</option></select></label>' +
      '<label class="field" style="grid-column:span 2"><span>Description</span><input class="input" name="title" required placeholder="For example: Replace rear wiper blade"></label></div>' +
      '<div class="field-row"><label class="field"><span>Qty</span><input class="input" name="qty" type="number" min="1" step="1" value="1" required></label>' +
      '<label class="field"><span>Price or cost each <small>(blank = to price)</small></span><span class="input-money"><input class="input" name="cost" inputmode="decimal" autocomplete="off"></span></label>' +
      '<label class="field"><span>Markup <small>(parts)</small></span><select class="select" name="markup">' + [0, 10, 15, 20, 25, 30, 40].map(function (m) { return '<option value="' + m + '"' + (m === 25 ? ' selected' : '') + '>' + m + '%</option>'; }).join('') + '</select></label></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" class="btn" data-action="toggle-add-line">Cancel</button><button type="submit" class="btn btn-primary">' + icon('plus') + 'Add line</button></div></form>';
  }

  function partsList(j) {
    if (!j.parts.length && !S.addPart) return '<p class="panel-note">No parts requested.</p>';
    return '<ul class="parts">' + j.parts.map(function (p) {
      var st = ['requested', 'ordered', 'arrived'], i = st.indexOf(p.status);
      var steps = st.map(function (s, k) { return (k ? '<i></i>' : '') + '<span class="' + (k < i ? 'done' : k === i ? (s === 'arrived' ? 'done' : 'on') : '') + '">' + (k < i || (k === i && s === 'arrived') ? icon('check') : '') + s.charAt(0).toUpperCase() + s.slice(1) + '</span>'; }).join('');
      var next = p.status === 'requested' ? '<button type="button" class="btn btn-sm" data-action="part-next" data-part="' + p.id + '">Mark ordered</button>' : p.status === 'ordered' ? '<button type="button" class="btn btn-sm" data-action="part-next" data-part="' + p.id + '">Mark arrived</button>' : '';
      return '<li><div><div class="part-name">' + esc(p.name) + (p.qty > 1 ? ' × ' + p.qty : '') + '</div><div class="part-note">' + esc(p.note || '') + (p.requestedBy ? ' · asked by ' + esc(firstName(person(p.requestedBy).name)) : '') + '</div></div>' +
        '<div class="part-actions"><div class="steps">' + steps + '</div>' + next + '</div></li>';
    }).join('') + '</ul>';
  }

  function addPartForm() {
    return '<form class="add-line" data-form="part"><div class="field-row"><label class="field" style="grid-column:span 2"><span>Part</span><input class="input" name="name" required placeholder="For example: Front wiper blade"></label>' +
      '<label class="field"><span>Qty</span><input class="input" name="qty" type="number" min="1" value="1" required></label></div>' +
      '<label class="field" style="margin-bottom:12px"><span>Note <small>(optional)</small></span><input class="input" name="note" placeholder="Size, supplier, anything useful"></label>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" class="btn" data-action="toggle-add-part">Cancel</button><button type="submit" class="btn btn-primary">' + icon('plus') + 'Request part</button></div></form>';
  }

  function notesList(list, form, placeholder) {
    return '<ul class="notes">' + (list.length ? list.map(function (n) {
      var t = person(n.by);
      return '<li>' + avatar(n.by, 'avatar-lg') + '<div><div class="note-meta"><b>' + esc(t.name) + '</b>' + fmtWhen(n.at) + '</div><p class="note-text">' + esc(n.text) + '</p></div></li>';
    }).join('') : '<li style="display:block" class="panel-note">No notes yet.</li>') + '</ul>' +
      '<form class="note-form" data-form="' + form + '"><label class="field" style="flex:1"><span class="sr-only">' + placeholder + '</span><textarea class="textarea" name="text" rows="1" placeholder="' + placeholder + '" required></textarea></label><button type="submit" class="btn">Add</button></form>';
  }

  function invoicePanel(j) {
    var invs = invoicesOf(j), pending = uninvoiced(j), unpriced = unpricedOf(j);
    var need = needsInvoice(j);
    var free = j.noCharge && !invs.length;
    var priced = pending.filter(function (l) { return l.cost != null; });
    var draft = U.totalsOf(priced);
    var c = cli(j);
    var h = '<section class="panel inv o3' + (need ? ' is-needed' : '') + '" id="invoice" aria-labelledby="inv-h"><div class="inv-head"><div class="panel-head"><h2 id="inv-h">' + (invs.length > 1 ? 'Invoices' : 'Invoice') + '</h2>' +
      (free ? '<span class="tag tag-stone">No charge</span>' : need ? '<span class="tag tag-red">' + (invs.length ? 'Additional invoice needed' : 'Invoice needed') + '</span>' : invs.length && !unpaidOf(j).length ? '<span class="tag tag-green">' + icon('check') + 'Paid</span>' : invs.length ? '<span class="tag tag-amber">Waiting for payment</span>' : '<span class="tag tag-stone">Draft</span>') + '</div>';
    var msg;
    if (free) msg = 'No charge: warranty or goodwill work. Nothing is invoiced; the lines stay on the job for the record.';
    else if (!invs.length) msg = j.status === 'ready' ? (unpriced ? 'The car is ready. Price the workshop’s line' + (unpriced > 1 ? 's' : '') + ' first, then create the invoice.' : 'The car is ready. Check nothing’s missing, then create the invoice.') : 'You can create it once the car is on Ready. The draft below updates as lines are added.';
    else if (pending.length) msg = plural(pending.length, 'line was', 'lines were') + ' added after the last invoice. Bill ' + (pending.length === 1 ? 'it' : 'them') + ' on an additional invoice.';
    else if (j.status === 'delivered') msg = 'Handed over ' + fmtWhen(j.deliveredAt) + '. Everything on this job is invoiced.';
    else msg = 'Everything on this job is invoiced. Issued invoices can’t be edited.';
    h += '<p class="inv-msg">' + msg + '</p></div>';
    h += invs.map(function (i) {
      var trail = '';
      trail += i.sends.length ? i.sends.map(function (s) { return '<span class="ok">' + icon('mail') + 'Sent to ' + esc(s.to) + ' · ' + fmtWhen(s.at) + '</span>'; }).join('') : '<span>' + icon('mail') + (c.email ? 'Not emailed yet' : 'No email address, give it printed') + '</span>';
      trail += i.paidAt ? '<span class="ok">' + icon('checkCircle') + 'Paid by ' + esc(i.paidBy.toLowerCase()) + ' · ' + fmtWhen(i.paidAt) + '</span>' : i.dueDate ? '<span>' + icon('clock') + 'Payment due ' + fmtDay(i.dueDate) + '</span>' : '<span>' + icon('clock') + 'Not paid yet</span>';
      if (j.status === 'delivered' && j.deliveredAt) trail += '<span class="ok">' + icon('handover') + 'Handed over · ' + fmtWhen(j.deliveredAt) + '</span>';
      return '<div class="inv-doc dk" data-invoice="' + i.id + '"><div class="inv-no">' + icon('receipt') + i.number + '</div><div class="inv-issued">Issued ' + fmtWhen(i.issuedAt) + '</div><div class="inv-amt">' + money(i.total) + '<small>incl. VAT</small></div>' +
        '<div class="inv-split"><span>Subtotal <b>' + money(i.sub) + '</b></span><span>VAT 20% <b>' + money(i.vat) + '</b></span></div><div class="inv-trail">' + trail + '</div></div>';
    }).join('');
    if (!free && (pending.length || !invs.length)) {
      h += '<div class="inv-sum" style="' + (invs.length ? 'margin-top:14px' : '') + '">' +
        '<div class="sum-row"><span>Subtotal' + (invs.length ? ' (new lines)' : '') + '</span><b data-sum="sub">' + money(draft.sub) + '</b></div>' +
        '<div class="sum-row"><span>VAT 20%</span><b data-sum="vat">' + money(draft.vat) + '</b></div>' +
        '<div class="sum-row total"><span>Total' + (unpriced ? ' <span class="pending">+ ' + unpriced + ' to price</span>' : '') + '</span><b data-sum="total">' + money(draft.total) + '</b></div></div>';
    }
    h += '<div class="inv-actions">';
    if (need) {
      h += '<button type="button" class="btn btn-primary btn-lg btn-block" data-action="create-invoice" data-id="' + j.id + '"' + (unpriced ? ' disabled title="Price the workshop’s lines first"' : '') + ' data-fk="create-inv">' + icon('receipt') + (invs.length ? 'Create additional invoice' : 'Create invoice') + '</button>';
      h += '<button type="button" class="btn btn-block" data-action="preview-draft" data-id="' + j.id + '"' + (unpriced ? ' disabled' : '') + '>' + icon('file') + 'Preview draft</button>';
    } else if (!invs.length && !free) {
      h += '<button type="button" class="btn btn-block" data-action="preview-draft" data-id="' + j.id + '"' + (unpriced || !j.items.length ? ' disabled' : '') + '>' + icon('file') + 'Preview draft</button>';
    }
    if (free && j.status === 'ready') h += '<button type="button" class="btn btn-go btn-lg btn-block" data-action="deliver" data-id="' + j.id + '">' + icon('handover') + 'Mark as delivered</button>';
    if (!invs.length && j.status !== 'delivered') h += '<label class="switch nc-switch"><input type="checkbox" data-nocharge="' + j.id + '"' + (j.noCharge ? ' checked' : '') + '><span class="track"></span><span>No charge <small>warranty or goodwill</small></span></label>';
    if (invs.length) {
      var last = invs[invs.length - 1];
      var emails = c.emails || (c.email ? [c.email] : []);
      if (emails.length) {
        h += '<div class="send-row">' + (emails.length > 1 ? '<label class="sr-only" for="send-to">Send to</label><select class="select" id="send-to">' + emails.map(function (e) { return '<option>' + esc(e) + '</option>'; }).join('') + '</select>' : '') +
          '<button type="button" class="btn ' + (last.sends.length ? '' : 'btn-primary') + '" data-action="send-invoice" data-inv="' + last.id + '" data-fk="send-inv" style="' + (emails.length > 1 ? '' : 'flex:1') + '">' + icon('send') + (last.sends.length ? 'Send again' : 'Send by email') + '</button></div>';
      }
      h += '<div class="row">';
      h += '<button type="button" class="btn" data-action="preview-invoice" data-inv="' + last.id + '">' + icon('printer') + 'Print / PDF</button>';
      if (unpaidOf(j).length) h += '<button type="button" class="btn ' + (last.sends.length || !emails.length ? 'btn-primary' : '') + '" data-action="pay" data-id="' + j.id + '" data-fk="pay-' + j.id + '">' + icon('card') + 'Mark as paid</button>';
      h += '</div>';
      if (j.status === 'ready' && !need && !unpaidOf(j).length) h += '<button type="button" class="btn btn-go btn-lg btn-block" data-action="deliver" data-id="' + j.id + '" data-fk="del-' + j.id + '">' + icon('handover') + 'Mark as delivered</button>';
      if (j.status === 'ready' && !need && unpaidOf(j).length && c.type === 'business' && c.termsDays) h += '<button type="button" class="btn btn-block" data-action="handover-terms" data-id="' + j.id + '">Hand over · pay by ' + fmtDay(unpaidOf(j)[0].dueDate) + '</button>';
      if (j.status === 'delivered') h += '<a class="btn btn-block" href="#/board">' + icon('arrowLeft') + 'Back to the board</a>';
    }
    h += '</div></section>';
    return h;
  }

  function previousVisits(j) {
    var v = veh(j);
    var mine = S.history.concat(S.jobs).filter(function (x) { return x.plate === j.plate && x.id !== j.id && x.status === 'delivered'; }).map(function (x) {
      var tot = invoicesOf(x).reduce(function (s, i) { return s + i.total; }, 0);
      return { date: x.date, service: x.service, mileage: x.mileage, total: tot, id: x.id };
    });
    var list = mine.concat(v.history.map(function (h) { return { date: h.date, service: h.service, mileage: h.mileage, total: h.total, note: h.note, old: true }; }))
      .sort(function (a, b) { return b.date.localeCompare(a.date); });
    var h = '<ol class="timeline"><li class="now"><div class="tl-top"><span>' + esc(j.service) + '</span><span class="mono">now</span></div><div class="tl-sub">This visit · ' + (j.mileage || v.mileage).toLocaleString('en-GB') + ' mi</div></li>';
    h += list.map(function (x) {
      return '<li><div class="tl-top"><span>' + (x.id ? '<a href="#/job/' + x.id + '">' + esc(x.service) + '</a>' : esc(x.service)) + '</span><span class="mono">' + (x.note === 'No-show' ? 'no-show' : money(x.total)) + '</span></div>' +
        '<div class="tl-sub">' + fmtDate(x.date) + ' · ' + x.mileage.toLocaleString('en-GB') + ' mi' + (x.note && x.note !== 'No-show' ? ' · ' + esc(x.note) : '') + (x.old ? ' · from your old system' : '') + '</div></li>';
    }).join('');
    return h + '</ol>';
  }

  views.job = function (id) {
    var j = job(id), v = veh(j), c = cli(j);
    var mech = person(j.mechanic);
    var statusSel = '<label class="sr-only" for="job-status">Move this car</label><select class="select" id="job-status" data-fk="job-status" style="width:auto;height:38px">' +
      '<option value="">Move to…</option>' + COLS.filter(function (x) { return x.id !== j.status; }).map(function (x) { var b = moveBlock(j, x.id); return '<option value="' + x.id + '"' + (b ? ' disabled' : '') + '>' + x.label + (b ? ' (' + b.toLowerCase() + ')' : '') + '</option>'; }).join('') + '</select>';
    var stLabel = j.status === 'booked' ? 'Booked' : j.status === 'no_show' ? 'No-show' : j.status === 'cancelled' ? 'Cancelled' : colLabel(j.status);
    var live = onBoard(j);
    var h = '<nav class="crumbs" aria-label="Breadcrumb"><a href="#/board">' + icon('arrowLeft') + 'Board</a><span aria-hidden="true">/</span><span>' + esc(j.plate) + '</span></nav>';
    h += '<section class="panel job-head"><div><div class="job-plate-row">' + plate(j.plate, 'lg') + '<h1 class="job-title">' + esc(carName(v)) + '</h1></div>' +
      '<div class="job-meta"><span>' + icon('user') + esc(c.name) + (c.company ? ', ' + esc(c.company) : '') + '</span>' + (c.type === 'business' ? '<span class="tag tag-line">' + icon('building') + 'Business · ' + c.termsDays + '-day terms</span>' : '') +
      '<span>' + icon('phone') + '<a href="tel:' + c.phone.replace(/\s/g, '') + '">' + esc(c.phone) + '</a></span>' + (c.email ? '<span>' + icon('mail') + '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></span>' : '') + '</div>' +
      '<div class="job-meta"><span>' + icon('wrench') + '<b>' + esc(j.service) + '</b></span><span>' + icon('calendar') + 'Booked ' + fmtDay(j.date) + (j.time ? ' at ' + j.time : j.walkIn ? ' · walk-in' : '') + '</span><span>' + icon('clock') + 'Est. ' + hoursTxt(j.estHours) + '</span></div></div>' +
      '<div class="job-side"><span class="status st-' + j.status + '">' + stLabel + '</span>' +
      '<div class="job-crew"><span>' + (mech ? avatar(mech.id) + '<b>' + esc(mech.name) + '</b>' : 'No mechanic yet') + '</span><span>' + icon('lift') + (j.onRamp ? '<b>Ramp ' + j.ramp + '</b>' : 'Off the ramp') + '</span></div>' +
      (j.status === 'booked' ? '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end"><button type="button" class="btn btn-primary" data-action="fit-in" data-id="' + j.id + '">' + icon('walk') + 'Fit in today</button><button type="button" class="btn" data-action="reschedule" data-id="' + j.id + '">Reschedule</button><button type="button" class="btn btn-ghost" data-action="cancel-booking" data-id="' + j.id + '">Cancel booking</button></div>' : '') +
      (live ? '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">' + (j.status === 'new' && !j.arrivedAt && !j.walkIn ? '<button type="button" class="btn btn-primary" data-action="arrived" data-id="' + j.id + '">' + icon('check') + 'Arrived</button><button type="button" class="btn" data-action="reschedule" data-id="' + j.id + '">Reschedule</button><button type="button" class="btn" data-action="no-show" data-id="' + j.id + '">No-show</button><button type="button" class="btn btn-ghost" data-action="cancel-booking" data-id="' + j.id + '">Cancel booking</button>' : '') + statusSel + '</div>' : '') + '</div></section>';

    h += '<div class="job-grid"><div class="job-main">';
    h += '<section class="panel o1" aria-labelledby="rep-h"><div class="panel-head"><h2 id="rep-h">Reported by the client</h2></div><blockquote class="reported" style="margin:0">' + esc(j.problem) + '<p class="reported-by">' + esc(firstName(c.name)) + (j.online ? ', booked online' : j.walkIn && !j.fitIn ? ', at the counter' : ', on the phone') + ' · ' + fmtDay(j.createdAt) + '</p></blockquote>' +
      (j.reviewNote ? '<div class="notice review">' + icon('alert') + '<span><b>Check details.</b> ' + esc(j.reviewNote) + '</span></div>' : '') + '</section>';
    h += '<section class="panel o2" aria-labelledby="work-h"><div class="panel-head"><h2 id="work-h">Work done</h2><span class="panel-note">Labour as sold · parts at cost + markup</span>' +
      (j.status !== 'delivered' ? '<div class="aside"><button type="button" class="btn btn-sm" data-action="toggle-add-line" aria-expanded="' + S.addLine + '">' + icon('plus') + 'Add line</button></div>' : '') + '</div>' +
      itemsTable(j) + (S.addLine ? addLineForm() : '') + '</section>';
    h += '<section class="panel o4" aria-labelledby="parts-h"><div class="panel-head"><h2 id="parts-h">Parts needed</h2>' + (j.status !== 'delivered' ? '<div class="aside"><button type="button" class="btn btn-sm" data-action="toggle-add-part" aria-expanded="' + S.addPart + '">' + icon('plus') + 'Request a part</button></div>' : '') + '</div>' + partsList(j) + (S.addPart ? addPartForm() : '') + '</section>';
    h += '<section class="panel o5" aria-labelledby="wn-h"><div class="panel-head"><h2 id="wn-h">Workshop notes</h2></div>' + notesList(j.notes, 'note', 'Add a note for the workshop') + '</section>';
    h += '<section class="panel office o6" aria-labelledby="on-h"><div class="panel-head"><h2 id="on-h">Office notes</h2><span class="tag tag-line">' + icon('lock') + 'Hidden from the workshop</span></div>' + notesList(j.officeNotes, 'office-note', 'Add an office note') + '</section>';
    h += '</div><aside class="job-aside" aria-label="Invoice and vehicle">';
    h += invoicePanel(j);
    h += '<section class="panel o7" aria-labelledby="veh-h"><div class="panel-head"><h2 id="veh-h">Vehicle</h2></div>' +
      '<div class="client-box"><div class="who">' + esc(c.company || c.name) + (c.type === 'business' ? ' <span class="tag tag-line">Business</span>' : '') + '</div>' + (c.company ? '<span>Contact: ' + esc(c.name) + '</span>' : '') + (c.vatNumber ? '<span>VAT ' + esc(c.vatNumber) + '</span>' : '') + '</div>' +
      '<dl class="dl"><dt>Make and model</dt><dd>' + esc(carName(v)) + '</dd><dt>Year</dt><dd>' + v.year + '</dd><dt>Colour</dt><dd>' + esc(v.colour) + '</dd><dt>Mileage</dt><dd>' + (j.mileage || v.mileage).toLocaleString('en-GB') + ' mi</dd>' +
      '<dt>VIN</dt><dd class="mono">' + esc(v.vin) + '</dd><dt>MOT due</dt><dd>' + fmtDate(v.motDue) + '</dd><dt>Service due</dt><dd' + (v.serviceDue <= TODAY ? ' style="color:var(--red)"' : '') + '>' + fmtDate(v.serviceDue) + (v.serviceDue <= TODAY ? ' · due now' : '') + '</dd></dl></section>';
    h += '<section class="panel o8" aria-labelledby="pv-h"><div class="panel-head"><h2 id="pv-h">Previous visits</h2></div>' + previousVisits(j) + '</section>';
    h += '</aside></div>';
    return h;
  };
  views.job.after = function (id) {
    var sel = document.getElementById('job-status');
    if (sel) sel.addEventListener('change', function () { var to = sel.value; if (!to) return; sel.value = ''; requestMove(id, to); });
    var cost = document.getElementById('price-cost');
    if (cost) {
      var form = cost.form, calc = form.querySelector('[data-calc]');
      var l = job(id).items.find(function (x) { return x.id === form.dataset.line; });
      var upd = function () {
        var n = parseFloat(cost.value.replace(/[£,\s]/g, '')), mk = Number(form.markup.value);
        if (!(n > 0)) { calc.textContent = 'Enter the cost to see the client’s price'; return; }
        var each = U.round2(n * (1 + mk / 100));
        calc.innerHTML = money(n) + ' + ' + mk + '% = <b>' + money(each) + '</b> each' + (l.qty > 1 ? ' · <b>' + money(U.round2(each * l.qty)) + '</b> for ' + l.qty : '');
      };
      cost.addEventListener('input', upd); form.markup.addEventListener('change', upd);
      if (!cost.value) cost.focus({ preventScroll: true });
    }
  };

  function invoiceDoc(inv, j, draft) {
    var c = cli(j), v = veh(j), co = S.company;
    var lines = draft ? j.items.filter(function (l) { return !l.invoiceId; }).map(function (l) { return { title: l.title, qty: l.qty, unit: U.unitPrice(l), total: U.lineTotal(l) }; }) : inv.lines;
    var t = draft ? U.totalsOf(j.items.filter(function (l) { return !l.invoiceId; })) : inv;
    return '<div class="doc"><div class="doc-top"><div><div class="doc-co">' + esc(co.name) + '</div><div class="doc-small">' + co.address.map(esc).join(', ') + '<br>' + esc(co.phone) + ' · ' + esc(co.email) + '<br>VAT ' + esc(co.vatNumber) + '</div></div>' +
      '<div class="doc-title"><b>' + (draft ? 'Draft invoice' : 'Invoice') + '</b><span class="mono">' + (draft ? 'Number given on creation' : inv.number) + '</span>' + (!draft && inv.paidAt ? '<br><span class="paid-stamp">PAID</span>' : '') + '</div></div>' +
      '<div class="doc-cols"><div><h4>Bill to</h4>' + esc(c.company || c.name) + '<br><span class="doc-small">' + (c.address ? c.address.map(esc).join('<br>') : esc(c.email || c.phone)) + '</span></div>' +
      '<div><h4>Vehicle</h4>' + esc(j.plate) + '<br><span class="doc-small">' + esc(carName(v)) + ' · ' + (j.mileage || v.mileage).toLocaleString('en-GB') + ' mi</span></div>' +
      '<div><h4>Dates</h4><span class="doc-small">Issued ' + (draft ? fmtDate(TODAY) : fmtDate(inv.issuedAt)) + (inv && inv.dueDate ? '<br>Due ' + fmtDate(inv.dueDate) : '<br>Due on collection') + '</span></div></div>' +
      '<table class="table"><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Each</th><th class="r">Amount</th></tr></thead><tbody>' +
      lines.map(function (l) { return '<tr><td>' + esc(l.title) + '</td><td class="r money">' + l.qty + '</td><td class="r money">' + money(l.unit) + '</td><td class="r money">' + money(l.total) + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<div class="doc-totals"><div class="sum-row"><span>Subtotal</span><b>' + money(t.sub) + '</b></div><div class="sum-row"><span>VAT 20%</span><b>' + money(t.vat) + '</b></div><div class="sum-row total"><span>Total</span><b>' + money(t.total) + '</b></div></div>' +
      '<p class="doc-foot">' + esc(co.invoiceFooter) + ' Company no. ' + esc(co.companyNumber) + '.</p></div>';
  }
  function previewInvoice(inv, j, draft) {
    var d = openDialog({
      title: draft ? 'Draft invoice for ' + esc(j.plate) : esc(inv.number), sub: draft ? 'Nothing is sent or numbered until you create it.' : esc(j.plate) + ' · ' + esc(cli(j).company || cli(j).name), cls: 'dialog-doc',
      body: invoiceDoc(inv, j, draft),
      foot: '<button type="button" class="btn" data-close>Close</button>' + (draft ? '' : '<button type="button" class="btn btn-primary" data-print>' + icon('printer') + 'Print</button>'),
    });
    var p = d.el.querySelector('[data-print]'); if (p) p.addEventListener('click', function () { window.print(); });
  }

  function createInvoice(j) {
    var lines = uninvoiced(j), t = U.totalsOf(lines);
    var number = 'INV-2026-' + String(S.nextInv).padStart(4, '0');
    confirmDialog({
      title: 'Create ' + number + '?', text: 'Check the lines first: an issued invoice can’t be edited. Nothing is sent yet; you can email or print it next.',
      body: '<div class="inv-sum" style="border-radius:10px;border:1px solid var(--line)"><div class="sum-row"><span>' + plural(lines.length, 'line') + ' for ' + esc(j.plate) + '</span><b>' + money(t.sub) + '</b></div><div class="sum-row"><span>VAT 20%</span><b>' + money(t.vat) + '</b></div><div class="sum-row total"><span>Total</span><b>' + money(t.total) + '</b></div></div>',
      ok: 'Create invoice', onOk: function () {
        var c = cli(j);
        var inv = { id: 'inv-' + S.nextInv, number: number, jobId: j.id, plate: j.plate, clientId: j.clientId, issuedAt: now(),
          lines: lines.map(function (l) { return { title: l.title, cat: l.cat, qty: l.qty, unit: U.unitPrice(l), total: U.lineTotal(l) }; }),
          sub: t.sub, vat: t.vat, total: t.total, sends: [], paidAt: null, paidBy: null, dueDate: c.type === 'business' && c.termsDays ? U.addDays(TODAY, c.termsDays) : null };
        S.nextInv++;
        lines.forEach(function (l) { l.invoiceId = inv.id; });
        S.invoices.push(inv);
        j.invoiceIds.push(inv.id);
        commit();
        var m = 'Invoice ' + number + ' created. ' + (c.email ? 'Send it by email or print it.' : 'Print it for the client.');
        toast(esc(m)); announce(m);
        var s = document.querySelector('[data-fk="send-inv"]'); if (s && kbd) s.focus({ preventScroll: true });
      },
    });
  }

  function sendInvoice(inv) {
    var j = job(inv.jobId), c = cli(j);
    var sel = document.getElementById('send-to');
    var to = sel ? sel.value : (c.email || (c.emails && c.emails[0]));
    var btn = document.querySelector('[data-action="send-invoice"]');
    if (btn) { btn.disabled = true; btn.innerHTML = icon('send') + 'Sending…'; }
    setTimeout(function () {
      var at = now();
      inv.sends.push({ to: to, at: at });
      S.outbox.unshift({ id: 'm-' + inv.id + '-' + inv.sends.length, kind: 'invoice', to: to, subject: 'Invoice ' + inv.number + ': your vehicle ' + inv.plate + ' is ready', at: at, attachment: inv.number + '.pdf', status: 'Delivered', invoiceId: inv.id, jobId: j.id });
      commit();
      var m = 'Invoice ' + inv.number + ' emailed to ' + to;
      toast(esc(m)); announce(m);
      var p = document.querySelector('[data-fk="pay-' + j.id + '"]'); if (p && kbd) p.focus({ preventScroll: true });
    }, 650);
  }

  function openReschedule(j) {
    var slots = []; for (var m = 480; m < 960; m += 30) slots.push(U.hm(m));
    var next = U.addDays(TODAY, 1); while (U.dow(next) === 0 || U.dow(next) === 6) next = U.addDays(next, 1);
    var d = openDialog({
      title: 'Reschedule ' + esc(j.plate), sub: esc(cli(j).name) + ' · ' + esc(j.service) + ' · ' + hoursTxt(j.estHours),
      body: '<div class="field-row"><label class="field"><span>New day</span><input class="input" type="date" name="day" min="' + TODAY + '" max="' + U.addDays(TODAY, S.company.bookAhead) + '" value="' + next + '"></label>' +
        '<label class="field"><span>Time</span><select class="select" name="time">' + slots.map(function (t) { return '<option' + (t === (j.time || '09:00') ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label></div><p class="notice red" data-err hidden></p>',
      foot: '<button type="button" class="btn" data-close>Cancel</button><button type="button" class="btn btn-primary" data-ok>' + icon('calendar') + 'Move booking</button>',
    });
    d.el.querySelector('[data-ok]').addEventListener('click', function () {
      var day = d.el.querySelector('[name="day"]').value, time = d.el.querySelector('[name="time"]').value, err = d.el.querySelector('[data-err]');
      if (!day || U.dow(day) === 0 || U.dow(day) === 6) { err.hidden = false; err.textContent = 'We’re closed at weekends. Pick a weekday.'; return; }
      d.close();
      j.date = day; j.time = time;
      var from = S.jobs.indexOf(j) >= 0 ? S.jobs : S.upcoming;
      from.splice(from.indexOf(j), 1);
      if (day === TODAY) { j.status = 'new'; S.jobs.push(j); S.flash = j.id; }
      else { j.status = 'booked'; S.upcoming.push(j); S.upcoming.sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); }); }
      if (route.name === 'job') location.hash = '#/board'; else commit();
      var msg = j.plate + ' moved to ' + fmtDay(day) + ' at ' + time;
      toast(esc(msg)); announce(msg);
    });
  }

  // ---- New booking ---------------------------------------------------------
  function openNewBooking(walkIn) {
    var slots = []; for (var m = 480; m < 960; m += 30) slots.push(U.hm(m));
    var nextSlot = slots.find(function (s) { return s > U.hm(nowMin()); }) || '15:30';
    var d = openDialog({
      title: 'New booking', sub: 'Book a car in by phone, or check in someone at the counter.', cls: 'dialog-wide',
      body: '<div class="seg" role="tablist" aria-label="Booking type" style="margin-bottom:16px"><button type="button" role="tab" aria-selected="' + !walkIn + '" data-mode="phone">Phone booking</button><button type="button" role="tab" aria-selected="' + !!walkIn + '" data-mode="walk">Walk-in now</button></div>' +
        '<form data-form="booking" id="booking-form" novalidate><div class="field-row"><label class="field"><span>Registration</span><span class="plate-field"><input class="input plate-input" name="plate" required maxlength="8" autocomplete="off" placeholder="AB12 CDE" autofocus></span></label>' +
        '<div class="field" aria-live="polite"><span>&nbsp;</span><p class="panel-note" data-known style="padding-top:12px">Type the plate to find the car.</p></div></div>' +
        '<div class="field-row"><label class="field"><span>Client name</span><input class="input" name="name" required autocomplete="off"></label><label class="field"><span>Phone</span><input class="input" name="phone" type="tel" required autocomplete="off"></label><label class="field"><span>Email <small>(optional)</small></span><input class="input" name="email" type="email" autocomplete="off"></label></div>' +
        '<div class="field-row"><label class="field"><span>Make and model <small>(new cars)</small></span><input class="input" name="car" autocomplete="off" placeholder="For example: Ford Fiesta"></label><label class="field"><span>Service</span><select class="select" name="service">' + D.services.map(function (s) { return '<option value="' + esc(s.name) + '">' + esc(s.name) + ' · ' + hoursTxt(s.hours) + '</option>'; }).join('') + '</select></label></div>' +
        '<label class="field" style="margin-bottom:14px"><span>What the client said</span><textarea class="textarea" name="problem" rows="2" placeholder="In their words: what’s wrong, when it happens"></textarea></label>' +
        '<div class="field-row" data-when><label class="field"><span>Day</span><input class="input" name="date" type="date" min="' + TODAY + '" max="' + U.addDays(TODAY, S.company.bookAhead) + '" value="' + TODAY + '"></label><label class="field"><span>Time</span><select class="select" name="time">' + slots.map(function (s) { return '<option' + (s === nextSlot ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label></div>' +
        '<p class="notice red" data-err hidden></p></form>',
      foot: '<button type="button" class="btn" data-close>Cancel</button><button type="submit" form="booking-form" class="btn btn-primary">' + icon('check') + '<span data-submit-label>' + (walkIn ? 'Check in now' : 'Book in') + '</span></button>',
    });
    var f = d.el.querySelector('form');
    var mode = walkIn ? 'walk' : 'phone';
    function setMode(mo) {
      mode = mo;
      d.el.querySelectorAll('[data-mode]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.mode === mo)); });
      d.el.querySelector('[data-when]').hidden = mo === 'walk';
      d.el.querySelector('[data-submit-label]').textContent = mo === 'walk' ? 'Check in now' : 'Book in';
    }
    setMode(mode);
    d.el.querySelectorAll('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
    f.plate.addEventListener('input', function () {
      var p = f.plate.value.toUpperCase().replace(/\s+/g, '');
      var hit = Object.keys(S.vehicles).find(function (k) { return k.replace(/\s/g, '') === p; });
      var known = d.el.querySelector('[data-known]');
      if (hit) {
        var v = S.vehicles[hit], c = S.clients[v.clientId];
        known.innerHTML = '<b>' + esc(carName(v)) + '</b> · ' + esc(c.company || c.name) + '. Details filled in.';
        f.name.value = c.name; f.phone.value = c.phone; f.email.value = c.email || ''; f.car.value = carName(v);
      } else known.textContent = p.length >= 5 ? 'New to us. Add the client’s details below.' : 'Type the plate to find the car.';
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = d.el.querySelector('[data-err]');
      var missing = ['plate', 'name', 'phone'].filter(function (n) { return !f[n].value.trim(); });
      if (missing.length) { err.hidden = false; err.textContent = 'Please add the ' + missing.map(function (n) { return n === 'plate' ? 'registration' : n === 'name' ? 'client’s name' : 'phone number'; }).join(' and ') + '.'; f[missing[0]].focus(); return; }
      var raw = f.plate.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      var pl = raw.length === 7 ? raw.slice(0, 4) + ' ' + raw.slice(4) : raw;
      var hit = Object.keys(S.vehicles).find(function (k) { return k.replace(/\s/g, '') === raw; });
      var v = hit ? S.vehicles[hit] : null, cid;
      if (v) cid = v.clientId;
      else {
        cid = 'c-new-' + Date.now();
        S.clients[cid] = { id: cid, name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(), type: 'private' };
        var mm = (f.car.value.trim() || 'Car (details to check)').split(' ');
        v = { plate: pl, make: mm[0], model: mm.slice(1).join(' '), year: 2018, colour: '—', mileage: 0, vin: 'To check', motDue: U.addDays(TODAY, 200), serviceDue: U.addDays(TODAY, 120), clientId: cid, history: [] };
        S.vehicles[pl] = v;
      }
      var svc = f.service.value, date = mode === 'walk' ? TODAY : f.date.value || TODAY;
      var j = { id: 'n' + Date.now(), plate: v.plate, clientId: cid, service: svc, status: date === TODAY ? 'new' : 'booked', date: date, time: mode === 'walk' ? null : f.time.value, estHours: U.hoursOf(svc),
        mechanic: null, ramp: null, onRamp: false, walkIn: mode === 'walk', fitIn: false, noCharge: false, arrivedAt: mode === 'walk' ? now() : null, deliveredAt: null,
        mileage: v.mileage, problem: f.problem.value.trim() || 'No details given.', createdAt: TODAY, items: [], parts: [], notes: [], officeNotes: [], invoiceIds: [] };
      d.close();
      if (date === TODAY) { S.jobs.push(j); S.flash = j.id; S.mobileCol = 'new'; } else { S.upcoming.push(j); S.upcoming.sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); }); }
      var c = S.clients[cid];
      if (c.email && mode !== 'walk') S.outbox.unshift({ id: 'm-b-' + j.id, kind: 'booking', to: c.email, subject: 'You’re booked in: ' + j.plate + ' on ' + fmtDay(date), at: now(), status: 'Delivered', jobId: j.id });
      if (route.name !== 'board' && date === TODAY) location.hash = '#/board'; else commit();
      var m = mode === 'walk' ? j.plate + ' checked in as a walk-in' : j.plate + ' booked for ' + fmtDay(date) + ' at ' + j.time;
      toast(esc(m)); announce(m);
    });
  }

  // ---- Mobile drawer ---------------------------------------------------------
  var drawerScrim = null;
  function openDrawer() {
    var side = document.getElementById('side');
    side.classList.add('is-open');
    drawerScrim = document.createElement('div'); drawerScrim.className = 'side-scrim';
    drawerScrim.addEventListener('click', closeDrawer);
    document.body.appendChild(drawerScrim);
    var first = side.querySelector('a, button'); if (first) first.focus();
    document.addEventListener('keydown', drawerKey, true);
  }
  function drawerKey(e) {
    var side = document.getElementById('side');
    if (e.key === 'Escape') { closeDrawer(); var b = document.querySelector('[data-action="open-drawer"]'); if (b) b.focus(); }
    if (e.key === 'Tab') { var f = focusables(side); if (!f.length) return; if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); } }
  }
  function closeDrawer() {
    var side = document.getElementById('side');
    if (!side.classList.contains('is-open')) return;
    side.classList.remove('is-open');
    if (drawerScrim) drawerScrim.remove();
    drawerScrim = null;
    document.removeEventListener('keydown', drawerKey, true);
  }

  // ---- Actions ---------------------------------------------------------------
  var actions = {
    'arrived': function (b) { markArrived(job(b.dataset.id)); },
    'move-menu': function (b) { openMoveMenu(b); },
    'show-col': function (b) {
      S.mobileCol = b.dataset.col; try { localStorage.setItem('liftbay.board.col', S.mobileCol); } catch (e) { /* ignore */ }
      commit();
      var t = document.getElementById('tab-' + S.mobileCol), sw = document.querySelector('.col-switch');
      if (t) { t.focus({ preventScroll: true }); sw.scrollTo({ left: t.offsetLeft - (sw.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' }); }
      var sec = document.querySelector('section[aria-labelledby="board-h"]');
      if (sec) { var top = sec.getBoundingClientRect().top + window.scrollY - 64; if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' }); }
    },
    'reschedule': function (b) { openReschedule(job(b.dataset.id)); },
    'fit-in': function (b) {
      var j = job(b.dataset.id);
      S.upcoming.splice(S.upcoming.indexOf(j), 1);
      j.status = 'new'; j.fitIn = true; j.walkIn = true; j.bookedFor = j.date + ' ' + j.time; j.date = TODAY; j.time = null; j.arrivedAt = now();
      S.jobs.push(j); S.flash = j.id; S.mobileCol = 'new';
      location.hash = '#/board';
      var m = j.plate + ' fitted in today. It’s in Arriving, waiting for a ramp.';
      toast(esc(m)); announce(m);
    },
    'no-show': function (b) {
      var j = job(b.dataset.id), c = cli(j);
      confirmDialog({ title: 'Mark ' + j.plate + ' as a no-show?', text: c.name + ' was booked for ' + j.time + ' and hasn’t turned up. It’s noted on their record.', ok: 'Mark as no-show', onOk: function () {
        j.status = 'no_show'; c.noShows = (c.noShows || 0) + 1;
        if (route.name === 'job') location.hash = '#/board'; else commit();
        toast(esc(j.plate) + ' marked as a no-show'); announce(j.plate + ' marked as a no-show');
      } });
    },
    'cancel-booking': function (b) {
      var j = job(b.dataset.id);
      confirmDialog({ title: 'Cancel ' + j.plate + '’s booking?', text: 'It comes off today’s board. You can book it in again any time.', ok: 'Cancel booking', cancel: 'Keep it', onOk: function () {
        j.status = 'cancelled';
        if (route.name === 'job') location.hash = '#/board'; else commit();
        toast(esc(j.plate) + '’s booking cancelled');
      } });
    },
    'pay': function (b) { openPayDialog(job(b.dataset.id), false); },
    'deliver': function (b) { var j = job(b.dataset.id); deliver(j); },
    'handover-terms': function (b) { openTermsDialog(job(b.dataset.id)); },
    'set-price': function (b) { S.priceEdit = b.dataset.line; commit(); },
    'cancel-price': function () { var id = S.priceEdit; S.priceEdit = null; commit(); var b = document.querySelector('[data-fk="price-' + id + '"]'); if (b) b.focus(); },
    'remove-line': function (b) { var j = job(route.param); j.items = j.items.filter(function (l) { return l.id !== b.dataset.line; }); commit(); toast('Line removed'); },
    'toggle-add-line': function () { S.addLine = !S.addLine; commit(); if (S.addLine) { var t = document.querySelector('[data-form="line"] [name="title"]'); if (t) t.focus(); } },
    'toggle-add-part': function () { S.addPart = !S.addPart; commit(); if (S.addPart) { var t = document.querySelector('[data-form="part"] [name="name"]'); if (t) t.focus(); } },
    'part-next': function (b) {
      var j = job(route.param), p = j.parts.find(function (x) { return x.id === b.dataset.part; });
      p.status = p.status === 'requested' ? 'ordered' : 'arrived';
      if (p.status === 'ordered') { p.eta = fmtDay(U.addDays(TODAY, 1)); p.note = (p.note ? p.note + ' · ' : '') + 'Ordered, due ' + p.eta; }
      if (p.status === 'arrived' && j.status === 'waiting_parts' && !partsWaiting(j)) j.waitReason = 'Parts arrived';
      commit(); toast(esc(p.name) + (p.status === 'ordered' ? ' ordered' : ' arrived'));
    },
    'create-invoice': function (b) { createInvoice(job(b.dataset.id)); },
    'send-invoice': function (b) { sendInvoice(invoice(b.dataset.inv)); },
    'preview-invoice': function (b) { var i = invoice(b.dataset.inv); previewInvoice(i, job(i.jobId), false); },
    'preview-draft': function (b) { previewInvoice(null, job(b.dataset.id), true); },
    'new-booking': function () { closeDrawer(); openNewBooking(false); },
    'walk-in': function () { openNewBooking(true); },
    'open-drawer': function () { openDrawer(); },
    'logout': function () { toast('This is a demo, so there’s nowhere to log out to.'); },
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-action]');
    if (!a || a.disabled) return;
    var fn = actions[a.dataset.action] || (window.LB.actions || {})[a.dataset.action];
    if (fn) { e.preventDefault(); fn(a, e); }
  });

  var forms = {
    price: function (f) {
      var j = job(route.param), l = j.items.find(function (x) { return x.id === f.dataset.line; });
      var n = parseFloat(f.cost.value.replace(/[£,\s]/g, ''));
      if (!(n > 0)) { f.cost.focus(); f.cost.setAttribute('aria-invalid', 'true'); return; }
      l.cost = U.round2(n); l.markup = Number(f.markup.value); l.needsPrice = false;
      S.priceEdit = null;
      commit();
      var m = esc(l.title) + ' priced at ' + money(U.unitPrice(l)) + ' each';
      toast(m); announce(l.title + ' priced');
      var c = document.querySelector('[data-fk="create-inv"]'); if (c && !c.disabled && kbd) c.focus({ preventScroll: true });
    },
    line: function (f) {
      var j = job(route.param), cost = f.cost.value.trim() ? parseFloat(f.cost.value.replace(/[£,\s]/g, '')) : null;
      if (!f.title.value.trim()) { f.title.focus(); return; }
      j.items.push({ id: 'l' + Date.now(), title: f.title.value.trim(), cat: f.cat.value, qty: Math.max(1, Number(f.qty.value) || 1), cost: cost > 0 ? cost : null, markup: f.cat.value === 'part' ? Number(f.markup.value) : 0, invoiceId: null, needsPrice: !(cost > 0), addedBy: 'ruth' });
      S.addLine = false; commit(); toast('Line added');
    },
    part: function (f) {
      var j = job(route.param);
      if (!f.name.value.trim()) { f.name.focus(); return; }
      j.parts.push({ id: 'p' + Date.now(), name: f.name.value.trim(), qty: Math.max(1, Number(f.qty.value) || 1), note: f.note.value.trim(), status: 'requested', requestedBy: 'ruth', at: now() });
      S.addPart = false; commit(); toast('Part requested. It shows on the board until it’s ordered.');
    },
    note: function (f) { var t = f.text.value.trim(); if (!t) return; job(route.param).notes.push({ by: 'ruth', at: now(), text: t }); commit(); toast('Note added'); },
    'office-note': function (f) { var t = f.text.value.trim(); if (!t) return; job(route.param).officeNotes.push({ by: 'ruth', at: now(), text: t }); commit(); toast('Office note added'); },
  };
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t.dataset || !t.dataset.nocharge) return;
    var j = job(t.dataset.nocharge);
    j.noCharge = t.checked;
    commit();
    var m = j.plate + (j.noCharge ? ' marked as no charge. It won’t need an invoice.' : ' will be invoiced as normal.');
    toast(esc(m)); announce(m);
  });
  document.addEventListener('submit', function (e) {
    var f = e.target, fn = forms[f.dataset.form] || (window.LB.forms || {})[f.dataset.form];
    if (fn) { e.preventDefault(); fn(f); }
  });

  // Keep the clock and ramp timers moving without re-rendering the board.
  setInterval(function () {
    document.querySelectorAll('[data-clock]').forEach(function (el) { el.textContent = fmtLong(TODAY) + ' · ' + U.hm(nowMin()); });
    document.querySelectorAll('[data-elapsed]').forEach(function (el) { var j = job(el.dataset.elapsed); if (j) el.textContent = durTxt(elapsed(j)); });
  }, rate > 1 ? 2000 : 15000);

  // ---- Public bits for screens.js and tour.js ---------------------------------
  window.LB = {
    S: S, D: D, U: U, views: views, actions: {}, forms: {}, COLS: COLS,
    esc: esc, money: money, money0: money0, plural: plural, icon: icon, plate: plate, avatar: avatar, person: person, initials: initials,
    fmtDate: fmtDate, fmtDay: fmtDay, fmtLong: fmtLong, fmtTime: fmtTime, fmtWhen: fmtWhen, hoursTxt: hoursTxt, dateOf: dateOf, MONTHS: MONTHS, DAYS: DAYS,
    job: job, veh: veh, cli: cli, carName: carName, invoice: invoice, invoicesOf: invoicesOf, unpaidOf: unpaidOf, needsInvoice: needsInvoice, onBoard: onBoard,
    commit: commit, toast: toast, clearToasts: clearToasts, halves: halves, announce: announce, openDialog: openDialog, confirmDialog: confirmDialog, previewInvoice: previewInvoice, openPayDialog: openPayDialog,
    now: now, nowMin: nowMin, requestMove: requestMove, route: function () { return route; },
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('hashchange', go);
    go();
  });
})();
