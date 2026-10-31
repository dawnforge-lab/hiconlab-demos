/* Fanlight Dental: site behaviour.
   Header and mobile menu, today's hours, the smile illustration, the town map
   status, the finance calculator and the booking dialog. No backend: the booking
   confirms locally with a reference. */
(function () {
  'use strict';

  var F = window.FANLIGHT;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Tours always play on the same Tuesday morning, so the video never dates.
  var TOUR = !!(window.HiconTour && window.HiconTour.active);
  function clock() { return TOUR ? new Date(2026, 10, 10, 9, 20) : new Date(); }
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hhmm(mins) { return pad(Math.floor(mins / 60)) + ':' + pad(mins % 60); }
  function toMins(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  function money(n) {
    var fixed = Math.abs(n % 1) > 0.001 ? n.toFixed(2) : String(Math.round(n));
    return '£' + fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function icon(name, cls) {
    return '<svg class="' + (cls || '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>';
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }
  function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function longDate(d) { return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS_LONG[d.getMonth()]; }
  function shortDate(d) { return DAYS_SHORT[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }

  /* ------------------------------------------------------------------ */
  /* Header: sticky state, mobile menu                                   */
  /* ------------------------------------------------------------------ */
  var header = $('.site-header');
  function setHeaderH() {
    if (header) document.documentElement.style.setProperty('--header-h', header.getBoundingClientRect().bottom > 0 ? Math.round(header.getBoundingClientRect().bottom) + 'px' : '68px');
  }
  if (header) {
    var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var toggle = $('.menu-toggle');
  var menu = $('#mobile-menu');
  if (toggle && menu) {
    var closeMenu = function (focusToggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.querySelector('.label-text').textContent = 'Menu';
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
      if (focusToggle) toggle.focus();
    };
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      if (open) { closeMenu(false); return; }
      setHeaderH();
      toggle.setAttribute('aria-expanded', 'true');
      toggle.querySelector('.label-text').textContent = 'Close';
      menu.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      var first = menu.querySelector('a, button');
      if (first) first.focus();
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a, [data-book]')) closeMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (!menu.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeMenu(true); return; }
      if (e.key !== 'Tab') return;
      var items = [toggle].concat($$('a[href], button:not([disabled])', menu));
      var i = items.indexOf(document.activeElement);
      var next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === -1 || i === items.length - 1 ? 0 : i + 1);
      e.preventDefault();
      items[next].focus();
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080 && menu.classList.contains('is-open')) closeMenu(false); });
  }

  /* ------------------------------------------------------------------ */
  /* Opening hours: today, open now, the hours table                     */
  /* ------------------------------------------------------------------ */
  function openState(now) {
    var mins = now.getHours() * 60 + now.getMinutes();
    var today = F.hours[now.getDay()];
    if (today && mins >= today[0] && mins < today[1]) return { open: true, text: 'Open now until ' + hhmm(today[1]) };
    for (var i = 0; i < 8; i++) {
      var d = new Date(now); d.setDate(now.getDate() + i);
      var h = F.hours[d.getDay()];
      if (!h) continue;
      if (i === 0 && mins >= h[0]) continue;
      var when = i === 0 ? 'today' : i === 1 ? 'tomorrow' : DAYS[d.getDay()];
      return { open: false, text: 'Closed now · opens ' + when + ' at ' + hhmm(h[0]) };
    }
    return { open: false, text: 'Closed now' };
  }
  var now = clock();
  var state = openState(now);
  $$('[data-open-status]').forEach(function (el) {
    el.textContent = state.text;
    el.classList.toggle('is-closed', !state.open);
  });
  $$('[data-open-dot]').forEach(function (el) { el.classList.toggle('is-closed', !state.open); });
  $$('[data-closed-only]').forEach(function (el) { el.hidden = state.open; });
  $$('.hours tr[data-day]').forEach(function (tr) {
    if (+tr.getAttribute('data-day') === now.getDay()) tr.classList.add('is-today');
  });

  /* ------------------------------------------------------------------ */
  /* Availability (deterministic, so the same day shows the same slots)  */
  /* ------------------------------------------------------------------ */
  function openDays(reasonKey, from) {
    var r = F.reasons[reasonKey];
    var out = [];
    var limit = r.emergency ? 2 : 10;
    for (var i = 0; i < 21 && out.length < limit; i++) {
      var d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
      var h = F.hours[d.getDay()];
      if (!h) continue;
      var slots = slotsFor(reasonKey, d, from);
      if (!slots.some(function (s) { return s.free; })) { if (r.emergency && i === 0) continue; if (!r.emergency) continue; }
      out.push({ date: d, slots: slots });
    }
    return out;
  }

  function slotsFor(reasonKey, d, from, isNew) {
    var r = F.reasons[reasonKey];
    var h = F.hours[d.getDay()];
    if (!h) return [];
    var mins = isNew && r.newMins ? r.newMins : r.mins;
    var isToday = dateKey(d) === dateKey(from);
    var earliest = isToday ? from.getHours() * 60 + from.getMinutes() + 60 : 0;
    var key = dateKey(d);
    var list = [];
    if (r.emergency) {
      var times = d.getDay() === 6 ? F.emergencySlots.saturday : F.emergencySlots.weekday;
      times.forEach(function (t, i) {
        var m = toMins(t);
        var free = m >= earliest && (hash(key + t + 'em') % 100) > 22;
        list.push({ time: t, mins: m, free: free, who: r.with[i % r.with.length], emergency: true });
      });
      return list;
    }
    for (var m = h[0]; m + mins <= h[1]; m += 30) {
      if (m < F.lunch[1] && m + mins > F.lunch[0]) continue;
      var t = hhmm(m);
      var taken = (hash(key + t + reasonKey) % 100) < 58;
      list.push({ time: t, mins: m, free: !taken && m >= earliest, who: r.with[hash(key + t) % r.with.length] });
    }
    return list;
  }

  // Hero note: the next free check-up.
  var nextEl = $('[data-next-checkup]');
  if (nextEl) {
    var days = openDays('checkup', now);
    var found = null;
    for (var di = 0; di < days.length && !found; di++) {
      for (var si = 0; si < days[di].slots.length; si++) {
        if (days[di].slots[si].free) { found = { d: days[di].date, s: days[di].slots[si] }; break; }
      }
    }
    if (found) {
      nextEl.textContent = shortDate(found.d) + ', ' + found.s.time;
      nextEl.setAttribute('data-date', dateKey(found.d));
      nextEl.setAttribute('data-time', found.s.time);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Smile illustration                                                  */
  /* ------------------------------------------------------------------ */
  // Upper front teeth, left to right, seen from the front. cerv is where the gum
  // meets the middle of the tooth, bot is the biting edge. layer sets the drawing
  // order (centrals in front). dx, dy, r are the crowded starting position.
  var TEETH = [
    { w: 28, cerv: 62, bot: 128, t: 'pm', layer: 0, dx: 0, dy: 1, r: -2 },
    { w: 32, cerv: 60, bot: 134, t: 'pm', layer: 1, dx: 1, dy: 2, r: 3 },
    { w: 40, cerv: 52, bot: 146, t: 'c', layer: 2, dx: 5, dy: -5, r: -6 },
    { w: 44, cerv: 60, bot: 140, t: 'l', layer: 3, dx: 9, dy: 3, r: 11 },
    { w: 56, cerv: 55, bot: 152, t: 'i', layer: 4, dx: 3, dy: 2, r: -5 },
    { w: 56, cerv: 55, bot: 152, t: 'i', layer: 4, dx: -4, dy: 0, r: 6 },
    { w: 44, cerv: 60, bot: 140, t: 'l', layer: 3, dx: -10, dy: 4, r: -12 },
    { w: 40, cerv: 52, bot: 146, t: 'c', layer: 2, dx: -4, dy: -5, r: 6 },
    { w: 32, cerv: 60, bot: 134, t: 'pm', layer: 1, dx: -1, dy: 2, r: -3 },
    { w: 28, cerv: 62, bot: 128, t: 'pm', layer: 0, dx: 0, dy: 0, r: 2 },
  ];
  function n(v) { return Math.round(v * 10) / 10; }
  function toothPath(x, w, cerv, b, t) {
    var y0 = cerv - 18, i = w * 0.1, L = x + 1, R = x + w - 1;
    var p = 'M' + n(x + i) + ',' + y0 + ' C' + n(x + i * 0.3) + ',' + (cerv + 10) + ' ' + L + ',' + (b - 36) + ' ' + L + ',' + (b - 14);
    if (t === 'i' || t === 'l') {
      var rr = t === 'i' ? 9 : 14;
      p += ' Q' + L + ',' + b + ' ' + (L + rr) + ',' + b + ' C' + n(x + w * 0.38) + ',' + (b + 1.5) + ' ' + n(x + w * 0.62) + ',' + (b + 1.5) + ' ' + (R - rr) + ',' + b + ' Q' + R + ',' + b + ' ' + R + ',' + (b - 14);
    } else if (t === 'c') {
      p += ' C' + (L + 1) + ',' + (b - 6) + ' ' + n(x + w * 0.3) + ',' + (b - 3) + ' ' + n(x + w * 0.52) + ',' + b + ' C' + n(x + w * 0.74) + ',' + (b - 3) + ' ' + (R - 1) + ',' + (b - 6) + ' ' + R + ',' + (b - 14);
    } else {
      p += ' C' + (L + 1) + ',' + (b - 2) + ' ' + n(x + w * 0.3) + ',' + b + ' ' + n(x + w * 0.5) + ',' + b + ' C' + n(x + w * 0.7) + ',' + b + ' ' + (R - 1) + ',' + (b - 2) + ' ' + R + ',' + (b - 14);
    }
    return p + ' C' + R + ',' + (b - 36) + ' ' + n(x + w - i * 0.3) + ',' + (cerv + 10) + ' ' + n(x + w - i) + ',' + y0 + ' Z';
  }
  function buildSmile(svg) {
    var gap = 2, total = -gap;
    TEETH.forEach(function (t) { total += t.w + gap; });
    var x = (480 - total) / 2;
    var groups = [];
    TEETH.forEach(function (t) {
      var cx = x + t.w / 2;
      var cuffTop = t.cerv - 20;
      var g = '<g class="tooth-g" style="--dx:' + t.dx + ';--dy:' + t.dy + ';--r:' + t.r + ';--ox:' + n(cx) + 'px;--oy:' + t.cerv + 'px">' +
        '<path class="tooth" d="' + toothPath(x, t.w, t.cerv, t.bot, t.t) + '"/>' +
        (t.t === 'i' || t.t === 'l' ? '<path class="shine" d="M' + n(x + t.w * 0.3) + ',' + (t.cerv + 18) + ' q-2,20 1,' + (t.bot - t.cerv - 44) + '"/>' : '') +
        '<path class="gum-cuff" d="M' + n(x - 3) + ',' + cuffTop + ' L' + n(x - 3) + ',' + (t.cerv + 14) + ' Q' + n(cx) + ',' + (t.cerv - 12) + ' ' + n(x + t.w + 3) + ',' + (t.cerv + 14) + ' L' + n(x + t.w + 3) + ',' + cuffTop + ' Z"/>' +
        '<path class="gum-line" d="M' + n(x - 0.5) + ',' + (t.cerv + 12) + ' Q' + n(cx) + ',' + (t.cerv - 12) + ' ' + n(x + t.w + 0.5) + ',' + (t.cerv + 12) + '"/>' +
        '</g>';
      groups.push({ layer: t.layer, html: g });
      x += t.w + gap;
    });
    groups.sort(function (a, b) { return a.layer - b.layer; });
    var back = '<path class="gum-back" d="M6,76 C4,26 80,8 240,6 C400,8 476,26 474,76 L452,80 L28,80 Z"/>';
    var lip = '<path class="lip-line" d="M6,76 C4,26 80,8 240,6 C400,8 476,26 474,76"/>';
    svg.innerHTML = back + groups.map(function (g) { return g.html; }).join('') + lip;
    svg.setAttribute('viewBox', '-6 2 492 160');
  }
  $$('svg.smile').forEach(buildSmile);

  // Homepage: the smile straightens once, when it scrolls into view.
  $$('[data-smile-auto]').forEach(function (card) {
    var svg = $('svg.smile', card);
    var weekEl = $('[data-week]', card);
    var played = false;
    function play() {
      if (played) return;
      played = true;
      if (reduceMotion) { svg.style.setProperty('--k', '0'); if (weekEl) weekEl.textContent = 'Week 40'; return; }
      svg.classList.add('is-animated');
      requestAnimationFrame(function () { requestAnimationFrame(function () { svg.style.setProperty('--k', '0'); }); });
      if (weekEl) {
        var start = performance.now();
        (function tick(t) {
          var p = Math.min(1, (t - start) / 2200);
          weekEl.textContent = 'Week ' + Math.round(p * 20) * 2;
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      }
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting && en.intersectionRatio > 0.45) { play(); io.disconnect(); } });
      }, { threshold: [0, 0.45, 0.8] });
      io.observe(card);
    } else { play(); }
  });

  // Treatment page: drag through a typical plan.
  var viewer = $('[data-smile-viewer]');
  if (viewer) {
    var vSvg = $('svg.smile', viewer);
    var range = $('#plan-week', viewer);
    var vWeek = $('[data-week]', viewer);
    var vAligner = $('[data-aligner]', viewer);
    var update = function () {
      var w = +range.value;
      var p = w / 40;
      var k = 1 - (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
      vSvg.style.setProperty('--k', k.toFixed(3));
      vWeek.textContent = w === 0 ? 'Before you start' : w === 40 ? 'Week 40: finished' : 'Week ' + w;
      vAligner.textContent = w === 0 ? 'Scan and plan' : w === 40 ? 'Retainers from here' : 'Aligner ' + Math.ceil(w / 2) + ' of 20';
      range.setAttribute('aria-valuetext', vWeek.textContent + ', ' + vAligner.textContent);
    };
    range.addEventListener('input', update);
    update();
  }

  /* ------------------------------------------------------------------ */
  /* Finance calculator (treatment page)                                 */
  /* ------------------------------------------------------------------ */
  var calc = $('#finance-calc');
  if (calc) {
    var APR = 0.099;
    var out = {
      monthly: $('[data-out="monthly"]', calc), term: $('[data-out="term"]', calc),
      borrow: $('[data-out="borrow"]', calc), total: $('[data-out="total"]', calc), rep: $('[data-out="rep"]', calc),
    };
    function pence(v) { return '£' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    var run = function () {
      var price = +$('input[name="fc-plan"]:checked', calc).value;
      var deposit = +$('input[name="fc-deposit"]:checked', calc).value;
      var n = +$('input[name="fc-term"]:checked', calc).value;
      var borrow = price - deposit;
      var monthly, first, total, rateText, plan;
      if (n === 12) {
        // Interest free: round down to the penny and put the odd pennies on the first payment.
        monthly = Math.floor(borrow / 12 * 100) / 100;
        first = Math.round((borrow - monthly * 11) * 100) / 100;
        total = price;
        rateText = '0% APR, interest free';
      } else {
        var r = Math.pow(1 + APR, 1 / 12) - 1;
        monthly = Math.round(borrow * r / (1 - Math.pow(1 + r, -n)) * 100) / 100;
        first = monthly;
        total = Math.round((monthly * n + deposit) * 100) / 100;
        rateText = '9.9% APR representative';
      }
      plan = first !== monthly
        ? 'a first payment of ' + pence(first) + ', then ' + (n - 1) + ' of ' + pence(monthly)
        : n + ' payments of ' + pence(monthly);
      out.monthly.innerHTML = pence(monthly) + '<small> a month</small>';
      out.term.textContent = (first !== monthly ? 'First payment ' + pence(first) + ' · ' : n + ' monthly payments · ') + rateText;
      out.borrow.textContent = money(borrow);
      out.total.textContent = pence(total);
      out.rep.textContent = n === 12
        ? 'Example: treatment ' + money(price) + ', deposit ' + money(deposit) + ', borrowing ' + money(borrow) + ' over 12 months at 0% APR: ' + plan + '. Total payable ' + pence(total) + '.'
        : 'Representative example: treatment ' + money(price) + ', deposit ' + money(deposit) + ', borrowing ' + money(borrow) + ' over ' + n + ' months at a fixed rate of 9.48% a year, 9.9% APR representative: ' + plan + '. Total payable ' + pence(total) + ' including the deposit.';
    };
    calc.addEventListener('change', run);
    run();
  }

  /* ------------------------------------------------------------------ */
  /* Booking dialog                                                      */
  /* ------------------------------------------------------------------ */
  var dlg = document.createElement('dialog');
  dlg.className = 'booking';
  dlg.id = 'booking';
  dlg.setAttribute('aria-labelledby', 'bk-title');
  dlg.innerHTML = [
    '<div class="bk-head">',
    '  <div><h2 id="bk-title">Book an appointment</h2><p class="bk-sub">Takes about two minutes. Nothing to pay now.</p></div>',
    '  <button type="button" class="bk-close" data-bk-close aria-label="Close booking">' + icon('close') + '</button>',
    '</div>',
    '<ol class="bk-steps" aria-label="Booking steps">',
    '  <li data-step-label="1">Reason</li><li data-step-label="2">Day and time</li><li data-step-label="3">Your details</li><li data-step-label="4">Booked</li>',
    '</ol>',
    '<div class="bk-body" tabindex="-1">',
    '  <section class="bk-step" data-step="1" aria-labelledby="bk-s1">',
    '    <h3 id="bk-s1" class="visually-hidden">Step 1 of 4: reason for your visit</h3>',
    '    <fieldset><legend>What would you like to book?</legend><div class="choices" data-reasons></div>',
    '      <p class="bk-hint" data-reason-hint aria-live="polite"></p></fieldset>',
    '    <fieldset><legend>Have you been to Fanlight before?</legend><div class="choices choices--two">',
    '      <label class="choice"><input type="radio" name="bk-patient" value="new"><span class="box"><span><strong>I’m new to Fanlight</strong><br><span class="meta">We’ll set up your records</span></span></span></label>',
    '      <label class="choice"><input type="radio" name="bk-patient" value="existing"><span class="box"><span><strong>I’m already a patient</strong><br><span class="meta">We’ll find your notes</span></span></span></label>',
    '    </div></fieldset>',
    '    <label class="bk-child"><input type="checkbox" name="bk-child"><span><strong>Booking for a child under 18?</strong><small>Children are seen on the NHS, free. We’ll ask for their details and a parent’s.</small></span></label>',
    '  </section>',
    '  <section class="bk-step" data-step="2" aria-labelledby="bk-s2" hidden>',
    '    <h3 id="bk-s2" class="visually-hidden">Step 2 of 4: day and time</h3>',
    '    <fieldset><legend>Pick a day</legend><div class="days" data-days role="group" aria-label="Days with free appointments"></div></fieldset>',
    '    <div data-slots aria-live="polite"></div>',
    '  </section>',
    '  <section class="bk-step" data-step="3" aria-labelledby="bk-s3" hidden>',
    '    <h3 id="bk-s3" class="visually-hidden">Step 3 of 4: your details</h3>',
    '    <div class="bk-recap" data-recap></div>',
    '    <div class="err-summary" data-err-summary role="alert" tabindex="-1"></div>',
    '    <form class="form-grid" data-details novalidate>',
    '      <div class="field" data-field="first"><label for="bk-first">First name</label><input id="bk-first" name="first" autocomplete="given-name" aria-describedby="bk-first-err" required><p class="err" id="bk-first-err">' + icon('alert') + '<span></span></p></div>',
    '      <div class="field" data-field="last"><label for="bk-last">Last name</label><input id="bk-last" name="last" autocomplete="family-name" aria-describedby="bk-last-err" required><p class="err" id="bk-last-err">' + icon('alert') + '<span></span></p></div>',
    '      <div class="field" data-field="dob" data-new-only><label for="bk-dob">Date of birth</label><input id="bk-dob" name="dob" inputmode="numeric" autocomplete="bday" placeholder="DD/MM/YYYY" aria-describedby="bk-dob-help bk-dob-err" required><p class="help" id="bk-dob-help">So we can set up your records.</p><p class="err" id="bk-dob-err">' + icon('alert') + '<span></span></p></div>',
    '      <div class="field field--full" data-field="parent" data-child-only hidden><label for="bk-parent">Parent or guardian’s full name</label><input id="bk-parent" name="parent" autocomplete="name" aria-describedby="bk-parent-help bk-parent-err"><p class="help" id="bk-parent-help">Under-16s need a parent or guardian with them at the appointment.</p><p class="err" id="bk-parent-err">' + icon('alert') + '<span></span></p></div>',
    '      <div class="field" data-field="mobile"><label for="bk-mobile">Mobile number</label><input id="bk-mobile" name="mobile" type="tel" inputmode="tel" autocomplete="tel" aria-describedby="bk-mobile-help bk-mobile-err" required><p class="help" id="bk-mobile-help">For your reminder text.</p><p class="err" id="bk-mobile-err">' + icon('alert') + '<span></span></p></div>',
    '      <div class="field field--full" data-field="email"><label for="bk-email">Email</label><input id="bk-email" name="email" type="email" autocomplete="email" aria-describedby="bk-email-err" required><p class="err" id="bk-email-err">' + icon('alert') + '<span></span></p></div>',
    '      <div class="field field--full"><label for="bk-notes">Anything we should know? <span class="opt">(optional)</span></label><textarea id="bk-notes" name="notes" rows="3" placeholder="For example, if you’re nervous, or where it hurts"></textarea></div>',
    '      <label class="check"><input type="checkbox" name="reminder" checked> Text me a reminder the day before</label>',
    '    </form>',
    '  </section>',
    '  <section class="bk-step" data-step="loading" hidden>',
    '    <div class="bk-loading" role="status"><svg class="fan-loader" viewBox="0 0 96 52" aria-hidden="true">' + loaderBars() + '</svg><p>Booking you in…</p></div>',
    '  </section>',
    '  <section class="bk-step" data-step="4" aria-labelledby="bk-done-title" hidden>',
    '    <div class="bk-done" data-done></div>',
    '  </section>',
    '</div>',
    '<div class="bk-foot">',
    '  <p class="bk-summary" data-summary aria-live="polite">Choose a reason to see times.</p>',
    '  <div class="btns">',
    '    <button type="button" class="btn btn--ghost" data-bk-back hidden>Back</button>',
    '    <button type="button" class="btn btn--ghost" data-ics hidden>' + icon('calendar') + ' Add to calendar</button>',
    '    <button type="button" class="btn" data-bk-next disabled>Continue ' + icon('arrow') + '</button>',
    '  </div>',
    '</div>',
  ].join('\n');
  document.body.appendChild(dlg);

  function loaderBars() {
    var s = '<path d="M4 50 A44 44 0 0 1 92 50" fill="none" stroke="currentColor" stroke-width="2" opacity=".35"/>';
    for (var i = 0; i < 7; i++) {
      var a = Math.PI - (Math.PI / 6) * i;
      var x1 = 48 + Math.cos(a) * 12, y1 = 50 - Math.sin(a) * 12;
      var x2 = 48 + Math.cos(a) * 43, y2 = 50 - Math.sin(a) * 43;
      s += '<line class="bar" style="animation-delay:' + (i * 0.12) + 's" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>';
    }
    return s + '<path d="M36 50 A12 12 0 0 1 60 50" fill="none" stroke="currentColor" stroke-width="2"/>';
  }

  var bk = { step: 1, reason: null, patient: null, days: [], dayIdx: 0, slot: null, opener: null, details: null };
  var els = {
    reasons: $('[data-reasons]', dlg), hint: $('[data-reason-hint]', dlg), days: $('[data-days]', dlg), slots: $('[data-slots]', dlg),
    summary: $('[data-summary]', dlg), next: $('[data-bk-next]', dlg), back: $('[data-bk-back]', dlg), recap: $('[data-recap]', dlg),
    form: $('[data-details]', dlg), errSummary: $('[data-err-summary]', dlg), done: $('[data-done]', dlg), body: $('.bk-body', dlg),
    foot: $('.bk-foot', dlg), ics: $('.bk-foot [data-ics]', dlg),
  };

  els.reasons.innerHTML = Object.keys(F.reasons).map(function (k) {
    var r = F.reasons[k];
    return '<label class="choice" data-reason="' + k + '"><input type="radio" name="bk-reason" value="' + k + '"><span class="box"><span class="ico">' + icon(r.icon) + '</span><strong>' + r.label + '</strong><span class="meta">' + r.meta + '</span></span></label>';
  }).join('');

  function reason() { return bk.reason ? F.reasons[bk.reason] : null; }
  function isNew() { return bk.patient === 'new'; }
  function visitLabel() {
    var r = reason();
    if (!r) return '';
    if (bk.forChild && bk.reason === 'checkup') return 'Child’s NHS check-up';
    if (bk.forChild && bk.reason === 'hygiene') return 'Child’s NHS hygiene visit';
    return isNew() && r.newLabel ? r.newLabel : (r.emergency ? 'Emergency appointment' : r.label);
  }
  function visitMins() { var r = reason(); return isNew() && r.newMins ? r.newMins : r.mins; }
  function visitPrice() {
    var r = reason();
    if (bk.child && bk.reason !== 'consult') return 0;
    return isNew() && r.newPrice ? r.newPrice : r.price;
  }
  function priceText() { var p = visitPrice(); return p === 0 ? 'Free on the NHS (under 18)' : money(p); }

  function updateHint() {
    var r = reason();
    if (!r) { els.hint.textContent = ''; return; }
    els.hint.textContent = bk.forChild && bk.reason !== 'consult'
      ? 'Free on the NHS for under-18s. We’ll check teeth and gums, show them how to brush properly and keep it relaxed. A parent or guardian comes too if they’re under 16.'
      : (bk.patient === 'existing' ? r.hintExisting : r.hintNew);
    els.hint.classList.toggle('is-emergency', !!r.emergency);
  }

  function setStep(step) {
    bk.step = step;
    $$('.bk-step', dlg).forEach(function (s) { s.hidden = String(s.getAttribute('data-step')) !== String(step); });
    var n = step === 'loading' ? 3 : step;
    $$('[data-step-label]', dlg).forEach(function (li) {
      var k = +li.getAttribute('data-step-label');
      li.classList.toggle('is-done', k < n || step === 4);
      li.classList.toggle('is-current', k === n);
      if (k === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    els.back.hidden = !(step === 2 || step === 3);
    els.foot.hidden = false;
    els.ics.hidden = step !== 4;
    if (step === 4) {
      els.back.hidden = true;
      els.next.innerHTML = 'Done';
      els.next.disabled = false;
    } else if (step === 'loading') {
      els.back.hidden = true;
      els.next.disabled = true;
      els.next.textContent = 'Booking…';
      els.summary.textContent = 'Checking the diary and holding your time.';
    } else {
      els.next.innerHTML = (step === 3 ? 'Confirm booking ' : 'Continue ') + icon(step === 3 ? 'check' : 'arrow');
    }
    els.body.scrollTop = 0;
    refresh();
  }

  function refresh() {
    var r = reason();
    if (bk.step === 1) {
      els.next.disabled = !(bk.reason && bk.patient);
      els.summary.innerHTML = r && bk.patient ? '<strong>' + esc(visitLabel()) + '</strong> · ' + visitMins() + ' min · ' + priceText() : r ? 'Now tell us if you’ve been before.' : 'Choose a reason to see times.';
    } else if (bk.step === 2) {
      els.next.disabled = !bk.slot;
      els.summary.innerHTML = bk.slot
        ? '<strong>' + esc(longDate(bk.days[bk.slotDay].date)) + ' at ' + bk.slot.time + '</strong> with ' + esc(F.team[bk.slot.who].name)
        : 'Pick a time that suits you.';
    } else if (bk.step === 3) {
      els.next.disabled = false;
      els.summary.innerHTML = '<strong>' + esc(visitLabel()) + '</strong> · ' + priceText();
    } else if (bk.step === 4) {
      els.summary.textContent = 'We’ve emailed you these details too.';
    }
  }

  dlg.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'bk-reason') { bk.reason = t.value; bk.slot = null; updateHint(); refresh(); }
    if (t.name === 'bk-patient') { bk.patient = t.value; bk.slot = null; updateHint(); refresh(); }
    if (t.name === 'bk-child') { bk.forChild = t.checked; bk.child = t.checked; updateHint(); refresh(); }
  });

  function renderDays() {
    var from = clock();
    bk.days = openDays(bk.reason, from).map(function (d) {
      return { date: d.date, slots: slotsFor(bk.reason, d.date, from, isNew()) };
    });
    if (bk.dayIdx >= bk.days.length) bk.dayIdx = 0;
    // Start on the first day that has something free.
    var firstFree = bk.days.findIndex(function (d) { return d.slots.some(function (s) { return s.free; }); });
    if (!bk.slot) bk.dayIdx = firstFree < 0 ? 0 : firstFree;
    els.days.innerHTML = bk.days.map(function (d, i) {
      var free = d.slots.filter(function (s) { return s.free; }).length;
      var label = i === 0 && dateKey(d.date) === dateKey(from) ? 'Today' : DAYS_SHORT[d.date.getDay()];
      return '<button type="button" class="day" data-day-idx="' + i + '" data-date="' + dateKey(d.date) + '" aria-pressed="' + (i === bk.dayIdx) + '" aria-label="' + esc(longDate(d.date)) + ', ' + (free ? free + ' free' : 'fully booked') + '"' + (free ? '' : ' disabled') + '>' +
        '<span class="dow">' + label + '</span><span class="dnum">' + d.date.getDate() + '</span><span class="mon">' + MONTHS[d.date.getMonth()] + '</span><span class="avail">' + (free ? free + ' free' : 'Full') + '</span></button>';
    }).join('');
    renderSlots();
  }

  function renderSlots() {
    var day = bk.days[bk.dayIdx];
    if (!day) { els.slots.innerHTML = '<p class="no-slots">No times left online. Ring us on ' + F.phone + ' and we’ll find you something.</p>'; return; }
    var r = reason();
    var groups = r.emergency ? [['Kept free for emergencies', function () { return true; }]] : [
      ['Morning', function (s) { return s.mins < 12 * 60; }],
      ['Afternoon', function (s) { return s.mins >= 12 * 60 && s.mins < 17 * 60; }],
      ['Evening', function (s) { return s.mins >= 17 * 60; }],
    ];
    var html = '';
    groups.forEach(function (g) {
      var list = day.slots.filter(g[1]);
      if (!list.length) return;
      html += '<div class="slot-group"><h3>' + g[0] + '</h3><div class="slots">' + list.map(function (s) {
        var on = bk.slot && bk.slot.time === s.time && bk.slotDay === bk.dayIdx;
        return '<button type="button" class="slot' + (s.emergency ? ' is-emergency' : '') + '" data-time="' + s.time + '" aria-pressed="' + !!on + '"' + (s.free ? '' : ' disabled aria-label="' + s.time + ', taken"') + '>' + s.time + '</button>';
      }).join('') + '</div></div>';
    });
    els.slots.innerHTML = html + (r.emergency ? '<p class="bk-hint">If none of these work, ring us as soon as we open. Out of hours, call NHS 111.</p>' : '');
  }

  els.days.addEventListener('click', function (e) {
    var b = e.target.closest('.day');
    if (!b || b.disabled) return;
    bk.dayIdx = +b.getAttribute('data-day-idx');
    $$('.day', els.days).forEach(function (d) { d.setAttribute('aria-pressed', String(d === b)); });
    renderSlots();
    refresh();
  });
  els.slots.addEventListener('click', function (e) {
    var b = e.target.closest('.slot');
    if (!b || b.disabled) return;
    var day = bk.days[bk.dayIdx];
    bk.slot = day.slots.filter(function (s) { return s.time === b.getAttribute('data-time'); })[0];
    bk.slotDay = bk.dayIdx;
    $$('.slot', els.slots).forEach(function (s) { s.setAttribute('aria-pressed', String(s === b)); });
    refresh();
  });

  /* Details form and validation */
  var dobInput = $('#bk-dob', dlg);
  function needsParent() {
    if (bk.forChild) return true;
    var d = parseDob((dobInput.value || '').trim());
    return !!(d && ageOn(d, clock()) < 16);
  }
  function syncParent() {
    var f = $('[data-field="parent"]', els.form);
    var show = needsParent();
    f.hidden = !show;
    $('#bk-parent-help', dlg).textContent = bk.forChild ? 'Under-16s need a parent or guardian with them at the appointment.' : 'You’re under 16, so a parent or guardian needs to come with you. Who will it be?';
  }
  dobInput.addEventListener('input', syncParent);
  dobInput.addEventListener('input', function () {
    var digits = dobInput.value.replace(/\D/g, '').slice(0, 8);
    var v = digits.slice(0, 2) + (digits.length > 2 ? '/' + digits.slice(2, 4) : '') + (digits.length > 4 ? '/' + digits.slice(4) : '');
    if (v !== dobInput.value) dobInput.value = v;
  });

  function parseDob(v) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
    if (!m) return null;
    var d = new Date(+m[3], +m[2] - 1, +m[1]);
    if (d.getDate() !== +m[1] || d.getMonth() !== +m[2] - 1) return null;
    return d;
  }
  function ageOn(dob, on) {
    var a = on.getFullYear() - dob.getFullYear();
    if (on.getMonth() < dob.getMonth() || (on.getMonth() === dob.getMonth() && on.getDate() < dob.getDate())) a--;
    return a;
  }

  var rules = {
    first: function (v) { return v.trim() ? '' : (bk.forChild ? 'Enter your child’s first name' : 'Enter your first name'); },
    parent: function (v) { if (!needsParent()) return ''; return v.trim().length > 2 ? '' : 'Enter the name of a parent or guardian'; },
    last: function (v) { return v.trim() ? '' : (bk.forChild ? 'Enter your child’s last name' : 'Enter your last name'); },
    dob: function (v) {
      if (!isNew() && !bk.forChild) return '';
      if (!v.trim()) return bk.forChild ? 'Enter your child’s date of birth' : 'Enter your date of birth';
      var d = parseDob(v.trim());
      if (!d) return 'Enter a real date, like 14/03/1991';
      var age = ageOn(d, clock());
      if (bk.forChild && age >= 18) return 'For a child’s appointment, they need to be under 18';
      if (d > clock() || age > 115) return 'Check the year of your date of birth';
      return '';
    },
    mobile: function (v) {
      var n = v.replace(/[\s()-]/g, '');
      if (!n) return 'Enter your mobile number';
      return /^(\+447|07)\d{9}$/.test(n) ? '' : 'Enter a UK mobile number, like 07700 900 123';
    },
    email: function (v) {
      if (!v.trim()) return 'Enter your email address';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter an email address like name@example.com';
    },
  };
  var LABELS = { first: 'First name', last: 'Last name', parent: 'Parent or guardian', dob: 'Date of birth', mobile: 'Mobile number', email: 'Email' };

  function checkField(name, show) {
    var field = $('[data-field="' + name + '"]', els.form);
    if (!field || field.hidden) return '';
    var input = $('input', field);
    var msg = rules[name](input.value);
    if (show) {
      field.classList.toggle('has-error', !!msg);
      field.classList.toggle('is-valid', !msg && !!input.value.trim());
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      $('.err span', field).textContent = msg;
    }
    return msg;
  }
  els.form.addEventListener('input', function (e) {
    var field = e.target.closest('[data-field]');
    if (field && field.classList.contains('has-error')) checkField(field.getAttribute('data-field'), true);
  });
  els.form.addEventListener('focusout', function (e) {
    var field = e.target.closest('[data-field]');
    if (field && e.target.value.trim()) checkField(field.getAttribute('data-field'), true);
  });
  els.form.addEventListener('submit', function (e) { e.preventDefault(); next(); });

  function validateAll() {
    var errs = [];
    ['first', 'last', 'dob', 'parent', 'mobile', 'email'].forEach(function (k) {
      var m = checkField(k, true);
      if (m) errs.push([k, m]);
    });
    if (errs.length) {
      els.errSummary.innerHTML = '<strong>Please check ' + (errs.length === 1 ? 'one thing' : errs.length + ' things') + '</strong><ul>' + errs.map(function (e) {
        return '<li><a href="#bk-' + e[0] + '" data-jump="' + e[0] + '">' + LABELS[e[0]] + ': ' + esc(e[1].charAt(0).toLowerCase() + e[1].slice(1)) + '</a></li>';
      }).join('') + '</ul>';
      els.errSummary.classList.add('is-on');
      els.errSummary.focus();
      return false;
    }
    els.errSummary.classList.remove('is-on');
    return true;
  }
  els.errSummary.addEventListener('click', function (e) {
    var a = e.target.closest('[data-jump]');
    if (!a) return;
    e.preventDefault();
    $('#bk-' + a.getAttribute('data-jump'), dlg).focus();
  });

  function prepareDetails() {
    $$('[data-new-only]', els.form).forEach(function (f) { f.hidden = !(isNew() || bk.forChild); });
    $$('[data-child-only]', els.form).forEach(function (f) { f.hidden = !bk.forChild; });
    syncParent();
    var who = bk.forChild ? 'Child’s ' : '';
    $('label[for="bk-first"]', dlg).textContent = bk.forChild ? 'Child’s first name' : 'First name';
    $('label[for="bk-last"]', dlg).textContent = bk.forChild ? 'Child’s last name' : 'Last name';
    $('label[for="bk-dob"]', dlg).textContent = who + (who ? 'date of birth' : 'Date of birth');
    $('label[for="bk-mobile"]', dlg).textContent = bk.forChild ? 'Your mobile number' : 'Mobile number';
    $('label[for="bk-email"]', dlg).textContent = bk.forChild ? 'Your email' : 'Email';
    var d = bk.days[bk.slotDay].date;
    els.recap.innerHTML = '<span><strong>' + esc(visitLabel()) + '</strong></span><span>' + esc(longDate(d)) + ', ' + bk.slot.time + '</span><span>' + esc(F.team[bk.slot.who].name) + '</span>';
    els.errSummary.classList.remove('is-on');
  }

  function makeRef(d) {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var buf = new Uint32Array(4);
    (window.crypto || window.msCrypto).getRandomValues(buf);
    var tail = '';
    for (var i = 0; i < 4; i++) tail += chars[buf[i] % chars.length];
    if (TOUR) tail = 'K7Q2';
    return 'FD-' + pad(d.getDate()) + pad(d.getMonth() + 1) + '-' + tail;
  }

  function showDone() {
    var d = bk.days[bk.slotDay].date;
    var fd = new FormData(els.form);
    var first = String(fd.get('first') || '').trim();
    var ref = makeRef(d);
    var endMins = bk.slot.mins + visitMins();
    bk.details = { first: first, ref: ref, date: d, time: bk.slot.time, who: F.team[bk.slot.who].name, label: visitLabel(), start: bk.slot.mins, end: endMins };
    var r = reason();
    var next = r.emergency
      ? ['Come to the front door on Saddlers Row and ring the bell.', 'Bring a list of any medicines you take.', 'If it gets worse before then, ring us on ' + F.phone + '.']
      : isNew()
        ? ['We’ll text you a link to fill in your medical history before you come.', 'Bring a list of any medicines you take.', 'Need to change it? Reply to the reminder text or ring us, ideally a day ahead.']
        : ['Bring a list of any new medicines.', 'Need to change it? Reply to the reminder text or ring us, ideally a day ahead.'];
    els.done.innerHTML =
      '<svg class="done-mark" viewBox="0 0 120 66" aria-hidden="true">' + doneMark() + '</svg>' +
      '<h3 id="bk-done-title" tabindex="-1">' + (bk.forChild ? esc(first) + ' is booked in.' : 'You’re booked in, ' + esc(first) + '.') + '</h3>' +
      '<div class="ref"><span>Your reference</span><strong>' + ref + '</strong></div>' +
      '<dl>' +
      '<dt>What</dt><dd>' + esc(visitLabel()) + ', ' + visitMins() + ' minutes</dd>' +
      '<dt>When</dt><dd>' + esc(longDate(d)) + ', ' + bk.slot.time + '–' + hhmm(endMins) + '</dd>' +
      '<dt>With</dt><dd>' + esc(F.team[bk.slot.who].name) + '</dd>' +
      '<dt>Where</dt><dd>' + F.address.slice(0, 2).join(', ') + ' ' + F.address[3] + '</dd>' +
      '<dt>Fee</dt><dd>' + priceText() + (visitPrice() ? ', paid on the day' : '') + '</dd>' +
      '</dl>' +
      '<div class="next"><strong>Before you come</strong><ul>' + next.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>';
    els.body.style.minHeight = '';
    setStep(4);
    var h = $('#bk-done-title', dlg);
    if (h) h.focus({ preventScroll: true });
  }

  function doneMark() {
    var s = '<path class="ray" d="M6 62 A54 54 0 0 1 114 62" fill="none" stroke="currentColor" stroke-width="2.5" pathLength="60"/>';
    for (var i = 1; i < 6; i++) {
      var a = Math.PI - (Math.PI / 6) * i;
      s += '<line class="ray" pathLength="60" style="animation-delay:' + (0.15 + i * 0.07) + 's" x1="' + (60 + Math.cos(a) * 18).toFixed(1) + '" y1="' + (62 - Math.sin(a) * 18).toFixed(1) + '" x2="' + (60 + Math.cos(a) * 52).toFixed(1) + '" y2="' + (62 - Math.sin(a) * 52).toFixed(1) + '" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>';
    }
    return s + '<path class="ray" pathLength="60" d="M42 62 A18 18 0 0 1 78 62" fill="none" stroke="currentColor" stroke-width="2.5" style="animation-delay:.1s"/>' +
      '<path d="M50 48 l7 7 l14 -15" fill="none" stroke="#a3472a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-ics]')) downloadIcs();
  });
  function downloadIcs() {
    var b = bk.details;
    if (!b) return;
    var d = b.date;
    var stamp = function (m) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(Math.floor(m / 60)) + pad(m % 60) + '00'; };
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fanlight Dental//Booking//EN', 'BEGIN:VEVENT',
      'UID:' + b.ref + '@fanlightdental.example', 'DTSTAMP:' + stamp(0), 'DTSTART;TZID=Europe/London:' + stamp(b.start), 'DTEND;TZID=Europe/London:' + stamp(b.end),
      'SUMMARY:' + b.label + ' at Fanlight Dental', 'LOCATION:' + F.address.join('\\, '), 'DESCRIPTION:Reference ' + b.ref + '. To change it\\, ring ' + F.phone + '.',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'fanlight-dental-' + b.ref + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
  }

  function next() {
    if (bk.step === 1) {
      if (!bk.reason || !bk.patient) return;
      renderDays();
      setStep(2);
      var pressed = $('.day[aria-pressed="true"]', els.days);
      if (pressed) pressed.focus({ preventScroll: true });
    } else if (bk.step === 2) {
      if (!bk.slot) return;
      prepareDetails();
      setStep(3);
      $('#bk-first', dlg).focus({ preventScroll: true });
    } else if (bk.step === 3) {
      if (!validateAll()) return;
      var dob = parseDob(($('#bk-dob', dlg).value || '').trim());
      bk.child = bk.forChild || (isNew() && dob ? ageOn(dob, clock()) < 18 : false);
      // Keep the dialog the same size while it books, with the loader centred.
      var bodyH = els.body.clientHeight;
      els.body.style.minHeight = els.body.offsetHeight + 'px';
      setStep('loading');
      $('.bk-loading', dlg).style.minHeight = Math.max(240, bodyH - 50) + 'px';
      setTimeout(showDone, 1200);
    } else if (bk.step === 4) {
      closeBooking();
    }
  }
  function back() {
    if (bk.step === 2) setStep(1);
    else if (bk.step === 3) { setStep(2); renderSlots(); }
  }
  els.next.addEventListener('click', next);
  els.back.addEventListener('click', back);

  function resetBooking(preset) {
    bk.step = 1; bk.reason = null; bk.patient = null; bk.slot = null; bk.slotDay = null; bk.dayIdx = 0; bk.child = false; bk.forChild = false; bk.details = null;
    $('input[name="bk-child"]', dlg).checked = false;
    $$('input[type="radio"]', dlg).forEach(function (i) { i.checked = false; });
    els.form.reset();
    $$('.field', els.form).forEach(function (f) { f.classList.remove('has-error', 'is-valid'); });
    $$('input', els.form).forEach(function (i) { i.removeAttribute('aria-invalid'); });
    els.errSummary.classList.remove('is-on');
    var parts = String(preset || '').split(':');
    preset = parts[0];
    if (parts[1] === 'child') { bk.forChild = bk.child = true; $('input[name="bk-child"]', dlg).checked = true; }
    if (preset && F.reasons[preset]) {
      bk.reason = preset;
      var radio = $('input[name="bk-reason"][value="' + preset + '"]', dlg);
      if (radio) radio.checked = true;
    }
    updateHint();
    setStep(1);
  }

  function openBooking(preset, opener) {
    bk.opener = opener || document.activeElement;
    resetBooking(preset);
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    document.documentElement.classList.add('has-dialog');
    var first = preset ? $('input[name="bk-patient"]', dlg) : $('input[name="bk-reason"]', dlg);
    refresh();
    if (first) first.focus({ preventScroll: true });
  }
  function closeBooking() {
    if (dlg.open) dlg.close();
  }
  dlg.addEventListener('close', function () {
    document.documentElement.classList.remove('has-dialog');
    var note = $('.hero-note');
    if (note && bk.step === 4 && bk.details) {
      var b = bk.details;
      note.classList.add('is-booked');
      note.innerHTML = '<span class="status">Booked · ' + b.ref + '</span>' +
        '<strong>' + (bk.forChild ? esc(b.first) + '’s ' + 'appointment' : 'You’re booked in') + '</strong>' +
        '<span class="when">' + shortDate(b.date) + ', ' + b.time + '</span>' +
        '<span class="with">' + esc(b.label) + ' with ' + esc(b.who) + '</span>' +
        '<span class="note-actions"><button type="button" class="link-arrow" data-ics>' + icon('calendar') + ' Add to calendar</button></span>';
    }
    // After a booking, focus lands on the hero card that now shows it; otherwise back where you were.
    if (note && note.classList.contains('is-booked') && bk.step === 4) { note.setAttribute('tabindex', '-1'); note.focus({ preventScroll: true }); }
    else if (bk.opener && document.contains(bk.opener)) bk.opener.focus({ preventScroll: true });
  });
  // Click on the backdrop closes it; clicks inside the panel do not.
  dlg.addEventListener('mousedown', function (e) {
    if (e.target !== dlg) return;
    var r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeBooking();
  });
  $$('[data-bk-close]', dlg).forEach(function (b) { b.addEventListener('click', closeBooking); });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-book]');
    if (!t) return;
    e.preventDefault();
    openBooking(t.getAttribute('data-book') || null, t);
  });

  // Lazy images start loading once the page has settled, so scrolling never shows empty frames.
  window.addEventListener('load', function () {
    setTimeout(function () { $$('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; }); }, 150);
  });

  window.FanlightBooking = { open: openBooking, close: closeBooking };
})();
