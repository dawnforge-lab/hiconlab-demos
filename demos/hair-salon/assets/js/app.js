/* Fankle, Leith: site behaviour and online booking (no backend).
   In tour mode the clock is pinned to Wednesday 11 November, 10:40, and the
   availability is seeded per stylist and day, so every recording matches. */
(function () {
  'use strict';

  var D = window.FANKLE;
  var TOUR = !!(window.HiconTour && window.HiconTour.active);
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NOW = TOUR ? new Date(2026, 10, 11, 10, 40) : new Date();
  var TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  var NOW_MIN = NOW.getHours() * 60 + NOW.getMinutes();

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ---------- Small helpers ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toMin(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }
  function fmtMin(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fromKey(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function diffDays(a, b) { return Math.round((a - b) / 86400000); }
  function fmtDay(d) { return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function fmtDayLong(d) { return DAYS_LONG[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS_LONG[d.getMonth()]; }
  function fmtDur(m) {
    if (m < 60) return m + ' min';
    var h = Math.floor(m / 60), r = m % 60;
    return h + ' hr' + (r ? ' ' + r : '');
  }
  function money(n) { return n === 0 ? 'Free' : '£' + n; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function relDay(d) {
    var n = diffDays(d, TODAY);
    if (n === 0) return 'today';
    if (n === 1) return 'tomorrow';
    if (n < 7) return DAYS_LONG[d.getDay()];
    return fmtDay(d);
  }

  var ICON = {
    check: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    close: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    info: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/></svg>',
    clock: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    pin: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    phone: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.5 4.2-2 1.4a12 12 0 0 0 6.2 6.2l1.4-2 4.2 1.5v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z"/></svg>',
    drop: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5Z"/></svg>',
  };

  // ---------- Data helpers ----------
  var svcById = {}; D.services.forEach(function (s) { svcById[s.id] = s; });
  var staffById = {}; D.team.forEach(function (p) { staffById[p.id] = p; });

  function minsFor(svc, len) { return typeof svc.mins === 'number' ? svc.mins : svc.mins[len]; }
  function baseFor(svc, len) { return typeof svc.price === 'number' ? svc.price : svc.price[len]; }
  function priceFor(svc, len, staffId) {
    var base = baseFor(svc, len);
    if (svc.flat || !staffId) return base;
    return Math.round(base * D.levels[staffById[staffId].level].factor);
  }
  function rangeFor(svc, len, ids) {
    var list = (ids || svc.who).map(function (id) { return priceFor(svc, len, id); });
    return { lo: Math.min.apply(null, list), hi: Math.max.apply(null, list) };
  }
  function rangeWho(svc, len) {
    if (svc.flat) return svc.who.length > 1 ? "Same with anyone" : "with " + staffById[svc.who[0]].first;
    if (svc.who.length === 1) return "with " + staffById[svc.who[0]].first;
    var sorted = svc.who.slice().sort(function (a, b) { return priceFor(svc, len, a) - priceFor(svc, len, b); });
    return staffById[sorted[0]].first + " to " + staffById[sorted[sorted.length - 1]].first;
  }
  function rangeText(r) { return r.lo === r.hi ? money(r.lo) : '£' + r.lo + '<span class="dash">–</span>£' + r.hi; }
  function namesList(ids) {
    var n = ids.map(function (id) { return staffById[id].first; });
    if (n.length < 2) return n.join('');
    return n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1];
  }

  // ---------- The strand ----------
  // A trochoid: loop factor k > 1 knots the strand into a fankle, k < 1 relaxes it into a wave.
  function strandGeom(o) {
    var n = o.ks.length, tail = (o.tail || 1.6) * Math.PI;
    var t0 = -tail, t1 = 2 * Math.PI * (n - 1) + tail, span = t1 - t0;
    var padX = o.pad != null ? o.pad : 2, s = (o.w - 2 * padX) / span;
    return { n: n, t0: t0, t1: t1, span: span, padX: padX, s: s, tail: tail, loopX: function (j) { return padX + (2 * Math.PI * j - t0) * s; } };
  }
  function strandPath(o) {
    var g = strandGeom(o), ks = o.ks, n = g.n, t0 = g.t0, t1 = g.t1, span = g.span, s = g.s, h = o.h;
    var ys = s * (o.aspect != null ? o.aspect : 0.9);
    var steps = Math.round(n * (o.res || 64) + 60);
    var seed = o.seed != null ? o.seed : 1.3, drift = o.drift != null ? o.drift : 0.5;
    var taper = g.tail * 0.9;
    function sm(x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }
    function kAt(t) {
      var u = t / (2 * Math.PI);
      if (u <= 0) return ks[0];
      if (u >= n - 1) return ks[n - 1];
      var j = Math.floor(u), f = u - j, e = (1 - Math.cos(Math.PI * f)) / 2;
      return ks[j] * (1 - e) + ks[j + 1] * e;
    }
    var d = "";
    for (var i = 0; i <= steps; i++) {
      var t = t0 + (i / steps) * span;
      var env = sm((t - t0) / taper) * sm((t1 - t) / taper);
      var k = kAt(t) * env;
      var knot = sm((k - 0.8) / 1.6), skew = sm((k - 0.3) / 1.2);
      var wob = 1 + 0.08 * Math.sin(t * 0.71 + seed) + 0.05 * Math.sin(t * 1.93 + seed * 2);
      var kx = k * (1 + 0.45 * knot * Math.sin(t * 0.43 + seed * 3));
      var ky = k * (1 + 0.3 * knot * Math.sin(t * 0.61 + seed));
      var x = (t - t0) - kx * Math.sin(t) * wob * skew;
      var p = (t - t0) / span;
      var y = -ky * Math.cos(t) * wob + drift * Math.sin(Math.PI * 2 * (p * 0.55) + seed) + knot * 0.9 * Math.sin(t * 0.5 + seed * 1.7);
      d += (i ? "L" : "M") + (g.padX + x * s).toFixed(1) + " " + (h / 2 + y * ys).toFixed(1);
    }
    return d;
  }

  function easeInOut(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }

  // Animates a path from its current loop factors to new ones.
  function tweenStrand(path, opts, from, to, ms) {
    if (path._raf) cancelAnimationFrame(path._raf);
    if (reduced || !ms) { path.setAttribute('d', strandPath(Object.assign({}, opts, { ks: to }))); path._ks = to.slice(); return; }
    var start = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - start) / ms), e = easeInOut(p);
      var ks = to.map(function (v, i) { return from[i] + (v - from[i]) * e; });
      path._ks = ks;
      path.setAttribute('d', strandPath(Object.assign({}, opts, { ks: ks })));
      if (p < 1) path._raf = requestAnimationFrame(step);
    })(start);
  }

  var TANGLE = [2.7, 3.0, 2.4, 2.8, 2.6, 2.9];
  var SMOOTH = 0.5;

  function drawStatic() {
    var band = $('[data-strand="band"]');
    if (band) {
      var bandOpts = { w: 1200, h: 160, pad: 10, aspect: 0.7, seed: 2.1, drift: 0.6 };
      var bandTangle = [2.6, 2.9, 2.3, 2.8, 2.5, 3.0, 2.4, 2.7];
      var bandSmooth = bandTangle.map(function () { return SMOOTH; });
      band.setAttribute('d', strandPath(Object.assign({ ks: reduced ? bandSmooth : bandTangle }, bandOpts)));
      if (!reduced && 'IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { io.disconnect(); setTimeout(function () { tweenStrand(band, bandOpts, bandTangle, bandSmooth, 1800); }, 250); }
        }, { threshold: 0.6 });
        io.observe(band);
      }
    }
  }

  // Hero: the underline under “fankle” stays knotted until you book, then it relaxes
  // into a wave (when the hero is next in view): the fankle, sorted.
  var hero = { path: null, opts: { w: 400, h: 96, pad: 6, aspect: 1, seed: 1.3, drift: 0.4 }, from: TANGLE.slice(0, 5), p: 0, pending: false };
  function heroStrandAt(p) {
    hero.p = p;
    var ks = hero.from.map(function (k, i) {
      var a = Math.min(1, Math.max(0, (p - i * 0.12) / 0.52));
      return k + (SMOOTH - k) * easeInOut(a);
    });
    hero.path.setAttribute("d", strandPath(Object.assign({ ks: ks }, hero.opts)));
  }
  function initHeroStrand() {
    hero.path = $("[data-strand=\"hero\"]");
    if (hero.path) heroStrandAt(0);
  }
  function playHeroStrand() {
    if (reduced) { heroStrandAt(1); return; }
    var start = performance.now(), from = hero.p;
    (function step(now) {
      var p = Math.min(1, (now - start) / 1700);
      heroStrandAt(from + (1 - from) * p);
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  function settleHeroStrand(instant) {
    if (!hero.path || hero.p >= 1 || hero.pending) return;
    if (instant) { heroStrandAt(1); return; }
    hero.pending = true;
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect(); hero.pending = false;
      setTimeout(playHeroStrand, 250);
    }, { threshold: 1 });
    io.observe(hero.path.closest(".fankle-word"));
  }

  // ---------- Availability ----------
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // Times the tour relies on are kept free, so the story is always the same.
  var KEEP_FREE = TOUR ? [{ who: 'femi', day: '2026-11-12', from: '14:30', to: '16:00' }] : [];
  var busyCache = {};
  var userBookings = [];

  function works(id, d) { return !!D.hours[d.getDay()] && staffById[id].days.indexOf(d.getDay()) !== -1; }

  function busyFor(id, d) {
    var key = id + '|' + dayKey(d);
    if (busyCache[key]) return busyCache[key];
    var h = D.hours[d.getDay()];
    var open = toMin(h[0]), close = toMin(h[1]);
    var r = rng(hash('fankle|' + key));
    var ahead = diffDays(d, TODAY);
    var fill = ahead <= 1 ? 0.74 : ahead <= 4 ? 0.6 : ahead <= 8 ? 0.5 : 0.4;
    if (d.getDay() === 6) fill += 0.12;
    var lunch = 12 * 60 + 30 * Math.floor(r() * 4);
    var busy = [[lunch, lunch + 30]];
    var lens = [30, 45, 45, 60, 60, 75, 90, 105, 120, 150];
    var t = open;
    while (t < close) {
      if (t >= lunch && t < lunch + 30) { t = lunch + 30; continue; }
      if (r() < fill) {
        var len = lens[Math.floor(r() * lens.length)];
        var end = Math.min(close, t + len);
        if (t < lunch && end > lunch) end = lunch;
        busy.push([t, end]);
        t = end;
      } else {
        t += [15, 30, 30, 45, 60][Math.floor(r() * 5)];
      }
    }
    if (id === 'kasia' || id === 'morven') {
      var g = rng(hash('gap|' + key));
      if (g() < 0.55) {
        var gs = open + 15 * Math.floor(g() * ((close - open - 210) / 15 + 1));
        busy = busy.filter(function (iv) { return iv[1] <= gs || iv[0] >= gs + 210; });
      }
    }
    KEEP_FREE.forEach(function (k) {
      if (k.who !== id || k.day !== dayKey(d)) return;
      var a = toMin(k.from), b = toMin(k.to);
      busy = busy.filter(function (iv) { return iv[1] <= a || iv[0] >= b; });
    });
    busyCache[key] = busy;
    return busy;
  }

  function freeStarts(id, d, mins) {
    if (!works(id, d)) return null;
    var h = D.hours[d.getDay()];
    var open = toMin(h[0]), close = toMin(h[1]);
    var busy = busyFor(id, d).concat(userBookings.filter(function (b) { return b.who === id && b.day === dayKey(d); }).map(function (b) { return [b.start, b.start + b.mins]; }));
    var earliest = open;
    var ahead = diffDays(d, TODAY);
    if (ahead < 0) return [];
    if (ahead === 0) earliest = Math.max(open, Math.ceil((NOW_MIN + 30) / 15) * 15);
    var out = [];
    for (var s = earliest; s + mins <= close; s += 15) {
      var e = s + mins, clash = false;
      for (var i = 0; i < busy.length; i++) { if (s < busy[i][1] && e > busy[i][0]) { clash = true; break; } }
      if (!clash) out.push(s);
    }
    return out;
  }

  // Times for "anyone": the first person in the service's own order who is free gets the slot.
  function anyStarts(svc, len, d) {
    var map = {};
    svc.who.forEach(function (id) {
      var f = freeStarts(id, d, minsFor(svc, len));
      if (!f) return;
      f.forEach(function (m) { if (!(m in map)) map[m] = id; });
    });
    return Object.keys(map).map(Number).sort(function (a, b) { return a - b; }).map(function (m) { return { start: m, who: map[m] }; });
  }

  function nextFree(id, mins, fromDay) {
    for (var i = 0; i < 28; i++) {
      var d = addDays(fromDay || TODAY, i);
      var f = freeStarts(id, d, mins);
      if (f && f.length) return { day: d, start: f[0] };
    }
    return null;
  }

  // ---------- Store (session only, never sent anywhere) ----------
  function saveBooking(b) { try { sessionStorage.setItem('fankle-booking', JSON.stringify(b)); } catch (e) { /* private mode */ } }
  function loadBooking() {
    if (TOUR) return null;
    try { var b = JSON.parse(sessionStorage.getItem('fankle-booking') || 'null'); return b && fromKey(b.day) >= TODAY ? b : null; } catch (e) { return null; }
  }

  // ---------- Page furniture ----------
  function openStatus() {
    var el = $('[data-open-status]');
    if (!el) return;
    var h = D.hours[NOW.getDay()];
    if (h && NOW_MIN >= toMin(h[0]) && NOW_MIN < toMin(h[1])) {
      el.textContent = 'Open now until ' + h[1];
      el.classList.add('is-open');
      return;
    }
    for (var i = 0; i < 8; i++) {
      var d = addDays(TODAY, i), hh = D.hours[d.getDay()];
      if (!hh || (i === 0 && NOW_MIN >= toMin(hh[0]))) continue;
      el.textContent = 'Closed now · opens ' + (i === 0 ? 'today' : i === 1 ? 'tomorrow' : DAYS_LONG[d.getDay()]) + ' at ' + hh[0];
      return;
    }
  }

  function hoursTable() {
    var tb = $('[data-hours]');
    if (!tb) return;
    var order = [1, 2, 3, 4, 5, 6, 0];
    tb.innerHTML = order.map(function (dow) {
      var h = D.hours[dow];
      return '<tr' + (dow === NOW.getDay() ? ' class="is-today"' : '') + '><th scope="row">' + DAYS_LONG[dow] + '</th><td>' + (h ? h[0] + '–' + h[1] : 'Closed') + '</td></tr>';
    }).join('');
  }

  // The day the hero board talks about: today if there is still time to book, else the next open day.
  function boardDay() {
    for (var i = 0; i < 8; i++) {
      var d = addDays(TODAY, i), h = D.hours[d.getDay()];
      if (!h) continue;
      if (i === 0 && NOW_MIN + 60 > toMin(h[1])) continue;
      return d;
    }
    return TODAY;
  }

  function renderBoard() {
    var list = $('[data-board]');
    if (!list) return;
    var d = boardDay(), isToday = diffDays(d, TODAY) === 0;
    $('[data-board-title]').textContent = isToday ? 'Free chairs today' : (diffDays(d, TODAY) === 1 ? 'Free chairs tomorrow' : 'Free chairs on ' + relDay(d));
    $('[data-board-day]').textContent = fmtDay(d);
    var os = $('.chairs [data-open-status]'); if (os) { os.hidden = !isToday; var sep = $('.chairs-meta .sep'); if (sep) sep.hidden = !isToday; }
    list.innerHTML = D.team.map(function (p) {
      var status, off = false;
      var f = freeStarts(p.id, d, 30);
      if (f === null) {
        off = true;
        var back = null;
        for (var i = 1; i < 8 && !back; i++) { var dd = addDays(d, i); if (works(p.id, dd)) back = dd; }
        status = back ? 'Back ' + (isToday && diffDays(back, d) === 1 ? 'tomorrow' : DAYS[back.getDay()]) : 'Off';
      } else if (!f.length) { off = true; status = 'Fully booked'; }
      else status = 'Next ' + fmtMin(f[0]);
      return '<li><button class="board-row" type="button" data-book-who="' + p.id + '"><span class="sr-only">Book with </span>' +
        '<img src="assets/img/' + p.img + '-420.webp" alt="" width="36" height="36">' +
        '<span class="board-name">' + esc(p.first) + '<small>' + esc(p.role) + '</small></span>' +
        '<span class="board-time num' + (off ? ' is-off' : '') + '">' + esc(status) + '</span></button></li>';
    }).join('');

    var anyEl = $('[data-next-any]');
    if (anyEl) {
      var best = null;
      D.team.forEach(function (p) { var n = nextFree(p.id, 45); if (n && (!best || n.day < best.day || (+n.day === +best.day && n.start < best.start))) best = n; });
      if (best) anyEl.textContent = relDay(best.day) + ', ' + fmtMin(best.start);
    }
  }

  function renderTicket(b) {
    var el = $('[data-ticket]');
    if (!el || !b) return;
    var svc = svcById[b.svc], who = staffById[b.who];
    el.innerHTML = '<span class="t-label">You’re booked in</span>' +
      '<b>' + esc(fmtDay(fromKey(b.day))) + ', ' + fmtMin(b.start) + '</b>' +
      '<span>' + esc(svc.name) + ' with ' + esc(who.first) + ' · ' + esc(b.ref) + '</span>';
    el.hidden = false;
  }

  // ---------- Length switch + prices ----------
  var state = { len: 'shoulder', level: 'all' };

  function segHTML(name, items, current, small) {
    return items.map(function (it) {
      return '<button type="button" data-' + name + '="' + it.id + '" aria-pressed="' + (it.id === current) + '"><b>' + esc(it.label) + '</b>' + (it.hint && !small ? '<span>' + esc(it.hint) + '</span>' : '') + '</button>';
    }).join('');
  }

  function renderLengthSegs() {
    $$('[data-length-seg]').forEach(function (seg) {
      seg.innerHTML = segHTML('len', D.lengths, state.len, seg.classList.contains('seg--small'));
    });
  }

  function priceAmtHTML(svc, len) {
    var r = rangeFor(svc, len);
    var meta = fmtDur(minsFor(svc, len));
    if (svc.shortOnly) meta += ' · short hair';
    return '<b>' + rangeText(r) + '</b><span>' + meta + '</span>';
  }

  function renderHomePrices(changed) {
    var wrap = $('[data-price-cols]');
    if (!wrap) return;
    wrap.innerHTML = D.categories.map(function (c) {
      var rows = D.services.filter(function (s) { return s.cat === c.id && s.home; });
      return '<div class="price-col"><h3>' + esc(c.label) + '</h3>' + rows.map(function (s) {
        return '<div class="price-row"><h4>' + esc(s.name) + '</h4><p>' + esc(s.blurb) + '</p><div class="price-amt' + (changed ? ' is-changed' : '') + '">' + priceAmtHTML(s, state.len) + '</div></div>';
      }).join('') + '</div>';
    }).join('');
  }

  function renderTeam() {
    var ul = $('[data-team]');
    if (!ul) return;
    ul.innerHTML = D.team.map(function (p) {
      var days = p.days.slice().sort().map(function (d) { return DAYS[d]; }).join(', ');
      return '<li class="team-card" data-hover>' +
        '<div class="team-photo"><img src="assets/img/' + p.img + '-720.webp" srcset="assets/img/' + p.img + '-420.webp 420w, assets/img/' + p.img + '-720.webp 720w" sizes="(max-width: 860px) 70vw, 18vw" width="720" height="816" loading="lazy" alt="Portrait of ' + esc(p.name) + ' against the pink plaster wall.">' +
        '<span class="team-level">' + esc(D.levels[p.level].label) + '</span></div>' +
        '<h3>' + esc(p.first) + '</h3><p class="team-role">' + esc(p.name) + ' · ' + esc(p.role) + '</p>' +
        '<p class="team-good">' + esc(p.goodFor) + '.</p>' +
        '<p class="team-days">In ' + days + '</p>' +
        '<button class="team-book" type="button" data-book-who="' + p.id + '">Book with ' + esc(p.first) + '</button></li>';
    }).join('');
  }

  function renderReviews() {
    var ul = $('[data-reviews]');
    if (!ul) return;
    ul.innerHTML = D.reviews.map(function (r) {
      return '<li><blockquote><p>' + esc(r.quote) + '</p><footer>' + esc(r.who) + '</footer></blockquote></li>';
    }).join('');
  }

  // Services page: full table with length and level switches.
  function renderServicesPage(changed) {
    var root = $('[data-menu]');
    if (!root) return;
    var level = state.level;
    root.innerHTML = D.categories.concat([{ id: 'none', label: 'Not sure yet?' }]).map(function (c) {
      var rows = D.services.filter(function (s) { return s.cat === c.id; });
      var intro = { cut: 'Every cut includes a consultation, a wash and a finish unless it says otherwise.', colour: 'All colour needs a skin test 48 hours before if you’re new to us or it’s been six months.', finish: 'Curly hair is cut by people who love it. Bring your products if you have favourites.', none: 'Come and talk before you commit to anything big.' }[c.id];
      return '<section class="menu-cat" aria-labelledby="cat-' + c.id + '"><h2 id="cat-' + c.id + '">' + esc(c.label) + '<small>' + esc(intro) + '</small></h2><div class="svc-table">' +
        rows.map(function (s) {
          var priceHTML;
          if (level === 'all') {
            priceHTML = '<b>' + rangeText(rangeFor(s, state.len)) + '</b><span>' + rangeWho(s, state.len) + '</span>';
          } else {
            var ids = s.who.filter(function (id) { return staffById[id].level === level; });
            if (ids.length) priceHTML = '<b>' + money(priceFor(s, state.len, ids[0])) + '</b><span>with ' + esc(namesList(ids)) + '</span>';
            else priceHTML = '<b>Not at this level</b><span>with ' + esc(namesList(s.who)) + '</span>';
            if (!ids.length) priceHTML = priceHTML.replace('<b>', '<b data-na>');
          }
          var na = priceHTML.indexOf('data-na') !== -1;
          var meta = fmtDur(minsFor(s, state.len)) + (s.shortOnly ? '<br><span class="opt-hint">short hair</span>' : '');
          return '<div class="svc-line"><div><h3>' + esc(s.name) + '</h3><p>' + esc(s.blurb) + '</p><p class="who">' + esc(namesList(s.who)) + '</p></div>' +
            '<div class="svc-time">' + meta + '</div>' +
            '<div class="svc-price' + (na ? ' is-na' : '') + (changed ? ' is-changed' : '') + '">' + priceHTML + '</div>' +
            '<button class="svc-book" type="button" data-book-svc="' + s.id + '" aria-label="Book ' + esc(s.name) + '">Book</button></div>';
        }).join('') + '</div></section>';
    }).join('');
  }

  function renderLevelSeg() {
    var seg = $('[data-level-seg]');
    if (!seg) return;
    var items = [{ id: 'all', label: 'Anyone' }].concat(Object.keys(D.levels).map(function (k) { return { id: k, label: D.levels[k].label }; }));
    seg.innerHTML = segHTML('level', items, state.level, true);
  }

  function renderLevelFaces() {
    $$('[data-level-faces]').forEach(function (el) {
      var lvl = el.getAttribute('data-level-faces');
      el.innerHTML = D.team.filter(function (p) { return p.level === lvl; }).map(function (p) {
        return '<img src="assets/img/' + p.img + '-420.webp" alt="' + esc(p.name) + '" width="48" height="48" loading="lazy">';
      }).join('');
    });
  }

  function setLength(len) {
    if (len === state.len) return;
    state.len = len;
    renderLengthSegs();
    renderHomePrices(true);
    renderServicesPage(true);
  }

  // ---------- Header + mobile menu ----------
  function initHeader() {
    var head = $('[data-head]');
    if (head) {
      var onScroll = function () { head.classList.toggle('is-stuck', window.scrollY > 40); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    var menu = $('#menu'), openBtn = $('[data-menu-open]');
    if (!menu || !openBtn) return;
    function open() {
      menu.hidden = false; openBtn.setAttribute('aria-expanded', 'true'); document.body.classList.add('is-locked');
      $('[data-menu-close]', menu).focus();
    }
    function close(restore) {
      menu.hidden = true; openBtn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('is-locked');
      if (restore !== false) openBtn.focus();
    }
    openBtn.addEventListener('click', open);
    $('[data-menu-close]', menu).addEventListener('click', function () { close(); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { close(false); }); });
    $$('[data-book]', menu).forEach(function (b) { b.addEventListener('click', function () { close(false); }); });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') trap(e, menu);
    });
  }

  function trap(e, root) {
    var f = $$('a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])', root).filter(function (n) { return n.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // ---------- Booking ----------
  var STEPS = ['Service', 'Stylist', 'Time', 'Details'];
  var B = null;
  var sheet = null;

  function freshBooking(opts) {
    return {
      step: 1, len: (opts && opts.len) || state.len, svc: (opts && opts.svc) || null,
      who: (opts && opts.who) || null, presetWho: (opts && opts.who) || null,
      day: null, start: null, assigned: null,
      d: { first: '', last: '', mobile: '', email: '', visit: '', notes: '', remind: true },
      errors: {}, busy: false, ref: null,
    };
  }

  function buildSheet() {
    var root = $('[data-sheet-root]');
    root.innerHTML =
      '<div class="sheet-backdrop" data-sheet-close></div>' +
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">' +
        '<div class="sheet-head"><div class="sheet-top"><h2 class="sheet-title" id="sheet-title">Book a chair</h2>' +
        '<button class="sheet-close" type="button" data-sheet-close aria-label="Close booking">' + ICON.close + '</button></div>' +
        '<div class="progress" aria-hidden="true"><svg data-progress-svg><path data-progress-path d=""/></svg><ol data-progress-labels></ol></div></div>' +
        '<div class="sheet-body" data-sheet-body></div>' +
        '<div class="sheet-foot"><div class="summary" data-summary aria-live="polite"></div>' +
        '<div class="sheet-actions" data-actions></div></div>' +
      '</div>';
    sheet = { root: root, el: $('.sheet', root), body: $('[data-sheet-body]', root), summary: $('[data-summary]', root), actions: $('[data-actions]', root), path: $('[data-progress-path]', root), svg: $('[data-progress-svg]', root), labels: $('[data-progress-labels]', root) };
    $$('[data-sheet-close]', root).forEach(function (b) { b.addEventListener('click', closeBooking); });
    sheet.el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeBooking(); }
      if (e.key === 'Tab') trap(e, sheet.el);
    });
    sheet.body.addEventListener('click', onBodyClick);
    sheet.body.addEventListener('input', onBodyInput);
    sheet.body.addEventListener('change', onBodyInput);
    sheet.actions.addEventListener('click', onActionClick);
    window.addEventListener('resize', function () { if (B && !sheet.root.hidden) drawProgress(false); });
  }

  var lastFocus = null, lastWho = null;
  function openBooking(opts) {
    if (!sheet) buildSheet();
    lastFocus = document.activeElement;
    lastWho = lastFocus && lastFocus.getAttribute ? lastFocus.getAttribute('data-book-who') : null;
    B = freshBooking(opts);
    if (B.svc && B.who && svcById[B.svc].who.indexOf(B.who) === -1) B.who = null;
    sheet.root.hidden = false;
    document.body.classList.add('is-locked');
    sheet.path._ks = null;
    render(true);
    requestAnimationFrame(function () { requestAnimationFrame(function () { sheet.root.classList.add('is-open'); }); });
  }

  function closeBooking() {
    if (!sheet || sheet.root.hidden) return;
    var wasDone = B && B.step === 5;
    sheet.root.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(function () { sheet.root.hidden = true; }, reduced ? 0 : 420);
    if (wasDone) afterBooked();
    var ticket = $('[data-ticket]');
    var target = wasDone && ticket && !ticket.hidden && !TOUR ? ticket
      : lastFocus && lastFocus.isConnected ? lastFocus
      : lastWho ? $('[data-book-who="' + lastWho + '"]') : null;
    if (target && target.focus) target.focus({ preventScroll: true });
  }

  function progressKs(step) {
    return [0, 1, 2, 3].map(function (i) { return step > i + 1 ? SMOOTH : TANGLE[i]; });
  }

  function drawProgress(animate) {
    var w = Math.max(240, sheet.svg.clientWidth || 560), h = 64;
    sheet.svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var opts = { w: w, h: h, pad: 6, aspect: 0.55, seed: 0.7, drift: 0.35 };
    // Keep the knots the same height however wide the sheet is.
    opts.aspect = Math.min(0.55, 7.5 / strandGeom(Object.assign({ ks: [0, 0, 0, 0] }, opts)).s);
    var geo = strandGeom(Object.assign({ ks: [0, 0, 0, 0] }, opts));
    var to = progressKs(B.step);
    var from = sheet.path._ks || to;
    tweenStrand(sheet.path, opts, from, to, animate ? 900 : 0);
    sheet.labels.innerHTML = STEPS.map(function (label, i) {
      var cls = B.step > i + 1 ? 'is-done' : B.step === i + 1 ? 'is-current' : '';
      return '<li class="' + cls + '" style="left:' + (geo.loopX(i) / w * 100).toFixed(2) + '%">' + label + '</li>';
    }).join('');
  }

  function currentPrice() {
    if (!B.svc) return null;
    var svc = svcById[B.svc];
    var who = B.assigned || (B.who && B.who !== 'any' ? B.who : null);
    if (who) return money(priceFor(svc, B.len, who));
    return rangeText(rangeFor(svc, B.len));
  }

  function renderSummary() {
    if (B.step === 5) { sheet.summary.innerHTML = ''; return; }
    if (!B.svc) {
      sheet.summary.innerHTML = '<span class="summary-what">' + (B.presetWho ? 'Booking with <b>' + esc(staffById[B.presetWho].first) + '</b>. Pick a service to see the price.' : 'Pick a service to see the price and time.') + '</span>';
      return;
    }
    var svc = svcById[B.svc];
    var bits = ['<b>' + esc(svc.name) + '</b>'];
    if (!svc.shortOnly && typeof svc.mins !== 'number') bits.push(B.len + ' hair');
    var who = B.assigned || (B.who === 'any' ? 'anyone' : B.who);
    if (who) bits.push(who === 'anyone' ? 'anyone free' : staffById[who].first);
    if (B.day && B.start != null) bits.push(fmtDay(fromKey(B.day)) + ', ' + fmtMin(B.start));
    bits.push(fmtDur(minsFor(svc, B.len)));
    sheet.summary.innerHTML = '<span class="summary-what">' + bits.join(' · ') + '</span><span class="summary-price">' + currentPrice() + '</span>';
  }

  function canContinue() {
    if (B.step === 1) return !!B.svc;
    if (B.step === 2) return !!B.who;
    if (B.step === 3) return B.start != null;
    return true;
  }

  function renderActions() {
    var html = '';
    if (B.step === 5) {
      html = '<button class="btn btn-ghost" type="button" data-ics>Add to calendar</button><button class="btn btn-claret" type="button" data-done>Done</button>';
    } else {
      if (B.step > 1) html += '<button class="btn btn-ghost" type="button" data-back>Back</button>';
      var label = B.step === 4 ? (B.busy ? '<span class="spinner" aria-hidden="true"></span>Booking your chair…' : 'Confirm booking') : 'Continue';
      html += '<button class="btn btn-claret" type="button" data-next' + (B.busy ? ' aria-busy="true"' : canContinue() ? '' : ' aria-disabled="true"') + '>' + label + '</button>';
    }
    sheet.actions.innerHTML = html;
  }

  function render(focus, animate) {
    drawProgress(animate);
    $('#sheet-title').textContent = B.step === 5 ? 'Booked' : 'Book a chair';
    var html = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5][B.step - 1]();
    sheet.body.innerHTML = html;
    renderSummary();
    renderActions();
    if (focus) {
      sheet.body.scrollTop = 0;
      var h = $('.step-h', sheet.body);
      if (h) h.focus({ preventScroll: true });
    }
  }

  // Step 1: hair length and service.
  function renderStep1() {
    var preset = B.presetWho ? staffById[B.presetWho] : null;
    var html = '<h3 class="step-h" tabindex="-1">What are we doing?</h3>';
    html += preset ? '<p class="step-note">' + ICON.info + '<span>Booking with <b>' + esc(preset.first) + '</b>. These are the things ' + esc(preset.first) + ' does; prices are ' + esc(preset.first) + '’s.</span></p>'
      : '<p class="step-sub">Prices run from Isla, our graduate, to Morven. You’ll see the exact price when you pick who.</p>';
    var fixed = B.svc && typeof svcById[B.svc].mins === 'number';
    html += '<p class="step-note len-note" data-len-note' + (fixed ? '' : ' hidden') + '>' + ICON.info + '<span>Hair length doesn’t change the time or price of this one.</span></p>';
    html += '<div class="field" data-len-field style="margin-bottom:6px"' + (fixed ? ' hidden' : '') + '><p class="length-label" id="bk-len-label">How long is your hair?</p><div class="seg" role="group" aria-labelledby="bk-len-label">' + segHTML('bk-len', D.lengths, B.len) + '</div></div>';
    var groups = D.categories.concat([{ id: 'none', label: 'Not sure yet?' }]);
    groups.forEach(function (c) {
      var list = D.services.filter(function (s) { return s.cat === c.id && (!preset || s.who.indexOf(preset.id) !== -1); });
      if (!list.length) return;
      html += '<div class="svc-group" role="group" aria-label="' + esc(c.label) + '"><h3>' + esc(c.label) + '</h3><div class="svc-list">' + list.map(function (s) {
        var price = preset ? money(priceFor(s, B.len, preset.id)) : rangeText(rangeFor(s, B.len));
        var meta = fmtDur(minsFor(s, B.len)) + (s.shortOnly ? ' · short hair only' : '') + ' · ' + esc(s.blurb);
        return '<button class="opt" type="button" data-svc="' + s.id + '" aria-pressed="' + (B.svc === s.id) + '"><span class="opt-name">' + esc(s.name) + '</span><span class="opt-meta">' + meta + '</span><span class="opt-price">' + price + '</span></button>';
      }).join('') + '</div></div>';
    });
    return html;
  }

  // Step 2: who.
  function renderStep2() {
    var svc = svcById[B.svc], mins = minsFor(svc, B.len);
    var html = '<h3 class="step-h" tabindex="-1">Who would you like?</h3><p class="step-sub">' + esc(svc.name) + ' for ' + B.len + ' hair takes about ' + fmtDur(mins) + '.</p><div class="who-list">';
    var r = rangeFor(svc, B.len);
    var anyNext = null;
    svc.who.forEach(function (id) { var n = nextFree(id, mins); if (n && (!anyNext || n.day < anyNext.day || (+n.day === +anyNext.day && n.start < anyNext.start))) anyNext = n; });
    html += '<button class="opt opt-who" type="button" data-who="any" aria-pressed="' + (B.who === 'any') + '"><span class="any-mark" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="16.5" cy="9" r="2.6"/><path d="M15.2 14.2c2.7-.4 4.7 1.2 5.3 4.3"/></svg></span>' +
      '<span class="opt-name">Anyone free</span><span class="opt-meta">' + (anyNext ? 'First free ' + relDay(anyNext.day) + ', ' + fmtMin(anyNext.start) : 'Check the times') + '</span><span class="opt-price">' + rangeText(r) + '</span></button>';
    svc.who.forEach(function (id) {
      var p = staffById[id], n = nextFree(id, mins);
      html += '<button class="opt opt-who" type="button" data-who="' + id + '" aria-pressed="' + (B.who === id) + '"><img src="assets/img/' + p.img + '-420.webp" alt="" width="56" height="56">' +
        '<span class="opt-name">' + esc(p.name) + '</span><span class="opt-meta">' + esc(D.levels[p.level].label) + ' · ' + (n ? 'next free ' + relDay(n.day) + ', ' + fmtMin(n.start) : 'no times in the next four weeks') + '</span>' +
        '<span class="opt-price">' + money(priceFor(svc, B.len, id)) + '</span></button>';
    });
    html += '</div>';
    var not = D.team.filter(function (p) { return svc.who.indexOf(p.id) === -1; }).map(function (p) { return p.id; });
    if (not.length) html += '<p class="who-skip">' + esc(namesList(not)) + (not.length > 1 ? ' don’t' : ' doesn’t') + ' do this one.</p>';
    return html;
  }

  // Step 3: day and time.
  function dayInfo(d) {
    var svc = svcById[B.svc], mins = minsFor(svc, B.len);
    if (!D.hours[d.getDay()]) return { state: 'closed', label: 'Closed', n: 0 };
    if (B.who === 'any') {
      var a = anyStarts(svc, B.len, d);
      return a.length ? { state: 'open', label: a.length + ' free', n: a.length, slots: a } : { state: 'full', label: 'Full', n: 0 };
    }
    var f = freeStarts(B.who, d, mins);
    if (f === null) return { state: 'off', label: 'Not in', n: 0 };
    return f.length ? { state: 'open', label: f.length + ' free', n: f.length, slots: f.map(function (m) { return { start: m, who: B.who }; }) } : { state: 'full', label: 'Full', n: 0 };
  }

  function renderStep3() {
    var days = [];
    for (var i = 0; i < 21; i++) days.push(addDays(TODAY, i));
    var infos = days.map(dayInfo);
    if (!B.day) {
      for (var j = 0; j < days.length; j++) if (infos[j].n) { B.day = dayKey(days[j]); break; }
    }
    var whoTxt = B.who === 'any' ? 'whoever is free' : staffById[B.who].first;
    var months = [];
    days.forEach(function (d) { var m = MONTHS_LONG[d.getMonth()]; if (months.indexOf(m) === -1) months.push(m); });
    var html = '<h3 class="step-h" tabindex="-1">When suits you?</h3><p class="step-sub">Times with ' + esc(whoTxt) + ' over the next three weeks. ' + esc(months.join(' and ')) + '.</p>';
    if (B.notice) { html += '<p class="form-alert" role="alert">' + esc(B.notice) + '</p>'; B.notice = null; }
    html += '<div class="days" role="group" aria-label="Choose a day">' + days.map(function (d, k) {
      var inf = infos[k], key = dayKey(d);
      var dis = !inf.n;
      return '<button class="day" type="button" data-day="' + key + '" aria-pressed="' + (B.day === key) + '"' + (dis ? ' disabled' : '') + ' aria-label="' + fmtDayLong(d) + ', ' + inf.label + '">' +
        '<small>' + (k === 0 ? 'Today' : DAYS[d.getDay()]) + '</small><b>' + d.getDate() + '</b><em>' + inf.label + '</em></button>';
    }).join('') + '</div>';

    var sel = B.day ? infos[days.findIndex(function (d) { return dayKey(d) === B.day; })] : null;
    if (!sel || !sel.n) {
      html += '<p class="slots-empty">No free times in the next three weeks with ' + esc(whoTxt) + '. Try “Anyone free”, or call us on ' + D.salon.phone + ' and we’ll squeeze you in if we can.</p>';
      return html;
    }
    var groups = [{ label: 'Morning', test: function (m) { return m < 720; } }, { label: 'Afternoon', test: function (m) { return m >= 720 && m < 1020; } }, { label: 'Evening', test: function (m) { return m >= 1020; } }];
    html += '<div aria-live="polite">';
    groups.forEach(function (g) {
      var list = sel.slots.filter(function (s) { return g.test(s.start); });
      if (!list.length) return;
      html += '<div class="slots-group"><h3>' + g.label + '</h3><div class="slots">' + list.map(function (s) {
        var on = B.start === s.start;
        return '<button class="slot" type="button" data-time="' + fmtMin(s.start) + '" data-slot-who="' + s.who + '" aria-pressed="' + on + '">' + fmtMin(s.start) + (B.who === 'any' ? '<small>' + esc(staffById[s.who].first) + '</small>' : '') + '</button>';
      }).join('') + '</div></div>';
    });
    html += '</div>';
    return html;
  }

  // Step 4: details.
  function fieldHTML(id, label, type, value, extra) {
    var err = B.errors[id];
    return '<div class="field' + (err ? ' is-invalid' : '') + '"><label for="bk-' + id + '">' + label + '</label>' +
      '<input id="bk-' + id + '" name="' + id + '" type="' + type + '" value="' + esc(value) + '" ' + (extra || '') + (err ? ' aria-invalid="true" aria-describedby="bk-' + id + '-err"' : '') + '>' +
      (err ? '<p class="field-err" id="bk-' + id + '-err">' + esc(err) + '</p>' : '') + '</div>';
  }

  function renderStep4() {
    var d = B.d, svc = svcById[B.svc];
    var html = '<h3 class="step-h" tabindex="-1">Your details</h3><p class="step-sub">So we can text you a reminder, and call if something changes. We don’t share them.</p>';
    if (Object.keys(B.errors).length) html += '<p class="form-alert" role="alert">Please check the ' + (Object.keys(B.errors).length === 1 ? 'highlighted field' : Object.keys(B.errors).length + ' highlighted fields') + '.</p>';
    html += '<div class="form" data-form>';
    html += '<div class="form-row">' + fieldHTML('first', 'First name', 'text', d.first, 'autocomplete="given-name"') + fieldHTML('last', 'Last name', 'text', d.last, 'autocomplete="family-name"') + '</div>';
    html += fieldHTML('mobile', 'Mobile', 'tel', d.mobile, 'autocomplete="tel" inputmode="tel"');
    html += fieldHTML('email', 'Email', 'email', d.email, 'autocomplete="email"');
    var verr = B.errors.visit;
    html += '<fieldset class="field' + (verr ? ' is-invalid' : '') + '"' + (verr ? ' aria-describedby="bk-visit-err"' : '') + '><legend>Have you been to Fankle before?</legend><div class="radios">' +
      '<label class="radio"><input type="radio" name="visit" value="first"' + (d.visit === 'first' ? ' checked' : '') + '><span>No, first time</span></label>' +
      '<label class="radio"><input type="radio" name="visit" value="back"' + (d.visit === 'back' ? ' checked' : '') + '><span>Yes, I’ve been before</span></label></div>' +
      (verr ? '<p class="field-err" id="bk-visit-err">' + esc(verr) + '</p>' : '') + '</fieldset>';
    if (svc.colour && d.visit === 'first') html += '<p class="step-note">' + ICON.drop + '<span>First colour with us? Pop in for a two-minute skin test at least 48 hours before. No appointment needed, any time we’re open.</span></p>';
    html += '<div class="field"><label for="bk-notes">Anything we should know? <span class="opt-hint">(optional)</span></label><textarea id="bk-notes" name="notes" placeholder="Last colour, a sensitive scalp, photos you’ll bring">' + esc(d.notes) + '</textarea></div>';
    html += '<label class="check"><input type="checkbox" name="remind"' + (d.remind ? ' checked' : '') + '><span>Text me a reminder the day before</span></label>';
    html += '</div>';
    return html;
  }

  // Step 5: done.
  function renderStep5() {
    var svc = svcById[B.svc], who = staffById[B.assigned], d = fromKey(B.day), mins = minsFor(svc, B.len);
    var lenTxt = typeof svc.mins === 'number' ? '' : ', ' + B.len + ' length';
    var html = '<div class="done"><h3 class="step-h done-h" tabindex="-1">You’re booked in, ' + esc(B.d.first) + '.</h3>' +
      '<p class="done-sub">We’ve saved your chair. We’ll text ' + esc(B.d.mobile) + ' to confirm' + (B.d.remind ? ', and again the day before.' : '.') + '</p>' +
      '<div class="ticket"><p class="ticket-date">' + fmtDayLong(d) + '</p><p class="ticket-time">' + fmtMin(B.start) + '–' + fmtMin(B.start + mins) + '</p>' +
      '<dl><div><dt>Service</dt><dd>' + esc(svc.name) + esc(lenTxt) + '</dd></div><div><dt>With</dt><dd>' + esc(who.name) + '</dd></div>' +
      '<div><dt>Price</dt><dd>' + money(priceFor(svc, B.len, who.id)) + ', pay on the day</dd></div><div><dt>Reference</dt><dd>' + esc(B.ref) + '</dd></div></dl></div>' +
      '<ul class="done-list">';
    if (svc.colour && B.d.visit === 'first') html += '<li>' + ICON.drop + '<span>Skin test first: pop in any time we’re open, at least 48 hours before.</span></li>';
    html += '<li>' + ICON.clock + '<span>Need to change it? Call ' + D.salon.phone + ' or reply to the text. Please give us 24 hours’ notice.</span></li>' +
      '<li>' + ICON.pin + '<span>11 Chandlers Wynd, two minutes from The Shore tram stop.</span></li></ul></div>';
    return html;
  }

  function validate() {
    var d = B.d, e = {};
    if (!d.first.trim()) e.first = 'Please add your first name.';
    if (!d.last.trim()) e.last = 'Please add your last name.';
    var mob = d.mobile.replace(/[\s()-]/g, '');
    if (!mob) e.mobile = 'We need a mobile number to text your reminder.';
    else if (!/^(\+44|0)7\d{9}$/.test(mob)) e.mobile = 'That doesn’t look like a UK mobile. It should start 07 and have 11 digits.';
    if (!d.email.trim()) e.email = 'Please add your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = 'Please check your email address.';
    if (!d.visit) e.visit = 'Let us know so we can plan the time.';
    B.errors = e;
    return !Object.keys(e).length;
  }

  function makeRef() {
    if (TOUR) return 'FK-7Q4M';
    var c = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', s = 'FK-';
    for (var i = 0; i < 4; i++) s += c[Math.floor(Math.random() * c.length)];
    return s;
  }

  function go(step) {
    B.step = step;
    render(true, true);
  }

  function onActionClick(e) {
    var t = e.target.closest('button');
    if (!t) return;
    if (t.hasAttribute('data-back')) { B.errors = {}; go(B.step - 1); return; }
    if (t.hasAttribute('data-done')) { closeBooking(); return; }
    if (t.hasAttribute('data-ics')) { downloadIcs(); return; }
    if (t.hasAttribute('data-next')) {
      if (B.busy) return;
      if (!canContinue()) {
        var msg = { 1: 'Pick a service first.', 2: 'Pick who you’d like, or anyone free.', 3: 'Pick a time first.' }[B.step];
        sheet.summary.innerHTML = '<span class="summary-what"><b>' + msg + '</b></span>';
        return;
      }
      if (B.step === 2 && B.who !== 'any') B.assigned = B.who;
      if (B.step < 4) { go(B.step + 1); return; }
      var fits = B.assigned && B.day && (freeStarts(B.assigned, fromKey(B.day), minsFor(svcById[B.svc], B.len)) || []).indexOf(B.start) !== -1;
      if (!fits) {
        B.start = null; B.notice = 'That time no longer fits a ' + fmtDur(minsFor(svcById[B.svc], B.len)) + ' appointment. Please pick another.';
        go(3);
        return;
      }
      if (!validate()) {
        render(false);
        var firstErr = $('[aria-invalid="true"], fieldset.is-invalid input', sheet.body);
        if (firstErr) firstErr.focus();
        return;
      }
      B.busy = true;
      renderActions();
      setTimeout(function () {
        B.busy = false;
        B.ref = makeRef();
        var booking = { svc: B.svc, len: B.len, who: B.assigned, day: B.day, start: B.start, mins: minsFor(svcById[B.svc], B.len), ref: B.ref, first: B.d.first };
        userBookings.push(booking);
        saveBooking(booking);
        go(5);
      }, reduced ? 300 : 1100);
    }
  }

  function onBodyClick(e) {
    var t = e.target.closest('button');
    if (!t || t.disabled) return;
    var keepScroll = sheet.body.scrollTop;
    if (t.hasAttribute('data-bk-len')) {
      var len = t.getAttribute('data-bk-len');
      if (len !== B.len) { B.day = null; B.start = null; B.assigned = B.who && B.who !== 'any' ? B.who : null; }
      B.len = len;
      render(false);
      sheet.body.scrollTop = keepScroll;
      var again = $('[data-bk-len="' + B.len + '"]', sheet.body); if (again) again.focus({ preventScroll: true });
      return;
    }
    if (t.hasAttribute('data-svc')) {
      if (B.svc !== t.getAttribute('data-svc')) { B.day = null; B.start = null; B.assigned = null; }
      B.svc = t.getAttribute('data-svc');
      if (B.presetWho && svcById[B.svc].who.indexOf(B.presetWho) !== -1) B.who = B.presetWho;
      else if (B.who && B.who !== 'any' && svcById[B.svc].who.indexOf(B.who) === -1) B.who = null;
      $$('[data-svc]', sheet.body).forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); });
      var isFixed = typeof svcById[B.svc].mins === 'number';
      $('[data-len-field]', sheet.body).hidden = isFixed;
      $('[data-len-note]', sheet.body).hidden = !isFixed;
      renderSummary(); renderActions();
      return;
    }
    if (t.hasAttribute('data-who')) {
      var w = t.getAttribute('data-who');
      if (w !== B.who) { B.day = null; B.start = null; B.assigned = w === 'any' ? null : w; }
      B.who = w;
      $$('[data-who]', sheet.body).forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); });
      renderSummary(); renderActions();
      return;
    }
    if (t.hasAttribute('data-day')) {
      B.day = t.getAttribute('data-day'); B.start = null; if (B.who === 'any') B.assigned = null;
      var sl = sheet.days ? sheet.days.scrollLeft : 0;
      render(false);
      sheet.body.scrollTop = keepScroll;
      var days = $('.days', sheet.body); if (days) days.scrollLeft = sl;
      var btn = $('[data-day="' + B.day + '"]', sheet.body); if (btn) btn.focus({ preventScroll: true });
      return;
    }
    if (t.hasAttribute('data-time')) {
      B.start = toMin(t.getAttribute('data-time'));
      B.assigned = t.getAttribute('data-slot-who');
      $$('[data-time]', sheet.body).forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); });
      renderSummary(); renderActions();
    }
  }

  // Keep the day strip's scroll position when re-rendering.
  document.addEventListener('scroll', function (e) { if (e.target && e.target.classList && e.target.classList.contains('days')) { sheet.days = e.target; } }, true);

  function onBodyInput(e) {
    var t = e.target;
    if (!t.name) return;
    if (t.type === 'checkbox') B.d[t.name] = t.checked;
    else B.d[t.name] = t.value;
    if (B.errors[t.name] && e.type === 'change') {
      delete B.errors[t.name];
    }
    if (t.name === 'visit') {
      var keep = sheet.body.scrollTop;
      render(false);
      sheet.body.scrollTop = keep;
      var r = $('input[name="visit"]:checked', sheet.body); if (r) r.focus({ preventScroll: true });
    }
  }

  function downloadIcs() {
    var svc = svcById[B.svc], who = staffById[B.assigned], d = fromKey(B.day), mins = minsFor(svc, B.len);
    function lastSunday(y, mo) { var x = new Date(Date.UTC(y, mo + 1, 0)); return x.getUTCDate() - x.getUTCDay(); }
    function utc(day, m) {
      var y = day.getFullYear(), mo = day.getMonth(), dd = day.getDate();
      var asUtc = Date.UTC(y, mo, dd, Math.floor(m / 60), m % 60);
      var bstStart = Date.UTC(y, 2, lastSunday(y, 2), 1), bstEnd = Date.UTC(y, 9, lastSunday(y, 9), 1);
      var offset = asUtc - 3600000 >= bstStart && asUtc - 3600000 < bstEnd ? 3600000 : 0;
      return new Date(asUtc - offset);
    }
    function stamp(dt) { return dt.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'; }
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fankle//Booking//EN', 'BEGIN:VEVENT',
      'UID:' + B.ref + '@fanklehair.example', 'DTSTAMP:' + stamp(TOUR ? utc(TODAY, NOW_MIN) : new Date()),
      'DTSTART:' + stamp(utc(d, B.start)), 'DTEND:' + stamp(utc(d, B.start + mins)),
      'SUMMARY:' + svc.name + ' with ' + who.first + ' at Fankle',
      'LOCATION:11 Chandlers Wynd\\, Leith\\, Edinburgh EH6 6ZZ',
      'DESCRIPTION:Reference ' + B.ref + '. To change\\, call ' + D.salon.phone + '.',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'fankle-' + B.ref.toLowerCase() + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
  }

  function afterBooked() {
    var b = userBookings[userBookings.length - 1];
    if (!b) return;
    renderTicket(b);
    renderBoard();
    settleHeroStrand();
  }

  // ---------- Wiring ----------
  function init() {
    drawStatic();
    initHeroStrand();
    openStatus();
    hoursTable();
    renderLengthSegs();
    renderLevelSeg();
    renderHomePrices(false);
    renderServicesPage(false);
    renderLevelFaces();
    renderTeam();
    renderReviews();
    var saved = loadBooking();
    if (saved) { userBookings.push(saved); renderTicket(saved); settleHeroStrand(true); }
    renderBoard();
    initHeader();

    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-book], [data-book-who], [data-book-svc], [data-len], [data-level]');
      if (!t) return;
      if (t.hasAttribute('data-len')) { setLength(t.getAttribute('data-len')); return; }
      if (t.hasAttribute('data-level')) {
        state.level = t.getAttribute('data-level');
        renderLevelSeg(); renderServicesPage(true);
        return;
      }
      if (t.closest('.sheet')) return;
      e.preventDefault();
      openBooking({ who: t.getAttribute('data-book-who') || null, svc: t.getAttribute('data-book-svc') || null });
    });

    // Lazy images switch to eager once the page settles, so full-page captures never show gaps.
    window.addEventListener('load', function () { setTimeout(function () { $$('img[loading="lazy"]').forEach(function (i) { i.loading = 'eager'; }); }, 600); });
  }

  window.Fankle = { openBooking: openBooking, closeBooking: closeBooking, setLength: setLength, now: NOW };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
