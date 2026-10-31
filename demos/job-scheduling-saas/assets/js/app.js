/*
 * Stampwell demo: store, shell, router, Today and Schedule.
 * Other screens live in screens.js and register themselves with App.screen().
 */
(function () {
  'use strict';

  var D = window.StampwellData;
  var TOUR = !!(window.HiconTour && window.HiconTour.active);
  var SPEED = TOUR ? Math.max(0.25, Math.min(4, Number(new URLSearchParams(location.search).get('speed')) || 1)) : 1;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DAY_START = 7 * 60 + 30, DAY_END = 17 * 60 + 30, SPAN = DAY_END - DAY_START;
  var YARD = { x: 0.2, y: -0.4 };

  // ---------------------------------------------------------------- utils
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(p, opts) {
    var neg = p < 0; p = Math.abs(Math.round(p));
    var s = (p / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (opts && opts.round && s.slice(-3) === '.00') s = s.slice(0, -3);
    return (neg ? '−' : '') + '£' + s;
  }
  function t2(min) { return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); }
  function range(a, b) { return t2(a) + '–' + t2(b); }
  function dur(m) { var h = Math.floor(m / 60), r = m % 60; return h ? h + ' h' + (r ? ' ' + r + ' min' : '') : r + ' min'; }
  function hoursText(h) { return (Math.round(h * 100) / 100).toString(); }
  function dObj(iso) { return new Date(iso + 'T12:00:00Z'); }
  function fmtDate(iso, style) {
    var d = dObj(iso), day = d.getUTCDate(), m = d.getUTCMonth(), wd = d.getUTCDay();
    if (style === 'long') return DAYS[wd] + ' ' + day + ' ' + MONTHS[m];
    if (style === 'wd') return DAYS[wd].slice(0, 3) + ' ' + day + ' ' + MONTHS[m].slice(0, 3);
    if (style === 'full') return day + ' ' + MONTHS[m].slice(0, 3) + ' ' + d.getUTCFullYear();
    if (style === 'day') return DAYS[wd];
    return day + ' ' + MONTHS[m].slice(0, 3);
  }
  function relDay(iso) {
    if (iso === D.TODAY) return 'Today';
    if (iso === D.addDays(D.TODAY, 1)) return 'Tomorrow';
    if (iso === D.addDays(D.TODAY, -1)) return 'Yesterday';
    return fmtDate(iso, 'wd');
  }
  function icon(name, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function miles(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function milesText(m) { if (m < 0.75) return 'under a mile'; var r = Math.round(m); return r + (r === 1 ? ' mile' : ' miles'); }
  function poss(n) { return n + (/s$/.test(n) ? '’' : '’s'); }
  function atPlace(c) { return c.company ? c.short : poss(c.short); }
  function lcFirst(t) { return t.charAt(0).toLowerCase() + t.slice(1); }
  function travelMins(m) { return Math.round(4 + m * 3.2); }
  function pct(min) { return ((min - DAY_START) / SPAN * 100).toFixed(3) + '%'; }
  function wpct(m) { return (m / SPAN * 100).toFixed(3) + '%'; }

  // ---------------------------------------------------------------- store
  var S = {
    t0: Date.now(), base: null, seq: 0,
    teamById: {}, clients: {}, jobs: {}, entries: [], tray: [], sheets: [], invoices: [], quotes: [], activity: [],
    scheduleDay: D.TODAY, mobilePerson: 'dan', changed: {}, booked: [], absences: [],
  };
  var counters = {};
  function nextRef(prefix, iso) {
    var d = iso.replace(/-/g, ''), k = prefix + d;
    counters[k] = (counters[k] || 0) + 1;
    return prefix + '-' + d + '-' + String(counters[k]).padStart(3, '0');
  }
  function now() {
    var step = TOUR ? 3000 / SPEED : 60000;
    return D.NOW + Math.floor((Date.now() - S.t0) / step);
  }

  D.team.forEach(function (t) { S.teamById[t.id] = t; });
  D.clients.forEach(function (c) { S.clients[c.id] = c; });

  Object.keys(D.jobsSeed).forEach(function (key) {
    var s = D.jobsSeed[key];
    var job = Object.assign({ id: key, status: 'SCHEDULED', crew: [], lead: null, log: [] }, s);
    job.ref = nextRef('JOB', s.created);
    S.jobs[key] = job;
  });
  D.diary.forEach(function (r, i) {
    S.entries.push({ id: 'e' + i, person: r[0], day: r[1], start: D.hm(r[2]), end: D.hm(r[3]), job: r[4] });
    var job = S.jobs[r[4]];
    if (job.crew.indexOf(r[0]) < 0) job.crew.push(r[0]);
    if (!job.mins) job.mins = D.hm(r[3]) - D.hm(r[2]);
  });
  Object.keys(S.jobs).forEach(function (k) {
    var job = S.jobs[k];
    job.lead = D.leads[k] || job.crew[0] || null;
    if (D.todayStatus[k]) job.status = D.todayStatus[k];
  });
  D.tray.forEach(function (t) {
    var job = Object.assign({ id: t.key, status: 'PENDING', crew: [], lead: null, log: [] }, t);
    job.ref = nextRef('JOB', t.created);
    S.jobs[t.key] = job;
    S.tray.push(t.key);
  });
  D.sheets.forEach(function (s) {
    var sh = JSON.parse(JSON.stringify(s));
    S.sheets.push(sh);
    if (sh.job) {
      var job = S.jobs[sh.job];
      job.sheetNo = sh.no;
      if (sh.status === 'COMPLETED') job.status = 'COMPLETED';
      if (sh.status === 'APPROVED') job.status = 'READY_TO_INVOICE';
    }
  });
  D.invoices.forEach(function (v, i) {
    var inv = JSON.parse(JSON.stringify(v));
    var m = inv.ref.match(/INV-(\d{8})-(\d{3})/);
    counters['INV' + m[1]] = Math.max(counters['INV' + m[1]] || 0, +m[2]);
    inv.lines.forEach(function (l) { if (/^Labour/.test(l.d)) l.unit = 'h'; });
    inv.payments = inv.status === 'PAID' ? [{ date: inv.paid, amount: invTotals(inv).gross, method: inv.method, at: inv.paidAt }] : [];
    inv.amountPaid = inv.payments.reduce(function (a, p) { return a + p.amount; }, 0);
    var key;
    if (/^Combi/.test(inv.title)) key = 'okoroCombi';
    else if (/^Bathroom refit/.test(inv.title)) key = 'grantBathroom';
    else {
      key = 'h' + i;
      S.jobs[key] = { id: key, ref: nextRef('JOB', inv.issued), title: inv.title, client: inv.client, type: /gas/i.test(inv.title) ? 'gas' : /tap|leak|cistern/i.test(inv.title) ? 'plumbing' : 'heating', status: inv.status === 'PAID' ? 'PAID' : 'INVOICED', crew: [inv.worker], lead: inv.worker, created: inv.issued, done: inv.issued, log: [], history: true };
      S.jobs[key].invoiceRef = inv.ref;
    }
    inv.job = key;
    S.invoices.push(inv);
  });
  // This week's invoiced work also sits on the schedule, so Monday to Wednesday look like real days.
  S.invoices.forEach(function (inv) {
    if (inv.issued < '2026-11-02' || !/^h/.test(inv.job)) return;
    var job = S.jobs[inv.job], who = inv.worker;
    var hrs = 0;
    inv.lines.forEach(function (l) { if (/^Labour/.test(l.d)) hrs += l.q; });
    var len = Math.max(60, Math.round((hrs || 1.25) * 4) * 15);
    if (/^Power flush/.test(inv.title)) len = 330;
    else if (/^Unvented/.test(inv.title)) len = 90;
    else if (/gas safety/i.test(inv.title)) len = 45 + 30 * inv.lines[0].q;
    var taken = S.entries.filter(function (e) { return e.person === who && e.day === inv.issued; });
    for (var st = 8 * 60; st + len <= 17 * 60; st += 15) {
      var free = taken.every(function (e) { return st + len + 15 <= e.start || st >= e.end + 15; });
      if (free) { S.entries.push({ id: 'p' + inv.ref, person: who, day: inv.issued, start: st, end: st + len, job: job.id }); job.mins = len; break; }
    }
  });
  S.absences = D.absences.map(function (a) { return { person: a.person, day: a.day, start: D.hm(a.start), end: D.hm(a.end), label: a.label, note: a.note }; });
  S.quotes = D.quotes.slice();
  S.activity = D.activity.map(function (a) { return Object.assign({}, a); });

  // ---------------------------------------------------------------- money maths
  function invTotals(inv) {
    var net = 0;
    inv.lines.forEach(function (l) { net += Math.round(l.q * l.u); });
    var vat = Math.round(net * 0.2);
    return { net: net, vat: vat, gross: net + vat };
  }
  function labourHours(l) { return (D.hm(l.to) - D.hm(l.from) - (l.brk || 0)) / 60; }
  function sheetTotals(sh) {
    var parts = 0, labour = 0, fixed = 0;
    (sh.parts || []).forEach(function (p) { parts += p[1] * p[2]; });
    (sh.fixed || []).forEach(function (p) { fixed += p[1] * p[2]; });
    if (!sh.fixed) (sh.labour || []).forEach(function (l) { labour += Math.round(labourHours(l) * S.teamById[l.id].rate); });
    var net = parts + labour + fixed, vat = Math.round(net * 0.2);
    var onSite = 0;
    (sh.labour || []).forEach(function (l) { onSite = Math.max(onSite, D.hm(l.to) - D.hm(l.from)); });
    return { parts: parts, labour: labour, fixed: fixed, net: net, vat: vat, gross: net + vat, onSite: onSite };
  }
  function invStatus(inv) {
    if ((inv.status === 'SENT' || inv.status === 'PARTIAL') && inv.due < D.TODAY) return 'OVERDUE';
    return inv.status;
  }
  function outstanding(inv) { return invTotals(inv).gross - (inv.amountPaid || 0); }
  function jobValue(job) {
    if (job.invoiceRef) { var inv = findInvoice(job.invoiceRef); if (inv) return invTotals(inv).gross; }
    if (job.sheetNo) { var sh = findSheet(job.sheetNo); if (sh) return sheetTotals(sh).gross; }
    return job.est || 0;
  }
  function findInvoice(ref) { return S.invoices.find(function (v) { return v.ref === ref; }); }
  function findSheet(no) { return S.sheets.find(function (s) { return s.no === no; }); }
  function entriesFor(person, day) {
    return S.entries.filter(function (e) { return e.person === person && e.day === day; }).sort(function (a, b) { return a.start - b.start; });
  }

  function kpis() {
    var todays = S.entries.filter(function (e) { return e.day === D.TODAY; });
    var jobsToday = {}, people = {};
    todays.forEach(function (e) { jobsToday[e.job] = 1; people[e.person] = 1; });
    var ready = Object.keys(S.jobs).map(function (k) { return S.jobs[k]; }).filter(function (j) { return j.status === 'READY_TO_INVOICE'; });
    var waiting = S.invoices.filter(function (v) { return v.status === 'SENT' || v.status === 'PARTIAL'; });
    var overdue = waiting.filter(function (v) { return invStatus(v) === 'OVERDUE'; });
    var pays = [];
    S.invoices.forEach(function (v) { (v.payments || []).forEach(function (p) { if (p.date >= '2026-11-01') pays.push(p); }); });
    var byDay = [0, 0, 0, 0, 0];
    pays.forEach(function (p) { var wd = D.weekday(p.date); if (wd >= 1 && wd <= 5) byDay[wd - 1] += p.amount; });
    return {
      jobsToday: Object.keys(jobsToday).length, peopleOut: Object.keys(people).length,
      sheets: S.sheets.filter(function (s) { return s.status === 'COMPLETED'; }).length,
      approvedToday: S.sheets.filter(function (s) { return s.approvedToday; }).length,
      readyCount: ready.length, ready: ready.reduce(function (a, j) { return a + jobValue(j); }, 0),
      waitingCount: waiting.length, waiting: waiting.reduce(function (a, v) { return a + outstanding(v); }, 0),
      overdueCount: overdue.length, overdue: overdue.reduce(function (a, v) { return a + outstanding(v); }, 0),
      paidNov: pays.reduce(function (a, p) { return a + p.amount; }, 0),
      paidToday: pays.filter(function (p) { return p.date === D.TODAY; }).reduce(function (a, p) { return a + p.amount; }, 0),
      paidByDay: byDay, tray: S.tray.length,
    };
  }

  function log(who, text, kind) {
    S.activity.push({ t: t2(now()), who: who, text: text, kind: kind });
  }

  // ---------------------------------------------------------------- UI bits
  function avatar(id, cls) {
    var t = S.teamById[id];
    if (!t) return '';
    return '<span class="avatar avatar--' + id + (cls ? ' ' + cls : '') + '" title="' + esc(t.name) + '">' + t.initials + '</span>';
  }
  var STATUS = {
    PENDING: ['To schedule', 'pending'], SCHEDULED: ['Booked', 'booked'], IN_PROGRESS: ['On site', 'live'],
    COMPLETED: ['Sheet to check', 'check'], READY_TO_INVOICE: ['Ready to invoice', 'ready'], INVOICED: ['Invoiced', 'invoiced'],
    PAID: ['Paid', 'paid'], CANCELLED: ['Cancelled', 'muted'], ON_HOLD: ['On hold', 'muted'],
    DRAFT: ['Draft', 'muted'], SENT: ['Sent', 'invoiced'], OVERDUE: ['Overdue', 'overdue'], PARTIAL: ['Part paid', 'ready'],
    APPROVED: ['Approved', 'paid'], REJECTED: ['Sent back', 'overdue'], SHEET_BACK: ['Sheet sent back', 'overdue'],
    VIEWED: ['Viewed', 'ready'], ACCEPTED: ['Accepted', 'paid'], CONVERTED: ['Turned into a job', 'booked'], EXPIRED: ['Expired', 'muted'],
  };
  function pill(status, label) {
    var s = STATUS[status] || [status, 'muted'];
    return '<span class="pill pill--' + s[1] + '">' + esc(label || s[0]) + '</span>';
  }
  function clientName(id) { return S.clients[id] ? S.clients[id].name : ''; }

  var toastBox;
  function toast(text, kind) {
    toastBox = toastBox || document.getElementById('toasts');
    // One message at a time: the newest replaces the last.
    Array.prototype.forEach.call(toastBox.querySelectorAll('.toast'), function (old) { old.classList.remove('is-on'); setTimeout(function () { old.remove(); }, 250); });
    var t = document.createElement('div');
    t.className = 'toast' + (kind ? ' toast--' + kind : '');
    t.innerHTML = icon(kind === 'warn' ? 'alert' : 'check') + '<span>' + text + '</span>';
    toastBox.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('is-on'); });
    setTimeout(function () { t.classList.remove('is-on'); setTimeout(function () { t.remove(); }, 320); }, TOUR ? 3000 / SPEED : 4600);
  }

  // Native <dialog>: focus stays inside, Escape closes.
  function openDialog(opts) {
    var box = document.getElementById('dialogs');
    var dlg = document.createElement('dialog');
    dlg.className = 'dlg ' + (opts.className || '');
    dlg.setAttribute('aria-labelledby', 'dlg-title-' + (++S.seq));
    dlg.innerHTML = (opts.bare ? '' : '<header class="dlg__head"><h2 class="dlg__title" id="dlg-title-' + S.seq + '">' + opts.title + '</h2>' +
      '<button class="iconbtn dlg__close" type="button" data-close aria-label="Close">' + icon('x') + '</button></header>') + opts.body;
    if (opts.bare) dlg.querySelector('[data-dlg-title]') && dlg.querySelector('[data-dlg-title]').setAttribute('id', 'dlg-title-' + S.seq);
    box.appendChild(dlg);
    var closed = false;
    function close(result) {
      if (closed) return; closed = true;
      dlg.classList.add('is-closing');
      setTimeout(function () { if (dlg.open) dlg.close(); dlg.remove(); }, reduce ? 0 : 160);
      if (result === 'cancel' && opts.onCancel) opts.onCancel();
    }
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close('cancel'); });
    dlg.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close('cancel');
      else if (e.target === dlg && !opts.anchor) close('cancel');
    });
    dlg.showModal();
    if (opts.mount) opts.mount(dlg, close);
    var first = dlg.querySelector('[autofocus]') || dlg.querySelector('button:not([data-close]), input, select, textarea');
    if (first) first.focus();
    return { el: dlg, close: close };
  }

  // ---------------------------------------------------------------- router
  var screens = {};
  var main;
  function parse() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    return { name: parts[0] || 'today', arg: parts[1] ? decodeURIComponent(parts[1]) : null };
  }
  var current = null;
  function render(keepScroll) {
    var r = parse();
    var sc = screens[r.name] || screens.today;
    if (!screens[r.name]) r.name = 'today';
    var y = window.scrollY;
    main.innerHTML = sc.render(r.arg);
    main.setAttribute('data-screen', r.name);
    document.title = (typeof sc.title === 'function' ? sc.title(r.arg) : sc.title) + ' · Stampwell';
    if (sc.mount) sc.mount(r.arg);
    renderNav(r.name);
    renderClock();
    if (keepScroll) window.scrollTo(0, y);
    current = r;
  }
  function refresh() { render(true); }
  function go(hash) {
    if (location.hash === hash) refresh();
    else location.hash = hash;
  }
  window.addEventListener('hashchange', function () {
    render(false);
    window.scrollTo(0, 0);
    if (!TOUR) main.focus({ preventScroll: true });
  });

  var NAV = [
    { id: 'today', label: 'Today', icon: 'today', tab: true },
    { id: 'schedule', label: 'Schedule', icon: 'schedule', tab: true },
    { id: 'jobs', label: 'Jobs', icon: 'jobs' },
    { id: 'sheets', label: 'Job sheets', short: 'Sheets', icon: 'sheets', tab: true, badge: function (k) { return k.sheets; } },
    { id: 'quotes', label: 'Quotes', icon: 'quotes' },
    { id: 'invoices', label: 'Invoices', icon: 'invoices', tab: true, badge: function (k) { return k.overdueCount; }, warn: true },
    { id: 'clients', label: 'Clients', icon: 'clients' },
    { id: 'reports', label: 'Reports', icon: 'reports' },
  ];
  function renderNav(active) {
    var k = kpis();
    var list = document.getElementById('nav-list');
    list.innerHTML = NAV.map(function (n) {
      var b = n.badge ? n.badge(k) : 0;
      return '<li><a class="nav__a' + (n.id === active ? ' is-active' : '') + '" href="#/' + n.id + '" data-nav="' + n.id + '"' + (n.id === active ? ' aria-current="page"' : '') + '>' +
        n.label + (b ? '<span class="badge' + (n.warn ? ' badge--warn' : '') + '" aria-label="' + b + (n.warn ? ' overdue' : ' to check') + '">' + b + '</span>' : '') + '</a></li>';
    }).join('');
    var tabs = document.getElementById('tab-list');
    var inMore = NAV.filter(function (n) { return !n.tab; }).some(function (n) { return n.id === active; });
    tabs.innerHTML = NAV.filter(function (n) { return n.tab; }).map(function (n) {
      var b = n.badge ? n.badge(k) : 0;
      return '<li><a class="tab' + (n.id === active ? ' is-active' : '') + '" href="#/' + n.id + '"' + (n.id === active ? ' aria-current="page"' : '') + '>' + icon(n.icon) +
        '<span>' + (n.short || n.label) + '</span>' + (b ? '<span class="badge' + (n.warn ? ' badge--warn' : '') + '">' + b + '</span>' : '') + '</a></li>';
    }).join('') + '<li><button class="tab' + (inMore ? ' is-active' : '') + '" type="button" data-action="more">' + icon('more') + '<span>More</span></button></li>';
  }
  function renderClock() {
    var el = document.getElementById('clock');
    if (el) el.textContent = fmtDate(D.TODAY, 'wd') + ' · ' + t2(now());
  }
  setInterval(function () {
    renderClock();
    var line = document.querySelectorAll('[data-nowline]');
    for (var i = 0; i < line.length; i++) line[i].style.left = pct(now());
  }, 5000);

  // ---------------------------------------------------------------- actions (delegated)
  var actions = {};
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-action]');
    if (!a || a.disabled) return;
    var fn = actions[a.getAttribute('data-action')];
    if (fn) { e.preventDefault(); fn(a, e); }
  });

  actions.more = function () {
    var items = NAV.filter(function (n) { return !n.tab; });
    var d = openDialog({
      title: 'More', className: 'dlg--sheet',
      body: '<ul class="morelist">' + items.map(function (n) { return '<li><a href="#/' + n.id + '" data-go>' + icon(n.icon) + '<span>' + n.label + '</span>' + icon('chev', 'i--end') + '</a></li>'; }).join('') +
        '<li><button type="button" data-action="new-job" data-go>' + icon('plus') + '<span>New job</span>' + icon('chev', 'i--end') + '</button></li></ul>',
      mount: function (dlg, close) { dlg.addEventListener('click', function (e) { if (e.target.closest('[data-go]')) close(); }); },
    });
    return d;
  };

  actions['new-job'] = function () {
    var opts = D.clients.slice().sort(function (a, b) { return a.name < b.name ? -1 : 1; }).map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + ' (' + esc(c.area) + ')</option>'; }).join('');
    openDialog({
      title: 'New job',
      body: '<form class="form" id="newjob-form">' +
        '<label class="field"><span>What’s the job?</span><input name="title" required placeholder="For example: radiator not heating up" autocomplete="off"></label>' +
        '<label class="field"><span>Client</span><select name="client">' + opts + '</select></label>' +
        '<div class="field-row"><label class="field"><span>Roughly how long?</span><select name="mins"><option value="45">45 min</option><option value="60" selected>1 h</option><option value="90">1 h 30 min</option><option value="120">2 h</option><option value="180">3 h</option><option value="240">4 h</option></select></label></div>' +
        '<label class="check"><input type="checkbox" name="gas"><span>Needs a Gas Safe engineer</span></label>' +
        '<label class="check"><input type="checkbox" name="urgent"><span>Urgent: put it at the top</span></label>' +
        '<label class="field"><span>Notes for the engineer <em>(optional)</em></span><textarea name="note" rows="2"></textarea></label>' +
        '<div class="dlg__foot"><button type="button" class="btn btn--ghost" data-close>Cancel</button><button class="btn btn--primary" type="submit">' + icon('plus') + 'Add to To schedule</button></div></form>',
      mount: function (dlg, close) {
        dlg.querySelector('form').addEventListener('submit', function (e) {
          e.preventDefault();
          var f = new FormData(e.target);
          var key = 'n' + (++S.seq);
          var job = { id: key, title: String(f.get('title')).trim() || 'New job', client: f.get('client'), type: f.get('gas') ? 'heating' : 'plumbing', gas: !!f.get('gas'), urgent: !!f.get('urgent'), mins: +f.get('mins'), note: String(f.get('note') || ''), created: D.TODAY, est: 0, status: 'PENDING', crew: [], lead: null, log: [] };
          job.ref = nextRef('JOB', D.TODAY);
          S.jobs[key] = job;
          if (job.urgent) S.tray.unshift(key); else S.tray.push(key);
          log(null, 'New job for ' + clientName(job.client) + ': ' + job.title);
          close();
          toast('Added ' + esc(job.ref) + ' to To schedule');
          go('#/schedule');
        });
      },
    });
  };

  // ---------------------------------------------------------------- shared lane rendering
  function entryState(e) {
    var job = S.jobs[e.job];
    var t = now();
    if (e.pending) return 'pending';
    if (e.day < D.TODAY) return 'done';
    if (e.day > D.TODAY) return 'booked';
    if (['COMPLETED', 'SHEET_BACK', 'READY_TO_INVOICE', 'INVOICED', 'PAID'].indexOf(job.status) >= 0) return 'done';
    if (job.status === 'IN_PROGRESS' && e.start <= t) return 'live';
    if (e.start < t - 10) return 'late';
    return 'booked';
  }
  var STATE_LABEL = { done: 'Done', live: 'On site now', booked: 'Booked', late: 'Running late', pending: 'Not confirmed' };

  function overlaps(e, list) {
    return list.filter(function (o) { return o !== e && o.start < e.end && e.start < o.end; });
  }

  // Multi-day jobs say which day it is: "Bathroom refit (day 4 of 5)".
  function jobTitleOn(job, day) {
    if (!job.days) return job.title;
    var days = [];
    S.entries.forEach(function (x) { if (x.job === job.id && days.indexOf(x.day) < 0) days.push(x.day); });
    days.sort();
    return job.title + ' (day ' + (days.indexOf(day) + 1) + ' of ' + job.days + ')';
  }

  // The shortest name that still says who: "Whitlock", "Mehtas", "Old Dairy".
  function clientTag(c) {
    var n = c.short.replace(/^(Mr|Mrs|Ms|the) /, '');
    if (c.company) return n.length <= 10 ? n : n.split(' ')[0];
    return /^(Mr|Mrs|Ms|the) /.test(c.short) ? n : n.split(' ').slice(-1)[0];
  }

  function blockHTML(e, compact) {
    var job = S.jobs[e.job], c = S.clients[job.client];
    var st = entryState(e);
    var lead = job.lead && job.lead !== e.person ? S.teamById[job.lead] : null;
    var mins = e.end - e.start;
    var cls = 'blk blk--' + job.type + ' is-' + st + (lead ? ' is-crew' : '') + (job.urgent ? ' is-urgent' : '') + (e.forced ? ' is-forced' : '') + (mins < 70 ? ' is-short' : '');
    var title = jobTitleOn(job, e.day);
    var label = range(e.start, e.end) + ', ' + title + ', ' + c.short + ', ' + c.area + '. ' + STATE_LABEL[st] + (lead ? ', with ' + lead.first : '');
    var alt = '<span class="blk__alt" aria-hidden="true">' + (job.urgent ? '<b class="blk__urgent">Urgent</b> ' : '') + '<span class="blk__altname">' + esc(lead ? 'With ' + lead.first : compact ? clientTag(c) : c.short) + '</span></span>';
    var inner = compact
      ? '<span class="blk__title" aria-hidden="true">' + esc(title) + '</span>' + alt + '<span class="blk__mtime" aria-hidden="true">' + t2(e.start) + '</span>'
      : '<span class="blk__top" aria-hidden="true"><span class="blk__time">' + (mins < 60 ? t2(e.start) : range(e.start, e.end)) + '</span>' + (st === 'done' ? icon('check', 'blk__tick') : st === 'live' ? '<span class="blk__live" aria-hidden="true"></span>' : '') + '</span>' +
        '<span class="blk__title" aria-hidden="true">' + (job.urgent ? '<b class="blk__urgent">Urgent</b> ' : '') + esc(title) + '</span>' +
        '<span class="blk__where" aria-hidden="true">' + (lead ? 'With ' + esc(lead.first) + ' · ' : '') + esc(c.short) + ' · ' + esc(c.area) + '</span>' + alt;
    return '<a class="' + cls + '" draggable="false" href="#/jobs/' + job.id + '" data-entry="' + e.id + '" style="left:' + pct(e.start) + ';width:' + wpct(mins) + '" title="' + esc(title + ' · ' + c.name) + '"><span class="sr">' + esc(label) + '</span>' + inner + '</a>';
  }

  function trackHTML(person, day, compact) {
    var list = entriesFor(person, day);
    var html = '';
    // travel gaps
    if (!compact) {
      for (var i = 1; i < list.length; i++) {
        var a = list[i - 1], b = list[i];
        if (b.start - a.end >= 20 && !b.pending && !a.pending) {
          var m = travelMins(miles(S.clients[S.jobs[a.job].client], S.clients[S.jobs[b.job].client]));
          html += '<span class="gap" style="left:' + pct(a.end) + ';width:' + wpct(b.start - a.end) + '" aria-hidden="true"><span class="gap__line"></span>' + (b.start - a.end >= 45 ? '<span class="gap__t">' + icon('van') + m + ' min</span>' : '') + '</span>';
        }
      }
    }
    // clash zones
    list.forEach(function (e) {
      overlaps(e, list).forEach(function (o) {
        if (e.id < o.id || e.pending) {
          var s = Math.max(e.start, o.start), en = Math.min(e.end, o.end);
          html += '<span class="clashzone" style="left:' + pct(s) + ';width:' + wpct(en - s) + '" aria-hidden="true"></span>';
        }
      });
    });
    S.absences.forEach(function (a) {
      if (a.person !== person || a.day !== day) return;
      html += '<span class="away' + (compact ? ' away--mini' : '') + '" style="left:' + pct(a.start) + ';width:' + wpct(a.end - a.start) + '" title="' + esc(a.label + ': ' + a.note) + '">' +
        '<b>' + esc(a.label) + '</b>' + (compact ? '' : '<small>' + esc(range(a.start, a.end)) + ' · ' + esc(a.note) + '</small>') + '</span>';
    });
    list.forEach(function (e) { html += blockHTML(e, compact); });
    return html;
  }

  function rulerHTML(compact) {
    var html = '';
    for (var h = 8; h <= 17; h++) {
      var hideLabel = !compact && S.scheduleDay === D.TODAY && Math.abs(h * 60 - now()) < 26;
      html += '<span class="tick" style="left:' + pct(h * 60) + '"><span' + (hideLabel ? ' style="visibility:hidden"' : '') + '>' + (compact ? (h > 12 ? h - 12 : h) + (h >= 12 ? 'pm' : 'am') : t2(h * 60)) + '</span></span>';
      if (!compact && h < 17) html += '<span class="tick tick--half" style="left:' + pct(h * 60 + 30) + '"></span>';
    }
    return html;
  }

  function bookedMins(person, day) {
    return entriesFor(person, day).reduce(function (a, e) { return a + (e.end - e.start); }, 0);
  }

  // ---------------------------------------------------------------- Today
  function figure(id, label, value, foot, delta, extra) {
    return '<div class="fig' + (delta ? ' is-changed' : '') + '" data-fig="' + id + '">' +
      '<p class="fig__label">' + label + '</p>' +
      '<p class="fig__value" data-count="' + (extra && extra.count != null ? extra.count : '') + '">' + value + '</p>' +
      '<p class="fig__foot">' + foot + '</p>' + (delta ? '<p class="fig__delta">' + icon('check') + delta + '</p>' : '') +
      (extra && extra.after ? extra.after : '') + '</div>';
  }

  screens.today = {
    title: 'Today',
    render: function () {
      var k = kpis(), b = S.base;
      var hour = Math.floor(now() / 60);
      var greet = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      var trayUrgent = S.tray.filter(function (key) { return S.jobs[key].urgent; }).length;
      var sub = [k.peopleOut + ' out on the road'];
      if (trayUrgent) sub.push(trayUrgent + ' urgent call-out to place');
      sub.push(k.sheets ? k.sheets + ' job sheet' + (k.sheets === 1 ? '' : 's') + ' to check' : 'every job sheet checked');

      var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      var maxDay = Math.max.apply(null, k.paidByDay.concat([1]));
      var bars = '<div class="minibars" aria-hidden="true">' + k.paidByDay.slice(0, 4).map(function (v, i) {
        return '<span class="minibars__b' + (i === 3 ? ' is-today' : '') + '"><i style="height:' + Math.max(4, Math.round(v / maxDay * 100)) + '%"></i><em>' + days[i].charAt(0) + '</em></span>';
      }).join('') + '</div>';

      var figs = [
        figure('today', 'On today', k.jobsToday + '<small> jobs</small>', k.peopleOut + ' people out · ' + k.tray + ' to schedule', S.booked.length ? '+' + S.booked.length + ' booked since 10:12' : ''),
        figure('sheets', 'Job sheets to check', String(k.sheets), k.sheets ? 'From Tuesday and Wednesday' : 'All caught up', k.approvedToday ? k.approvedToday + ' approved today' : ''),
        figure('ready', 'Ready to invoice', money(k.ready), k.readyCount + ' job' + (k.readyCount === 1 ? '' : 's') + ' signed off', k.readyCount !== b.readyCount ? (k.readyCount > b.readyCount ? '+' : '') + (k.readyCount - b.readyCount) + ' since 10:12' : ''),
        figure('waiting', 'Waiting to be paid', money(k.waiting), k.waitingCount + ' invoices · <span class="t-warn">' + money(k.overdue) + ' overdue</span>', ''),
        figure('paid', 'Paid in November', '<span data-countup="' + k.paidNov + '" data-from="' + (S.changed.paidFrom != null ? S.changed.paidFrom : k.paidNov) + '">' + money(k.paidNov) + '</span>', money(k.paidToday) + ' paid today', k.paidNov > b.paidNov ? '+' + money(k.paidNov - b.paidNov) + ' since 10:12' : '', { after: bars }),
      ].join('');

      // Crew lanes (compact)
      var lanes = D.team.map(function (t) {
        var list = entriesFor(t.id, D.TODAY);
        var cur = list.filter(function (e) { return e.start <= now() && now() < e.end; })[0];
        var where = cur ? S.clients[S.jobs[cur.job].client].area : (list.filter(function (e) { return e.start > now(); })[0] ? 'On the way' : 'Free');
        return '<div class="mlane"><div class="mlane__head">' + avatar(t.id) + '<span class="mlane__name">' + esc(t.first) + '<small>' + esc(where) + '</small></span></div>' +
          '<div class="mlane__track">' + trackHTML(t.id, D.TODAY, true) + '</div></div>';
      }).join('');

      var toCheck = S.sheets.filter(function (s) { return s.status === 'COMPLETED'; });
      var checkRows = toCheck.length ? toCheck.map(function (s) {
        var job = S.jobs[s.job], tot = sheetTotals(s);
        return '<li><a class="checkrow" href="#/sheets/' + s.no + '"><span class="serial">No. ' + s.no + '</span>' +
          '<span class="checkrow__main"><b>' + esc(job.title) + '</b><small>' + esc(clientName(job.client)) + ' · ' + relDay(s.date) + '</small></span>' +
          '<span class="checkrow__crew">' + s.crew.map(function (c) { return avatar(c.id, 'avatar--sm'); }).join('') + '</span>' +
          '<span class="checkrow__val">' + money(tot.gross) + '</span>' + icon('chev', 'i--end') + '</a></li>';
      }).join('') : '<li class="empty">' + icon('check') + 'Nothing waiting. Every sheet is checked.</li>';

      var waiting = S.invoices.filter(function (v) { return v.status === 'SENT' || v.status === 'PARTIAL'; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
      var moneyRows = waiting.slice(0, 5).map(function (v) {
        var st = invStatus(v), late = st === 'OVERDUE';
        var days = Math.round((Date.parse(D.TODAY) - Date.parse(v.due)) / 864e5);
        return '<li class="mrow' + (late ? ' is-late' : '') + '"><a href="#/invoices/' + v.ref + '"><span class="ref">' + v.ref + '</span><span class="mrow__who">' + esc(clientName(v.client)) + '</span></a>' +
          '<span class="mrow__due">' + (late ? days + ' days overdue' : 'Due ' + (/^(Today|Tomorrow)$/.test(relDay(v.due)) ? relDay(v.due).toLowerCase() : relDay(v.due))) + '</span>' +
          '<span class="mrow__amt">' + money(outstanding(v)) + '</span>' +
          (late ? '<button class="btn btn--sm btn--line" type="button" data-action="chase" data-ref="' + v.ref + '"' + (v.chasedToday ? ' disabled' : '') + '>' + (v.chasedToday ? 'Reminder sent' : 'Send reminder') + '</button>' : '<span></span>') + '</li>';
      }).join('');

      var feed = S.activity.slice().reverse().slice(0, 8).map(function (a) {
        return '<li class="feed__i' + (a.kind ? ' feed__i--' + a.kind : '') + '"><span class="feed__t">' + a.t + '</span>' +
          (a.who ? avatar(a.who, 'avatar--sm') : '<span class="feed__dot">' + icon(a.kind === 'money' ? 'pound' : a.kind === 'alert' ? 'phone' : 'check') + '</span>') +
          '<span class="feed__x">' + (a.who ? '<b>' + esc(S.teamById[a.who].first) + '</b> ' : '') + esc(a.text) + '</span></li>';
      }).join('');

      return '<div class="page page--today">' +
        '<header class="phead"><div><p class="eyebrow">' + fmtDate(D.TODAY, 'long') + ' · ' + t2(now()) + '</p><h1>' + greet + ', ' + D.user.first + '.</h1>' +
        '<p class="phead__sub">' + sub.join(', ') + '.</p></div>' +
        '<div class="phead__actions"><a class="btn btn--line" href="#/sheets">' + icon('sheets') + 'Check sheets</a><a class="btn btn--primary" href="#/schedule">' + icon('schedule') + 'Open the schedule</a></div></header>' +
        '<section class="figures" aria-label="Today’s figures">' + figs + '</section>' +
        '<div class="today-grid">' +
          '<section class="panel panel--crew" aria-labelledby="h-crew"><header class="panel__head"><h2 id="h-crew">On the road</h2><a class="panel__link" href="#/schedule">Schedule ' + icon('arrow') + '</a></header>' +
            '<div class="mboard"><div class="mboard__ruler"><span></span><div class="mruler">' + rulerHTML(true) + '</div></div>' + lanes +
            '<div class="mboard__overlay" aria-hidden="true"><span class="now now--mini" data-nowline style="left:' + pct(now()) + '"></span></div></div>' +
            '<ul class="wholist">' + D.team.map(function (t) {
              var list = entriesFor(t.id, D.TODAY), cur = list.filter(function (e) { return e.start <= now() && now() < e.end; })[0];
              var nxt = list.filter(function (e) { return e.start > now(); })[0];
              var e = cur || nxt, job = e && S.jobs[e.job];
              return '<li>' + avatar(t.id) + '<span><b>' + esc(t.first) + '</b> ' + (job ? (cur ? 'at ' : 'next, ' + t2(e.start) + ': ') + esc(S.clients[job.client].short) + ', ' + esc(S.clients[job.client].area) : 'free for the rest of the day') + '</span></li>';
            }).join('') + '</ul>' +
          '</section>' +
          '<section class="panel panel--check" aria-labelledby="h-check"><header class="panel__head"><h2 id="h-check">Job sheets to check <span class="count">' + toCheck.length + '</span></h2><a class="panel__link" href="#/sheets">All sheets ' + icon('arrow') + '</a></header><ul class="checklist">' + checkRows + '</ul></section>' +
          '<section class="panel panel--money" aria-labelledby="h-money"><header class="panel__head"><h2 id="h-money">Money in</h2><a class="panel__link" href="#/invoices">Invoices ' + icon('arrow') + '</a></header><ul class="mlist">' + moneyRows + '</ul></section>' +
          '<section class="panel panel--feed" aria-labelledby="h-feed"><header class="panel__head"><h2 id="h-feed">Today so far</h2></header><ol class="feed">' + feed + '</ol></section>' +
        '</div></div>';
    },
    mount: function () {
      fitBlocks(main);
      // Count the paid figure up from where it was when it changed.
      var el = main.querySelector('[data-countup]');
      if (el && S.changed.paidFrom != null) {
        var from = +el.getAttribute('data-from'), to = +el.getAttribute('data-countup');
        S.changed.paidFrom = null;
        if (from !== to && !reduce) {
          var t0 = performance.now(), ms = 1100;
          el.textContent = money(from);
          setTimeout(function step() {
            var p = Math.min(1, (performance.now() - t0) / ms), e = 1 - Math.pow(1 - p, 3);
            el.textContent = money(Math.round(from + (to - from) * e));
            if (p < 1) requestAnimationFrame(step);
          }, 450);
        }
      }
    },
  };

  actions.chase = function (btn) {
    var inv = findInvoice(btn.getAttribute('data-ref'));
    inv.chasedToday = true;
    log(null, 'Reminder sent to ' + clientName(inv.client) + ' for ' + inv.ref);
    toast('Reminder sent to ' + esc(S.clients[inv.client].contact) + ' for ' + money(outstanding(inv)));
    refresh();
  };

  // ---------------------------------------------------------------- Schedule
  var WEEK = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'];

  function trayHTML() {
    var cards = S.tray.map(function (key) {
      var job = S.jobs[key], c = S.clients[job.client];
      return '<li class="tcard' + (job.urgent ? ' is-urgent' : '') + ' tcard--' + job.type + '" data-tray="' + key + '">' +
        '<div class="tcard__top"><span class="tcard__grip" aria-hidden="true">' + icon('grip') + '</span>' +
          (job.urgent ? '<span class="flag flag--urgent">Urgent</span>' : '<span class="flag">' + esc(D.types[job.type].label) + '</span>') +
          '<span class="tcard__len">' + icon('clock') + dur(job.mins) + '</span></div>' +
        '<h3 class="tcard__title">' + esc(job.title) + '</h3>' +
        '<p class="tcard__who">' + esc(c.name) + ' · ' + esc(c.area) + ' ' + esc(c.pc) + '</p>' +
        (job.note ? '<p class="tcard__note">' + esc(job.note) + '</p>' : '') +
        '<div class="tcard__foot">' + (job.gas ? '<span class="gasneed">' + icon('flame') + 'Needs Gas Safe</span>' : '<span class="gasneed gasneed--any">Any plumber</span>') +
          '<button class="btn btn--sm btn--line" type="button" data-action="assign" data-key="' + key + '">Assign</button></div></li>';
    }).join('');
    return '<section class="tray" aria-labelledby="h-tray"><header class="tray__head"><h2 id="h-tray">To schedule <span class="count">' + S.tray.length + '</span></h2>' +
      '<p class="tray__hint">Drag a job onto someone’s day, or use Assign.</p></header>' +
      (S.tray.length ? '<ul class="tray__list">' + cards + '</ul>' : '<p class="empty">' + icon('check') + 'Everything is booked in.</p>') + '</section>';
  }

  screens.schedule = {
    title: 'Schedule',
    render: function () {
      var day = S.scheduleDay, isToday = day === D.TODAY;
      var tabs = WEEK.map(function (d) {
        var n = {};
        S.entries.forEach(function (e) { if (e.day === d) n[e.job] = 1; });
        return '<button class="daytab' + (d === day ? ' is-active' : '') + (d === D.TODAY ? ' is-today' : '') + '" type="button" data-action="day" data-day="' + d + '" aria-pressed="' + (d === day) + '">' +
          '<span class="daytab__d">' + fmtDate(d, 'day').slice(0, 3) + ' ' + dObj(d).getUTCDate() + '</span><span class="daytab__n">' + Object.keys(n).length + ' jobs</span></button>';
      }).join('');

      var lanes = D.team.map(function (t) {
        var booked = bookedMins(t.id, day);
        return '<div class="lane" data-person="' + t.id + '">' +
          '<div class="lane__head">' + avatar(t.id) + '<span class="lane__who"><b>' + esc(t.name) + '</b><small>' + (t.gas ? icon('flame', 'i--gas') : '') + esc(t.lane) + '</small></span>' +
          '<span class="lane__hours">' + (booked ? dur(booked) : 'Free') + '</span></div>' +
          '<div class="lane__track" data-track="' + t.id + '">' + trackHTML(t.id, day) + '</div></div>';
      }).join('');

      var chips = D.team.map(function (t) {
        return '<button class="pchip' + (t.id === S.mobilePerson ? ' is-active' : '') + '" type="button" data-action="mperson" data-person="' + t.id + '" aria-pressed="' + (t.id === S.mobilePerson) + '">' + avatar(t.id, 'avatar--sm') + t.first + '</button>';
      }).join('');
      var mlist = entriesFor(S.mobilePerson, day);
      var agenda = mlist.length ? mlist.map(function (e, i) {
        var job = S.jobs[e.job], c = S.clients[job.client], st = entryState(e);
        var prev = mlist[i - 1];
        var travel = prev ? '<li class="ag__travel">' + icon('van') + travelMins(miles(S.clients[S.jobs[prev.job].client], c)) + ' min drive</li>' : '';
        return travel + '<li><a class="ag__item is-' + st + ' blk--' + job.type + '" href="#/jobs/' + job.id + '" data-entry="' + e.id + '"><span class="ag__time">' + t2(e.start) + '<small>' + t2(e.end) + '</small></span>' +
          '<span class="ag__main"><b>' + (job.urgent ? '<span class="blk__urgent">Urgent</span> ' : '') + esc(jobTitleOn(job, e.day)) + '</b><small>' + esc(c.name) + ' · ' + esc(c.area) + '</small><span class="ag__st">' + STATE_LABEL[st] + '</span></span></a></li>';
      }).join('') : '<li class="empty">' + esc(S.teamById[S.mobilePerson].first) + ' has nothing booked.</li>';
      agenda += absencesFor(S.mobilePerson, day).map(function (a) { return '<li class="ag__away"><span class="ag__time">' + t2(a.start) + '<small>' + t2(a.end) + '</small></span><span class="ag__main"><b>' + esc(a.label) + '</b><small>' + esc(a.note) + '</small></span></li>'; }).join('');

      return '<div class="page page--schedule">' +
        '<header class="phead phead--tight"><div><p class="eyebrow">Week of 2 November</p><h1>Schedule</h1></div>' +
        '<div class="daytabs" role="group" aria-label="Day">' + tabs + '</div>' +
        '<ul class="legend" aria-label="Key"><li><i class="lg lg--done"></i>Done</li><li><i class="lg lg--live"></i>On site</li><li><i class="lg lg--booked"></i>Booked</li><li><i class="lg lg--travel"></i>Travel</li><li><i class="lg lg--away"></i>Away</li></ul></header>' +
        '<div class="sched">' + trayHTML() +
          '<section class="board" aria-label="' + esc(fmtDate(day, 'long')) + ' by engineer">' +
            '<div class="board__ruler"><span class="board__corner">' + (isToday ? 'Today' : fmtDate(day, 'wd')) + '</span><div class="ruler">' + rulerHTML(false) + '</div></div>' +
            '<div class="board__lanes">' + lanes + '<div class="board__overlay" aria-hidden="true">' + (isToday ? '<span class="now" data-nowline style="left:' + pct(now()) + '"><span class="now__t">' + t2(now()) + '</span></span>' : '') + '</div></div>' +
          '</section>' +
          '<section class="agenda" aria-label="One engineer’s day"><div class="pchips" role="group" aria-label="Engineer">' + chips + '</div><ol class="ag">' + agenda + '</ol></section>' +
        '</div></div>';
    },
    mount: function () {
      main.querySelectorAll('.tcard').forEach(function (card) {
        card.addEventListener('pointerdown', function (ev) { startDrag(ev, card, 'tray'); });
      });
      main.querySelectorAll('.board .blk.is-booked').forEach(function (b) {
        b.addEventListener('pointerdown', function (ev) { startDrag(ev, b, 'move'); });
      });
      fitBlocks(main);
    },
  };

  actions.day = function (btn) { S.scheduleDay = btn.getAttribute('data-day'); refresh(); };
  actions.mperson = function (btn) { S.mobilePerson = btn.getAttribute('data-person'); refresh(); };

  // ================================================================ booking rules
  // One rule for every booking: a drop, Assign, a suggestion or a move. It knows who can do
  // the job, the time that has already gone, time off, other jobs and the drive either side.
  function clientOf(e) { return S.clients[S.jobs[e.job].client]; }
  function absencesFor(person, day) { return S.absences.filter(function (a) { return a.person === person && a.day === day; }); }
  function earliestStart(day) { return day === D.TODAY ? Math.ceil((now() + 15) / 15) * 15 : DAY_START; }
  function aMin(n) { var x = String(n); return (/^8/.test(x) || x === '11' || x === '18' ? 'an ' : 'a ') + x + ' min'; }
  function pron(id) { return id === 'priya' || id === 'megan' ? 'her' : 'his'; }

  function canDo(job, person) {
    var t = S.teamById[person];
    if (person === 'alfie') return t.first + ' is an apprentice, so he goes out with Kieran or Megan rather than on his own.';
    if (job.gas && !t.gas) return t.first + ' isn’t Gas Safe registered, and this job needs a gas engineer.';
    return '';
  }

  function checkSlot(job, person, day, start, ignore) {
    var len = job.mins, end = start + len, t = S.teamById[person], c = S.clients[job.client];
    var why = canDo(job, person);
    if (why) return { ok: false, kind: 'unfit', text: why };
    if (day < D.TODAY || start < earliestStart(day)) {
      return { ok: false, kind: 'gone', text: day < D.TODAY ? 'That day has gone. Pick today or later in the week.' : t2(start) + ' has gone. The earliest anyone can start today is ' + t2(earliestStart(day)) + '.' };
    }
    if (end > DAY_END) return { ok: false, kind: 'hours', text: t.first + ' finishes at ' + t2(DAY_END) + ', so a ' + dur(len) + ' job has to start by ' + t2(DAY_END - len) + '.' };
    var off = absencesFor(person, day).filter(function (a) { return a.start < end && start < a.end; })[0];
    if (off) return { ok: false, kind: 'absent', off: off };
    var list = entriesFor(person, day).filter(function (e) { return e !== ignore && !e.pending; });
    var busy = list.filter(function (e) { return e.start < end && start < e.end; })[0];
    if (busy) return { ok: false, kind: 'busy', other: busy };
    var prev = null, next = null;
    list.forEach(function (e) { if (e.end <= start) prev = e; if (e.start >= end && !next) next = e; });
    var before = prev ? travelMins(miles(clientOf(prev), c)) : 0;
    var after = next ? travelMins(miles(c, clientOf(next))) : 0;
    if (prev && prev.end + before > start) return { ok: false, kind: 'travel', side: 'before', other: prev, need: before };
    if (next && end + after > next.start) return { ok: false, kind: 'travel', side: 'after', other: next, need: after };
    var from = prev ? prev.end : DAY_START, to = next ? next.start : DAY_END;
    absencesFor(person, day).forEach(function (a) { if (a.end <= start) from = Math.max(from, a.end); if (a.start >= end) to = Math.min(to, a.start); });
    return { ok: true, from: from, to: to, drive: prev ? before : travelMins(miles(YARD, c)), miles: miles(prev ? clientOf(prev) : YARD, c), prev: prev };
  }

  function nextFree(job, person, day, after, ignore) {
    for (var s = Math.max(earliestStart(day), Math.ceil(after / 15) * 15); s + job.mins <= DAY_END; s += 15) {
      if (checkSlot(job, person, day, s, ignore).ok) return s;
    }
    return null;
  }

  // Who else could take it at the same time? Plumbing goes to a plumber first; gas engineers are kept for gas work.
  function bestOther(job, day, start, notPerson, ignore) {
    // First choice: someone free at the same time. Failing that, whoever can start nearest to it.
    var list = D.team.filter(function (t) { return t.id !== notPerson; }).map(function (t) {
      var s0 = start, r = checkSlot(job, t.id, day, start, ignore);
      if (!r.ok && r.kind !== 'unfit') {
        var best = null;
        for (var s = Math.max(earliestStart(day), start - 120); s <= start + 180 && s + job.mins <= DAY_END; s += 15) {
          if (checkSlot(job, t.id, day, s, ignore).ok && (best === null || Math.abs(s - start) < Math.abs(best - start))) best = s;
        }
        if (best !== null) { s0 = best; r = checkSlot(job, t.id, day, best, ignore); }
      }
      return r.ok ? { person: t.id, start: s0, shift: Math.abs(s0 - start), from: r.from, to: r.to, miles: r.miles, drive: r.drive } : null;
    }).filter(Boolean).sort(function (a, b) {
      var pa = !job.gas && S.teamById[a.person].gas ? 1 : 0, pb = !job.gas && S.teamById[b.person].gas ? 1 : 0;
      return (a.shift > 0) - (b.shift > 0) || pa - pb || a.shift - b.shift || a.miles - b.miles;
    });
    return list[0] || null;
  }

  function reasonText(res, job, person) {
    var t = S.teamById[person], c = S.clients[job.client];
    if (res.kind === 'absent') return t.first + ' is away: ' + res.off.label.toLowerCase() + ', ' + range(res.off.start, res.off.end) + (res.off.note ? ' (' + res.off.note + ')' : '') + '.';
    if (res.kind === 'busy') { var o = S.jobs[res.other.job]; return t.first + ' is on the ' + lcFirst(jobTitleOn(o, res.other.day)) + ' at ' + atPlace(clientOf(res.other)) + ' until ' + t2(res.other.end) + '.'; }
    if (res.kind === 'travel') {
      return res.side === 'before'
        ? t.first + ' finishes at ' + atPlace(clientOf(res.other)) + ' at ' + t2(res.other.end) + ', and it’s ' + aMin(res.need) + ' drive to ' + c.area + '.'
        : t.first + ' is due at ' + atPlace(clientOf(res.other)) + ' at ' + t2(res.other.start) + ', ' + aMin(res.need) + ' drive from ' + c.area + ', so this would have to finish by ' + t2(res.other.start - res.need) + '.';
    }
    return res.text || '';
  }

  // ---- placing a job from the tray, or moving a booking
  function placeJob(key, person, day, start, moving) {
    var job = S.jobs[key];
    var res = checkSlot(job, person, day, start, moving);
    if (!res.ok && (res.kind === 'unfit' || res.kind === 'gone' || res.kind === 'hours')) { toast(esc(res.text), 'warn'); return false; }
    var entry = moving;
    if (entry) {
      entry.was = { person: entry.person, day: entry.day, start: entry.start, end: entry.end };
      entry.person = person; entry.day = day; entry.start = start; entry.end = start + job.mins;
    } else {
      entry = { id: 'n' + (++S.seq), person: person, day: day, start: start, end: start + job.mins, job: key };
      S.entries.push(entry);
      entry.trayIndex = S.tray.indexOf(key);
      S.tray.splice(entry.trayIndex, 1);
    }
    if (res.ok) { confirmBooking(entry); return true; }
    entry.pending = true;
    refresh();
    openClash(entry, res);
    return true;
  }

  function confirmBooking(entry, note, mutate) {
    function commit() {
      var job = S.jobs[entry.job], t = S.teamById[entry.person], c = S.clients[job.client];
      var moved = !!entry.was;
      entry.pending = false;
      if (!moved) {
        job.status = 'SCHEDULED';
        job.crew = [entry.person];
        job.lead = entry.person;
        S.booked.push(job.id);
      } else if (job.crew.length === 1) { job.crew = [entry.person]; job.lead = entry.person; }
      delete entry.was;
      job.log.push({ t: t2(now()), text: (moved ? 'Moved to ' : 'Booked with ') + t.name + ', ' + relDay(entry.day).toLowerCase() + ' ' + range(entry.start, entry.end) });
      log(null, (moved ? 'Moved ' : 'Booked ') + t.first + ' for ' + c.short + ' at ' + t2(entry.start) + ': ' + lcFirst(job.title));
      S.mobilePerson = entry.person;
    }
    var wasMove = !!entry.was;
    if (mutate) flip(entry, function () { mutate(); commit(); });
    else { commit(); refresh(); }
    var job = S.jobs[entry.job], t = S.teamById[entry.person], c = S.clients[job.client];
    toast((note || (wasMove ? 'Moved' : 'Booked')) + ': <b>' + esc(t.first) + '</b>, ' + relDay(entry.day).replace('Today', 'today') + ' ' + range(entry.start, entry.end) + ' at ' + esc(atPlace(c)) + '. ' + esc(c.contact.split(' ')[0]) + ' has had a text.');
    // After the dialog has closed (it hands focus back as it goes), focus the booking itself.
    setTimeout(function () {
      var blk = document.querySelector('.board [data-entry="' + entry.id + '"]');
      if (blk && blk.offsetParent) blk.focus({ preventScroll: true });
      else {
        // On a phone the agenda now shows that engineer's day: bring the new booking into view.
        var ag = document.querySelector('.agenda [data-entry="' + entry.id + '"]');
        if (ag) { ag.focus({ preventScroll: true }); ag.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); }
      }
    }, 260);
  }

  function flip(entry, mutate) {
    var el = document.querySelector('.board [data-entry="' + entry.id + '"]');
    var a = el && el.getBoundingClientRect();
    mutate();
    refresh();
    var b = document.querySelector('.board [data-entry="' + entry.id + '"]');
    if (a && b && !reduce && b.animate && a.width) {
      var r = b.getBoundingClientRect();
      b.animate([
        { transform: 'translate(' + (a.left - r.left) + 'px,' + (a.top - r.top) + 'px)', boxShadow: '0 14px 30px -10px rgba(18,56,44,.45)' },
        { transform: 'none', boxShadow: '0 0 0 rgba(0,0,0,0)' },
      ], { duration: 620, easing: 'cubic-bezier(.2,.8,.2,1)' });
      b.classList.add('is-landed');
    }
  }

  var CLASH_HEAD = {
    busy: ['Double-booking', function (t) { return t.first + '’s already busy then'; }],
    travel: ['Not enough time to get there', function (t) { return t.first + ' can’t get there in time'; }],
    absent: ['Away', function (t) { return t.first + ' is off then'; }],
  };

  function openClash(entry, res) {
    var job = S.jobs[entry.job], t = S.teamById[entry.person], c = S.clients[job.client];
    var len = entry.end - entry.start;
    var other = bestOther(job, entry.day, entry.start, entry.person, entry);
    var later = nextFree(job, entry.person, entry.day, res.kind === 'travel' && res.side === 'after' ? res.other.end : res.kind === 'busy' ? res.other.end : res.kind === 'absent' ? res.off.end : entry.start, entry);
    var opts = '';
    if (other) {
      var ot = S.teamById[other.person];
      opts += '<button class="opt opt--best" type="button" data-resolve="give" autofocus>' + avatar(ot.id) +
        '<span class="opt__main"><b>Give it to ' + esc(ot.first) + ' at ' + t2(other.start) + '</b><small>Free ' + range(other.from, other.to) + ' · ' + other.drive + ' min drive from ' + pron(ot.id) + ' last job' + (job.gas ? ' · Gas Safe' : '') + '</small></span>' +
        '<span class="opt__tag">Nearest free</span></button>';
    }
    if (later != null) {
      opts += '<button class="opt' + (other ? '' : ' opt--best') + '" type="button" data-resolve="later"' + (other ? '' : ' autofocus') + '>' + avatar(t.id) + '<span class="opt__main"><b>' + esc(t.first) + ' at ' + t2(later) + ' instead</b><small>' + range(later, later + len) + ', with time to drive there</small></span></button>';
    } else {
      opts += '<p class="opt opt--none">' + avatar(t.id) + '<span class="opt__main"><b>No ' + dur(len) + ' gap left in ' + esc(t.first) + '’s day</b><small>Nothing fits between ' + pron(t.id) + ' jobs' + (absencesFor(t.id, entry.day).length ? ' and time off' : '') + '</small></span></p>';
    }
    var head = CLASH_HEAD[res.kind];
    var canForce = res.kind !== 'absent';
    openDialog({
      bare: true, anchor: true, className: 'dlg--clash',
      body: '<div class="clash"><p class="clash__eyebrow">' + icon('alert') + head[0] + '</p>' +
        '<h2 class="clash__title" data-dlg-title>' + esc(head[1](t)) + '</h2>' +
        '<p class="clash__why">' + esc(reasonText(res, job, entry.person)) + ' ' + esc(c.short.charAt(0).toUpperCase() + c.short.slice(1)) + (/^the .+s$/.test(c.short) && !c.company ? ' need ' : ' needs ') + dur(len) + ' from ' + t2(entry.start) + '.</p>' +
        '<div class="clash__opts">' + opts + '</div>' +
        '<div class="clash__foot"><button class="btn btn--ghost btn--sm" type="button" data-resolve="cancel">' + (entry.was ? 'Leave it where it was' : 'Put it back') + '</button>' +
        (canForce ? '<button class="btn btn--ghost btn--sm t-warn" type="button" data-resolve="anyway">Book ' + esc(t.first) + ' anyway</button>' : '') + '</div></div>',
      onCancel: function () { undoPlace(entry); },
      mount: function (dlg, close) {
        var el = document.querySelector('.board [data-entry="' + entry.id + '"]');
        if (el && el.offsetParent && window.innerWidth >= 900) {
          var r = el.getBoundingClientRect();
          var w = 420, h = dlg.offsetHeight || 300;
          var left = Math.min(window.innerWidth - w - 16, Math.max(16, r.left + r.width / 2 - 60));
          var top = r.bottom + 12;
          if (top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - 12);
          dlg.style.left = left + 'px';
          dlg.style.top = top + 'px';
          dlg.classList.add('is-anchored');
        }
        dlg.addEventListener('click', function (e) {
          var b = e.target.closest('[data-resolve]');
          if (!b) return;
          var how = b.getAttribute('data-resolve');
          if (how === 'cancel') { close('cancel'); return; }
          close();
          if (how === 'give') confirmBooking(entry, null, function () { entry.person = other.person; entry.start = other.start; entry.end = other.start + len; });
          else if (how === 'later') confirmBooking(entry, null, function () { entry.start = later; entry.end = later + len; });
          else if (how === 'anyway') { entry.forced = true; confirmBooking(entry, 'Double-booked'); }
        });
      },
    });
  }

  function undoPlace(entry) {
    if (entry.was) {
      entry.person = entry.was.person; entry.day = entry.was.day; entry.start = entry.was.start; entry.end = entry.was.end;
      delete entry.was; entry.pending = false;
      refresh();
      toast('Left where it was');
      return;
    }
    S.entries.splice(S.entries.indexOf(entry), 1);
    S.tray.splice(Math.min(entry.trayIndex || 0, S.tray.length), 0, entry.job);
    refresh();
    toast('Put back in To schedule');
    var card = document.querySelector('[data-tray="' + entry.job + '"] [data-action="assign"]');
    if (card && card.offsetParent) card.focus({ preventScroll: true });
  }

  // ---- drag from the tray, or drag a booking to move it
  var drag = null, swallowClick = false;
  function movable(e) { var st = entryState(e); var job = S.jobs[e.job]; return st === 'booked' && !job.days && job.crew.length < 2; }
  function startDrag(ev, el, kind) {
    if (ev.button && ev.button !== 0) return;
    if (kind === 'tray' && ev.target.closest('button, a')) return;
    var board = document.querySelector('.board');
    if (!board || !board.offsetParent) return;
    var entry = kind === 'move' ? S.entries.filter(function (x) { return x.id === el.getAttribute('data-entry'); })[0] : null;
    if (kind === 'move' && (!entry || !movable(entry))) return;
    drag = { key: entry ? entry.job : el.getAttribute('data-tray'), entry: entry, el: el, x: ev.clientX, y: ev.clientY, active: false, person: null, start: null };
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragEnd);
    window.addEventListener('pointercancel', onDragEnd);
  }
  function onDragMove(ev) {
    if (!drag) return;
    var job = S.jobs[drag.key];
    if (!drag.active) {
      if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < 6) return;
      drag.active = true;
      document.documentElement.classList.add('is-dragging');
      drag.el.classList.add('is-lifted');
      var g = document.createElement('div');
      g.className = 'dragghost tcard--' + job.type + (job.urgent ? ' is-urgent' : '');
      g.innerHTML = '<b>' + esc(job.title) + '</b><span>' + esc(S.clients[job.client].short) + ' · ' + dur(job.mins) + '</span>';
      document.body.appendChild(g);
      drag.ghost = g;
      document.querySelectorAll('.lane').forEach(function (l) {
        if (canDo(job, l.getAttribute('data-person'))) l.classList.add('is-unfit');
      });
    }
    drag.ghost.style.transform = 'translate(' + (ev.clientX + 14) + 'px,' + (ev.clientY + 16) + 'px)';
    var under = document.elementFromPoint(ev.clientX, ev.clientY);
    var track = under && under.closest('.lane__track');
    var prev = document.querySelector('.dropprev');
    if (!track) { if (prev) prev.remove(); drag.person = null; return; }
    var r = track.getBoundingClientRect();
    var start = Math.round((DAY_START + (ev.clientX - r.left) / r.width * SPAN) / 15) * 15;
    start = Math.max(DAY_START, Math.min(DAY_END - job.mins, start));
    drag.person = track.getAttribute('data-track');
    drag.start = start;
    if (!prev || prev.parentNode !== track) {
      if (prev) prev.remove();
      prev = document.createElement('span');
      prev.className = 'dropprev';
      track.appendChild(prev);
    }
    var res = checkSlot(job, drag.person, S.scheduleDay, start, drag.entry);
    prev.className = 'dropprev' + (res.ok ? '' : res.kind === 'unfit' || res.kind === 'gone' ? ' is-unfit' : ' is-clash');
    prev.style.left = pct(start);
    prev.style.width = wpct(job.mins);
    prev.textContent = res.kind === 'gone' ? 'Too early' : range(start, start + job.mins);
  }
  function onDragEnd(ev) {
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragEnd);
    window.removeEventListener('pointercancel', onDragEnd);
    if (!drag) return;
    var d = drag; drag = null;
    if (!d.active) return;
    if (d.entry) { swallowClick = true; setTimeout(function () { swallowClick = false; }, 50); }
    document.documentElement.classList.remove('is-dragging');
    if (d.ghost) d.ghost.remove();
    var prev = document.querySelector('.dropprev'); if (prev) prev.remove();
    document.querySelectorAll('.lane.is-unfit').forEach(function (l) { l.classList.remove('is-unfit'); });
    d.el.classList.remove('is-lifted');
    if (ev && ev.type === 'pointercancel') return;
    if (!d.person) return;
    if (d.entry && d.person === d.entry.person && d.start === d.entry.start) return;
    placeJob(d.key, d.person, S.scheduleDay, d.start, d.entry);
  }
  // Blocks are links: stop the browser's own link drag so ours can run.
  document.addEventListener('dragstart', function (e) {
    if (e.target.closest && e.target.closest('.blk, .tcard')) e.preventDefault();
  }, true);
  document.addEventListener('click', function (e) {
    if (swallowClick && e.target.closest('.blk')) { e.preventDefault(); e.stopPropagation(); swallowClick = false; }
  }, true);

  // ---- Assign (and Move) without a mouse
  actions.assign = function (btn) { bookingDialog(btn.getAttribute('data-key'), null); };
  actions.move = function (btn) {
    var entry = S.entries.filter(function (x) { return x.id === btn.getAttribute('data-entry'); })[0];
    if (entry) bookingDialog(entry.job, entry);
  };

  function bookingDialog(key, moving) {
    var job = S.jobs[key];
    var people = D.team.filter(function (t) { return !canDo(job, t.id); });
    var dayList = WEEK.filter(function (d) { return d >= D.TODAY; });
    var day0 = moving ? moving.day : (S.scheduleDay >= D.TODAY ? S.scheduleDay : D.TODAY);
    function timeOptions(day, sel) {
      var html = '';
      for (var m = earliestStart(day); m + job.mins <= DAY_END; m += 15) html += '<option value="' + m + '"' + (m === sel ? ' selected' : '') + '>' + t2(m) + '</option>';
      return html;
    }
    function personOptions(day, start, sel) {
      return people.map(function (t) {
        var r = checkSlot(job, t.id, day, start, moving);
        var note = r.ok ? 'free' : r.kind === 'absent' ? r.off.label.toLowerCase() + ' ' + range(r.off.start, r.off.end) : r.kind === 'busy' ? 'busy until ' + t2(r.other.end) : r.kind === 'travel' ? 'too tight to drive' : '';
        return '<option value="' + t.id + '"' + (t.id === sel ? ' selected' : '') + '>' + esc(t.name) + (note ? ' (' + note + ')' : '') + '</option>';
      }).join('');
    }
    var start0 = moving ? moving.start : earliestStart(day0) + 30;
    if (start0 + job.mins > DAY_END) start0 = earliestStart(day0);
    var person0 = moving ? moving.person : (bestOther(job, day0, start0, null, null) || { person: people[0].id }).person;
    openDialog({
      title: (moving ? 'Move: ' : 'Assign: ') + esc(job.title),
      body: '<form class="form"><p class="form__lead">' + esc(clientName(job.client)) + ', ' + esc(S.clients[job.client].area) + ' · ' + dur(job.mins) + (job.gas ? ' · needs Gas Safe' : '') + '</p>' +
        '<label class="field"><span>Who</span><select name="person">' + personOptions(day0, start0, person0) + '</select></label>' +
        '<div class="field-row"><label class="field"><span>Day</span><select name="day">' + dayList.map(function (d) { return '<option value="' + d + '"' + (d === day0 ? ' selected' : '') + '>' + relDay(d) + '</option>'; }).join('') + '</select></label>' +
        '<label class="field"><span>Start</span><select name="start">' + timeOptions(day0, start0) + '</select></label></div>' +
        '<p class="form__check" aria-live="polite"></p>' +
        '<div class="dlg__foot"><button type="button" class="btn btn--ghost" data-close>Cancel</button><button class="btn btn--primary" type="submit">' + icon('check') + (moving ? 'Move it' : 'Book it') + '</button></div></form>',
      mount: function (dlg, close) {
        var f = dlg.querySelector('form'), out = dlg.querySelector('.form__check');
        function check(e) {
          if (e && e.target === f.day) { f.start.innerHTML = timeOptions(f.day.value, +f.start.value); }
          var p = f.person.value, d = f.day.value, s = +f.start.value;
          if (e && e.target !== f.person) { f.person.innerHTML = personOptions(d, s, p); }
          var r = checkSlot(job, p, d, s, moving);
          out.className = 'form__check ' + (r.ok ? 'is-free' : 'is-clash');
          out.innerHTML = r.ok
            ? icon('check') + esc(S.teamById[p].first + ' is free ' + range(s, s + job.mins) + ', ' + aMin(r.drive) + ' drive from ' + (r.prev ? pron(p) + ' last job' : 'the yard') + '.')
            : icon('alert') + esc(reasonText(r, job, p)) + ' You’ll get options.';
        }
        f.addEventListener('change', check);
        check();
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var d = f.day.value;
          close();
          S.scheduleDay = d;
          if (location.hash !== '#/schedule') location.hash = '#/schedule';
          setTimeout(function () { placeJob(key, f.person.value, d, +f.start.value, moving); }, 30);
        });
      },
    });
  }

  // ---- fit the text on blocks: title, then the client, then just the time
  function overflows(el) { return el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1; }
  function fitBlocks(root) {
    (root || document).querySelectorAll('.blk').forEach(function (b) {
      b.classList.remove('no-where', 'is-tight', 'is-bare', 'no-badge');
      var ti = b.querySelector('.blk__title');
      var bad = function () { return overflows(b) || (ti && overflows(ti)); };
      if (!bad()) return;
      b.classList.add('no-where');
      if (!bad()) return;
      b.classList.add('is-tight');
      var alt = b.querySelector('.blk__alt');
      if (alt && !overflows(b) && !overflows(alt)) return;
      // Urgent jobs keep their red edge; if the badge and name don't both fit, the name wins.
      if (b.classList.contains('is-urgent')) {
        b.classList.add('no-badge');
        if (alt && !overflows(b) && !overflows(alt)) return;
      }
      b.classList.add('is-bare');
    });
  }
  var fitTimer;
  window.addEventListener('resize', function () { clearTimeout(fitTimer); fitTimer = setTimeout(function () { fitBlocks(); }, 120); });

  // ---------------------------------------------------------------- start
  function start() {
    main = document.getElementById('main');
    S.base = kpis();
    if (TOUR && !location.hash) history.replaceState(null, '', '#/schedule');
    render(false);
  }

  window.App = {
    D: D, S: S, TOUR: TOUR, reduce: reduce, screens: screens, actions: actions,
    esc: esc, money: money, t2: t2, range: range, dur: dur, hoursText: hoursText, fmtDate: fmtDate, relDay: relDay, icon: icon,
    avatar: avatar, pill: pill, toast: toast, openDialog: openDialog, refresh: refresh, go: go, now: now, log: log, kpis: kpis,
    invTotals: invTotals, sheetTotals: sheetTotals, labourHours: labourHours, invStatus: invStatus, outstanding: outstanding, jobValue: jobValue,
    findInvoice: findInvoice, findSheet: findSheet, entriesFor: entriesFor, clientName: clientName, nextRef: nextRef, entryState: entryState,
    STATE_LABEL: STATE_LABEL, start: start, placeJob: placeJob, fitBlocks: fitBlocks,
  };
})();
