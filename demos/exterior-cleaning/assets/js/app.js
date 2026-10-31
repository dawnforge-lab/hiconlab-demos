/* Hollis & Daughter: header and mobile menu, the clean stripes, the services terrace,
   the before/after squeegee, the guide-price flow and booking (homepage), and the
   postcode checker and map (areas page). No backend: nothing leaves the browser. */
(function () {
  'use strict';

  var D = window.HD_DATA;
  var doc = document.documentElement;
  doc.classList.add('js');

  var TOUR = /[?&]tour=/.test(location.search);
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function money(p) {
    var neg = p < 0; p = Math.abs(Math.round(p));
    var pounds = Math.floor(p / 100), pence = p % 100;
    return (neg ? '−' : '') + '£' + pounds.toLocaleString('en-GB') + '.' + (pence < 10 ? '0' : '') + pence;
  }
  function vatOf(p) { return Math.round(p * D.vatRate); }

  // “Today”: pinned in tour mode so every recording matches.
  function clock() {
    if (TOUR) { var t = D.tour.today; return new Date(t[0], t[1], t[2], t[3], t[4]); }
    return new Date();
  }
  var DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function dateKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function longDate(d) { return DOW[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; }
  function shortDate(d) { return DOW[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + MON[d.getMonth()].slice(0, 3); }

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }

  /* ------------------------------------------------------------------ */
  /* Header: sticky shadow and the mobile menu                           */
  /* ------------------------------------------------------------------ */
  var header = $('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 30); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var toggle = $('.menu-toggle', header);
    var menu = $('#mobile-menu');
    var label = $('.menu-label', toggle);
    var openMenu = function () {
      menu.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      label.textContent = 'Close';
      document.body.style.overflow = 'hidden';
      var first = $('a', menu); if (first) first.focus();
    };
    var closeMenu = function (returnFocus) {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      label.textContent = 'Menu';
      document.body.style.overflow = '';
      if (returnFocus) toggle.focus();
    };
    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') closeMenu(false); else openMenu();
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); return; }
      if (e.key !== 'Tab') return;
      var items = [toggle].concat($$('a[href], button:not([disabled])', menu));
      var i = items.indexOf(document.activeElement);
      var next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === -1 || i === items.length - 1 ? 0 : i + 1);
      e.preventDefault();
      items[next].focus();
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080 && !menu.hidden) closeMenu(false); });
  }

  /* ------------------------------------------------------------------ */
  /* The clean stripe wipes in once, when a heading comes into view       */
  /* ------------------------------------------------------------------ */
  var stripes = $$('.stripe');
  if (reduced || TOUR || !('IntersectionObserver' in window)) {
    stripes.forEach(function (s) { s.classList.add('is-wiped'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-wiped'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    stripes.forEach(function (s) { io.observe(s); });
  }

  /* ------------------------------------------------------------------ */
  /* Pricing                                                            */
  /* ------------------------------------------------------------------ */
  var S = D.services;
  function bedsOver(beds, n) { return Math.max(0, beds - n); }
  function windowsVisit(type, beds, sched) {
    var p = S.windows.base[type] + S.windows.perBed * bedsOver(beds, 1);
    if (sched === 8) p += S.windows.eightWeekly;
    return p;
  }
  function windowsFirst(type, beds) { return windowsVisit(type, beds, 4) * S.windows.firstCleanFactor; }
  function surfaceOf(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return list[0]; }

  // Inc-VAT “from” prices on the services terrace, from the same numbers the flow uses.
  var fromPrices = {
    windows: windowsVisit('flat', 1, 4),
    gutters: S.gutters.base.flat,
    driveway: S.driveway.min,
    patio: S.patio.min,
    render: S.render.renderBase.flat,
    solar: S.solar.min
  };
  $$('[data-from]').forEach(function (el) {
    var p = fromPrices[el.getAttribute('data-from')];
    el.textContent = money(p + vatOf(p));
  });

  function quoteFor(st) {
    var lines = [];
    var type = st.type, beds = st.beds;
    if (st.svc.windows) {
      var first = windowsFirst(type, beds);
      lines.push({ key: 'windows', name: st.sched ? 'Windows, first full clean' : 'Windows, one-off clean', detail: 'Glass, frames, sills and doors', amt: first });
    }
    if (st.svc.gutters) {
      lines.push({ key: 'gutters', name: 'Gutters cleared', detail: 'By hand and vacuum, downpipes flushed, photos', amt: S.gutters.base[type] + S.gutters.perBedOver2 * bedsOver(beds, 2) });
      if (st.fascias) lines.push({ key: 'fascias', name: 'Fascias and soffits', detail: 'Washed with pure water', amt: S.gutters.fascias[type] });
    }
    if (st.svc.driveway) {
      var ds = surfaceOf(S.driveway.surfaces, st.driveSurface);
      lines.push({ key: 'driveway', name: 'Driveway & paths', detail: st.driveSize + ' m², ' + ds.label.toLowerCase() + (ds.note ? '. ' + ds.note : ''), amt: Math.max(S.driveway.min, st.driveSize * ds.rate), look: true });
    }
    if (st.svc.patio) {
      var ps = surfaceOf(S.patio.surfaces, st.patioSurface);
      lines.push({ key: 'patio', name: 'Patio', detail: st.patioSize + ' m², ' + ps.label + (ps.note ? '. ' + ps.note : ''), amt: Math.max(S.patio.min, st.patioSize * ps.rate), look: true });
    }
    if (st.svc.render) {
      if (st.scope !== 'none') {
        var sc = null; S.render.scopes.forEach(function (x) { if (x.id === st.scope) sc = x; });
        if (sc && sc.notFor && sc.notFor.indexOf(type) !== -1) sc = S.render.scopes[1];
        var r = (S.render.renderBase[type] + S.render.renderPerBedOver2 * bedsOver(beds, 2)) * sc.factor;
        lines.push({ key: 'render', name: 'Render soft wash', detail: sc.label + ', biocide and low-pressure rinse', amt: Math.round(r / 100) * 100, look: true });
      }
      if (st.roof && type !== 'flat') {
        lines.push({ key: 'roof', name: 'Roof soft wash', detail: 'Moss and lichen treated, gutters checked after', amt: S.render.roofBase[type] + S.render.roofPerBedOver2 * bedsOver(beds, 2), look: true });
      }
    }
    if (st.svc.solar) {
      lines.push({ key: 'solar', name: 'Solar panels', detail: st.panels + ' panels, pure water and a soft brush', amt: Math.max(S.solar.min, st.panels * S.solar.perPanel) });
    }
    var sum = 0; lines.forEach(function (l) { sum += l.amt; });
    // a job is a service that actually has work on the ticket (an empty roof-only choice isn’t one)
    var svcOf = { fascias: 'gutters', roof: 'render' };
    var seen = {};
    lines.forEach(function (l) { seen[svcOf[l.key] || l.key] = true; });
    var jobs = Object.keys(seen).length;
    var discount = jobs >= 2 ? Math.round(sum * D.sameVisitDiscount) : 0;
    var subtotal = sum - discount;
    var vat = vatOf(subtotal);
    var round = null;
    if (st.svc.windows && st.sched) {
      var per = windowsVisit(type, beds, st.sched);
      round = { weeks: st.sched, per: per, vat: vatOf(per), total: per + vatOf(per) };
    }
    return { lines: lines, sum: sum, jobs: jobs, discount: discount, subtotal: subtotal, vat: vat, total: subtotal + vat, round: round };
  }

  /* ------------------------------------------------------------------ */
  /* Postcodes and rounds                                               */
  /* ------------------------------------------------------------------ */
  function parsePostcode(raw) {
    var v = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    var full = v.match(/^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/);
    if (full) return { outward: full[1], pretty: full[1] + ' ' + full[2], full: true };
    var out = v.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)$/);
    if (out) return { outward: out[1], pretty: out[1], full: false };
    return null;
  }
  function roundFor(outward) {
    for (var i = 0; i < D.rounds.length; i++) if (D.rounds[i].districts.indexOf(outward) !== -1) return D.rounds[i];
    return null;
  }
  function areaStatus(pc) {
    if (!pc) return { kind: 'invalid' };
    var r = roundFor(pc.outward);
    if (r) return { kind: 'round', round: r };
    if (D.saturdayOnly.indexOf(pc.outward) !== -1) return { kind: 'saturday' };
    return { kind: 'out' };
  }
  function nextRoundDates(round, from, n) {
    var out = [];
    for (var i = 1; i < 70 && out.length < n; i++) {
      var d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
      if (d.getDay() === round.day) out.push(d);
    }
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Before & after: the squeegee                                        */
  /* ------------------------------------------------------------------ */
  var ba = $('[data-ba]');
  if (ba) (function () {
    var frame = $('[data-ba-frame]', ba);
    var handle = $('[data-ba-handle]', ba);
    var before = $('[data-ba-before]', ba);
    var after = $('[data-ba-after]', ba);
    var pos = 22;
    var dragging = false;
    var scenes = {
      driveway: { before: 'Before: the block paving driveway dull and dark with grime, oil stains and moss in the joints', after: 'After: the same driveway, red herringbone blocks bright and even, joints re-sanded' },
      render: { before: 'Before: the pink render streaked green and black below the gutter and sills, algae creeping up from the pavement', after: 'After: the same house front, even pale pink render with clean white sills' },
      patio: { before: 'Before: the sandstone patio dark and dingy with algae, lichen spots and moss in the joints', after: 'After: the same patio, warm buff and grey sandstone with clean joints' }
    };

    var labAfter = $('.ba-label--after', ba), labBefore = $('.ba-label--before', ba);
    var INSET = 16; // keep the squeegee head inside the frame at both ends
    // pos is the logical value (0–100, what the slider reports); the line is drawn inset from the edges.
    function set(p) {
      pos = Math.max(0, Math.min(100, p));
      var w = frame.clientWidth || 1;
      var x = INSET + (pos / 100) * (w - 2 * INSET);
      frame.style.setProperty('--pos', (x / w * 100).toFixed(3) + '%');
      frame.classList.toggle('is-flipped', pos < 30);
      // the AFTER / BEFORE chips step aside when the line reaches them
      labAfter.classList.toggle('is-away', x < labAfter.offsetLeft + labAfter.offsetWidth + 18);
      labBefore.classList.toggle('is-away', x > labBefore.offsetLeft - 18);
      handle.setAttribute('aria-valuenow', String(Math.round(pos)));
      handle.setAttribute('aria-valuetext', Math.round(pos) + '% wiped clean');
    }
    function animateTo(p, ms) {
      if (reduced) { set(p); return Promise.resolve(); }
      var from = pos, start = performance.now(); ms = ms || 700;
      return new Promise(function (resolve) {
        (function step(now) {
          var k = Math.min(1, (now - start) / ms);
          var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          set(from + (p - from) * e);
          if (k < 1) requestAnimationFrame(step); else resolve();
        })(start);
      });
    }
    function pctFromEvent(e) {
      var r = frame.getBoundingClientRect();
      return ((e.clientX - r.left - INSET) / (r.width - 2 * INSET)) * 100;
    }
    var pending = null; // a touch on the photo: only a horizontal drag moves the wipe
    function startDrag(e) {
      dragging = true;
      frame.classList.add('is-dragging');
      try { frame.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
    }
    frame.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      var onHandle = !!e.target.closest('[data-ba-handle]');
      if (e.pointerType === 'touch' && !onHandle) { pending = { x: e.clientX, y: e.clientY, id: e.pointerId }; return; }
      startDrag(e);
      if (!onHandle) animateTo(pctFromEvent(e), 260);
      e.preventDefault();
    });
    window.addEventListener('pointermove', function (e) {
      if (pending && e.pointerId === pending.id) {
        var dx = Math.abs(e.clientX - pending.x), dy = Math.abs(e.clientY - pending.y);
        if (dx > 8 && dx > dy * 1.2) { pending = null; startDrag(e); }
        else if (dy > 8) { pending = null; }
        return;
      }
      if (dragging) set(pctFromEvent(e));
    });
    var end = function () { pending = null; if (!dragging) return; dragging = false; frame.classList.remove('is-dragging'); };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    window.addEventListener('resize', function () { set(pos); });
    handle.addEventListener('keydown', function (e) {
      var step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -20, PageUp: 20 }[e.key];
      if (step) { e.preventDefault(); set(pos + step); }
      else if (e.key === 'Home') { e.preventDefault(); set(0); }
      else if (e.key === 'End') { e.preventDefault(); set(100); }
    });

    // Tabs: one panel, three jobs. Roving tabindex with arrow keys.
    var tabs = $$('.ba-tab');
    function show(scene) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-scene') === scene;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on) ba.setAttribute('aria-labelledby', t.id);
      });
      ['before', 'after'].forEach(function (k) {
        var img = k === 'before' ? before : after;
        img.srcset = 'assets/img/ba-' + scene + '-' + k + '-800.webp 800w, assets/img/ba-' + scene + '-' + k + '-1536.webp 1536w';
        img.src = 'assets/img/ba-' + scene + '-' + k + '-1536.webp';
        img.alt = scenes[scene][k];
      });
      var j = D.jobs[scene];
      $('[data-job-place]').textContent = j.place;
      $('[data-job-what]').textContent = j.what;
      $('[data-job-did]').textContent = j.did;
      $('[data-job-time]').textContent = j.who + ', ' + j.time.charAt(0).toLowerCase() + j.time.slice(1);
      $('[data-job-price]').textContent = money(j.price) + ' inc. VAT';
      $('[data-job-after]').textContent = j.after + '.';
      set(22);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t.getAttribute('data-scene')); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = tabs[(i + d + tabs.length) % tabs.length];
        n.focus(); show(n.getAttribute('data-scene'));
      });
    });
    // Warm the other scenes so switching never flashes.
    window.addEventListener('load', function () {
      ['render', 'patio'].forEach(function (s) { ['before', 'after'].forEach(function (k) { var im = new Image(); im.src = 'assets/img/ba-' + s + '-' + k + '-1536.webp'; }); });
      $$('img[loading="lazy"]').forEach(function (im) { im.loading = 'eager'; });
    });
    set(22);
    window.HD = window.HD || {};
    window.HD.ba = { set: set, animateTo: animateTo, show: show };
  })();

  /* ------------------------------------------------------------------ */
  /* Guide price and booking                                            */
  /* ------------------------------------------------------------------ */
  var form = $('#q-form');
  if (form) (function () {
    var card = $('[data-q]');
    var steps = $$('.q-step', form);
    var dots = $$('[data-step-dot]');
    var back = $('[data-q-back]');
    var next = $('[data-q-next]');
    var nextLabel = $('[data-next-label]');
    var soFar = $('[data-so-far]');
    var nav = $('[data-q-nav]');
    var tBody = $('[data-ticket-body]');
    var tRound = $('[data-ticket-round]');
    var tNo = $('[data-ticket-no]');
    var stamp = $('[data-stamp]');
    var pcInput = $('#q-postcode');
    var pcResult = $('[data-postcode-result]');
    var current = 1;
    var panels = S.solar.panels.value;
    var booked = null;
    var area = { kind: 'invalid' };

    function state() {
      var svc = {};
      $$('input[name="svc"]', form).forEach(function (c) { svc[c.value] = c.checked; });
      var v = function (n) { var el = form.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : null; };
      return {
        svc: svc,
        type: v('type') || 'semi',
        beds: +(v('beds') || 3),
        fascias: form.fascias.checked,
        scope: v('scope') || 'front',
        roof: form.roof.checked,
        driveSize: +form.driveSize.value,
        driveSurface: v('driveSurface'),
        patioSize: +form.patioSize.value,
        patioSurface: v('patioSurface'),
        panels: panels,
        sched: +(v('sched') || 0)
      };
    }
    function anyService(st) { return Object.keys(st.svc).some(function (k) { return st.svc[k]; }); }
    function needsLook(st) { return D.needsLook.some(function (k) { return st.svc[k]; }); }

    /* ---- the ticket ---- */
    var lastKeys = '';
    function renderTicket() {
      var st = state();
      if (!anyService(st)) {
        tBody.innerHTML = '<p class="ticket-empty">Pick a job and your price appears here, line by line.</p>';
        tRound.hidden = true; soFar.innerHTML = ''; lastKeys = '';
        return;
      }
      var q = quoteFor(st);
      var keys = q.lines.map(function (l) { return l.key; }).join(',');
      var html = '<div class="t-cols" aria-hidden="true">ex VAT</div>';
      q.lines.forEach(function (l) {
        var isNew = lastKeys.split(',').indexOf(l.key) === -1;
        html += '<div class="t-line"' + (isNew ? '' : ' style="animation:none"') + '><span class="t-name">' + l.name + (l.look ? ' <span class="t-flag">we’ll measure</span>' : '') + '</span><span class="t-amt">' + money(l.amt) + '</span><span class="t-detail">' + l.detail + '</span></div>';
      });
      if (q.discount) html += '<div class="t-line t-line--discount" style="animation:none"><span class="t-name">Same-visit discount, 10%</span><span class="t-amt">' + money(-q.discount) + '</span><span class="t-detail">' + q.jobs + ' jobs done on one visit</span></div>';
      html += '<div class="t-sum"><div><span>Subtotal, ex VAT</span><span>' + money(q.subtotal) + '</span></div><div><span>VAT at 20%</span><span>' + money(q.vat) + '</span></div></div>';
      html += '<div class="t-total"><span>Guide total</span><span><strong>' + money(q.total) + '</strong><small>inc. VAT</small></span></div>';
      tBody.innerHTML = html;
      lastKeys = keys;
      if (q.round) {
        var r = area.kind === 'round' ? area.round : null;
        tRound.hidden = false;
        tRound.innerHTML = '<span class="round-dot" aria-hidden="true"></span><span>Then every ' + q.round.weeks + ' weeks' + (r ? ', on ' + r.name + 's' : '') + ': <strong>' + money(q.round.total) + ' a visit</strong> inc. VAT</span><p>' + money(q.round.per) + ' + ' + money(q.round.vat) + ' VAT. Pay after each clean; pause or stop whenever you like.</p>';
      } else tRound.hidden = true;
      soFar.innerHTML = 'Guide so far <strong>' + money(q.total) + '</strong> inc. VAT';
    }

    /* ---- conditional extras and labels ---- */
    function syncExtras() {
      var st = state();
      $$('.extra[data-for]', form).forEach(function (x) { x.hidden = !st.svc[x.getAttribute('data-for')]; });
      // render scope “all round” isn’t a thing for flats and mid-terraces
      var allPill = $('[data-scope-all] input', form);
      var noAll = st.type === 'flat' || st.type === 'terrace';
      allPill.disabled = noAll;
      if (noAll && allPill.checked) form.querySelector('input[name="scope"][value="frontback"]').checked = true;
      $('[data-roof-row]', form).hidden = st.type === 'flat';
      if (st.type === 'flat') form.roof.checked = false;
      $('[data-fascia-price]', form).textContent = '(+' + money(S.gutters.fascias[st.type] + vatOf(S.gutters.fascias[st.type])) + ' inc. VAT)';
      // schedule prices, shown inc VAT like everywhere a customer reads a single price
      [4, 8].forEach(function (w) {
        var p = windowsVisit(st.type, st.beds, w);
        $('[data-sched-price="' + w + '"]', form).innerHTML = money(p + vatOf(p)) + '<small>a visit, inc. VAT</small>';
      });
      var schedNoneName = $('[data-sched-none]', form);
      var schedNoneNote = $('[data-sched-none-note]', form);
      var sp0 = $('[data-sched-price="0"]', form);
      if (st.svc.windows) {
        var f = windowsFirst(st.type, st.beds);
        schedNoneName.textContent = 'Just this once';
        schedNoneNote.textContent = 'A one-off full clean. Ring us when you want another.';
        sp0.innerHTML = money(f + vatOf(f)) + '<small>one-off, inc. VAT</small>';
      } else {
        schedNoneName.textContent = 'No thanks';
        schedNoneNote.textContent = 'Just the jobs you’ve picked.';
        sp0.innerHTML = '';
      }
      $('[data-sched-adds]', form).hidden = !(!st.svc.windows && st.sched);
      // a round needs a round day
      var noRound = area.kind === 'saturday';
      $$('input[name="sched"]', form).forEach(function (r) { if (r.value !== '0') { r.disabled = noRound; if (noRound && r.checked) form.querySelector('input[name="sched"][value="0"]').checked = true; } });
      $('[data-sched-help]', form).textContent = noRound
        ? 'We don’t run a window round in ' + (parsePostcode(pcInput.value) || {}).outward + ' yet, so this would be a one-off clean.'
        : 'Most of our customers are on a round: same day, same team, and we text you the evening before.';
      // ranges
      $('[data-out="drive-size"]', form).textContent = st.driveSize + ' m²';
      $('[data-out="patio-size"]', form).textContent = st.patioSize + ' m²';
      $$('.range', form).forEach(function (r) { r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); });
      $('[data-out="panels"]', form).textContent = st.panels + ' panels';
      syncDots();
      // terrace buttons mirror the selection
      $$('[data-add]').forEach(function (b) {
        var on = !!st.svc[b.getAttribute('data-add')];
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        $('span', b).textContent = on ? 'Added' : 'Add to price';
        $('use', b).setAttribute('href', on ? '#i-check' : '#i-plus');
      });
    }

    /* ---- postcode ---- */
    function checkPostcode(final) {
      var pc = parsePostcode(pcInput.value);
      area = areaStatus(pc);
      pcResult.className = 'postcode-result';
      pcInput.removeAttribute('aria-invalid');
      if (!pcInput.value.trim()) { pcResult.textContent = 'We use it to find your round day.'; area = { kind: 'invalid' }; }
      else if (area.kind === 'round') {
        pcResult.classList.add('is-round');
        pcResult.innerHTML = '<span><strong>' + pc.outward + '</strong> is on our <strong>' + area.round.name + '</strong> round: ' + area.round.areas + '.</span>';
      } else if (area.kind === 'saturday') {
        pcResult.innerHTML = '<span><strong>' + pc.outward + '</strong> is just off our patch: one-off jobs on Saturdays, but no window round.</span>';
      } else if (area.kind === 'out') {
        pcResult.classList.add('is-out');
        pcResult.innerHTML = '<span>Sorry, we don’t work in <strong>' + pc.outward + '</strong>. Ring Kerry and she’ll point you to someone good.</span>';
      } else {
        pcResult.textContent = final ? 'That doesn’t look like a postcode. Try something like BS3 1AB.' : 'Keep going…';
        if (final) { pcResult.classList.add('is-out'); pcInput.setAttribute('aria-invalid', 'true'); }
      }
      syncExtras(); renderTicket();
    }
    var pcTimer;
    pcInput.addEventListener('input', function () { clearTimeout(pcTimer); pcTimer = setTimeout(function () { checkPostcode(false); }, 180); });
    pcInput.addEventListener('blur', function () { if (pcInput.value.trim()) checkPostcode(true); });
    pcInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); checkPostcode(true); goNext(); } });

    /* ---- steps ---- */
    // Step 3 (the window round) only exists when windows are picked.
    function order() { var st = state(); return (st.svc.windows || !anyService(st)) ? [1, 2, 3, 4] : [1, 2, 4]; }
    function stepAfter(n) { var o = order(), i = o.indexOf(n); return i === -1 ? 4 : (o[i + 1] || 4); }
    function stepBefore(n) { var o = order(), i = o.indexOf(n); return i > 0 ? o[i - 1] : (i === -1 ? 2 : 1); }
    function syncDots() {
      var o = order();
      dots.forEach(function (d) {
        var k = +d.getAttribute('data-step-dot');
        var i = o.indexOf(k);
        d.hidden = i === -1;
        if (i !== -1) d.querySelector('span').textContent = String(i + 1);
      });
    }
    function showStep(n, focus) {
      current = n;
      syncDots();
      steps.forEach(function (s) {
        var on = +s.getAttribute('data-step') === n;
        s.hidden = !on;
        s.classList.toggle('is-active', on);
      });
      dots.forEach(function (d) {
        var k = +d.getAttribute('data-step-dot');
        d.classList.toggle('is-current', k === n);
        d.classList.toggle('is-done', k < n);
        if (k === n) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
      });
      back.hidden = n === 1 || n === 5;
      nav.hidden = n === 5;
      if (n === 4) buildBooking();
      updateNextLabel();
      if (focus) {
        var t = n === 5 ? $('[data-step="5"]', form) : $('[data-step="' + n + '"] .q-title', form);
        if (t) t.focus({ preventScroll: true });
        var top = card.getBoundingClientRect().top;
        if (top < 70 || (!TOUR && top > window.innerHeight * 0.6)) {
          window.scrollTo({ top: window.scrollY + top - 84, behavior: reduced ? 'auto' : 'smooth' });
        }
      }
    }
    function updateNextLabel() {
      var look = needsLook(state());
      var label = current === 1 ? 'Next: your home'
        : (current === 2 && state().svc.windows) ? 'Next: windows round'
        : look ? 'Next: book a visit' : 'Next: book';
      if (current === 4) label = form.querySelector('input[name="bookType"]:checked').value === 'work' ? 'Book the work' : 'Book my free visit';
      nextLabel.textContent = label;
      // the step 4 legend follows the choice
      var lg = $('[data-step="4"] .q-title', form);
      if (lg) lg.textContent = form.querySelector('input[name="bookType"]:checked').value === 'work' ? 'Book the work' : 'Book a free visit';
    }
    function showErr(key, msg) {
      var e = $('[data-err="' + key + '"]', form);
      if (!e) return;
      if (msg) { var t = $('[data-err-text]', e); if (t) t.textContent = msg; }
      e.hidden = false;
    }
    function clearErrs() { $$('.q-error', form).forEach(function (e) { e.hidden = true; }); }

    function validate(n) {
      clearErrs();
      var st = state();
      if (n === 1 && !anyService(st)) { showErr('svc'); return false; }
      if (n === 2) {
        checkPostcode(true);
        if (area.kind === 'invalid') { showErr('postcode', 'Add your postcode so we can find your round day.'); pcInput.focus(); return false; }
        if (area.kind === 'out') { showErr('postcode', 'We can’t give you a price outside our area, sorry.'); pcInput.focus(); return false; }
        if (st.svc.render && st.scope === 'none' && !st.roof) { showErr('postcode', 'Pick some render to wash, or tick the roof.'); return false; }
      }
      if (n === 4) return validateBooking();
      return true;
    }
    function goNext() {
      if (current === 5) return;
      if (!validate(current)) return;
      if (current === 4) { submit(); return; }
      showStep(stepAfter(current), true);
    }
    next.addEventListener('click', goNext);
    back.addEventListener('click', function () { clearErrs(); showStep(stepBefore(current), true); });
    form.addEventListener('submit', function (e) { e.preventDefault(); goNext(); });

    form.addEventListener('change', function (e) {
      if (e.target.name === 'bookType') { buildDays(); updateNextLabel(); }
      if (e.target.name === 'day') buildSlots();
      if (e.target.name === 'day' || e.target.name === 'slot') { var be = $('[data-err="book"]', form); if (be) be.hidden = true; }
      if (e.target.name === 'svc') { clearErrs(); if (!state().svc.windows) form.querySelector('input[name="sched"][value="0"]').checked = true; syncDots(); updateNextLabel(); }
      syncExtras(); renderTicket();
    });
    form.addEventListener('input', function (e) {
      if (e.target.classList.contains('range')) { syncExtras(); renderTicket(); }
      if (e.target.closest('.details')) { var err = document.getElementById(e.target.id + '-err'); if (err && !err.hidden) validateField(e.target); }
    });
    $$('[data-panels]', form).forEach(function (b) {
      b.addEventListener('click', function () {
        panels = Math.max(S.solar.panels.min, Math.min(S.solar.panels.max, panels + +b.getAttribute('data-panels')));
        syncExtras(); renderTicket();
      });
    });

    // The terrace buttons drop a service into the price.
    $$('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-add');
        var box = form.querySelector('input[name="svc"][value="' + key + '"]');
        box.checked = !box.checked;
        syncExtras(); renderTicket();
        if (box.checked && current === 5) restart();
        if (box.checked && !TOUR) {
          var q = $('#quote');
          window.scrollTo({ top: q.getBoundingClientRect().top + window.scrollY - 70, behavior: reduced ? 'auto' : 'smooth' });
        }
      });
    });

    /* ---- booking ---- */
    function bookingDays() {
      var from = clock();
      var out = [];
      var satOnly = area.kind === 'saturday';
      for (var i = 1; out.length < 12 && i < 60; i++) {
        var d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
        if (d.getDay() === 0) continue;
        if (D.closed.indexOf(dateKey(d)) !== -1) continue;
        if (satOnly && d.getDay() !== 6) continue;
        out.push(d);
      }
      return out;
    }
    function slotsFor(d) {
      var list = d.getDay() === 6 ? D.slots.slice(0, 2) : D.slots;
      var key = dateKey(d);
      return list.map(function (s) {
        var free = hash(key + s.id + 'hd') % 10 >= 3;
        if (TOUR && key === D.tour.bookDate) free = s.id === D.tour.bookSlot || s.id === '14';
        return { id: s.id, label: s.label, free: free };
      });
    }
    function buildBooking() {
      var st = state();
      var look = needsLook(st);
      var workRadio = form.querySelector('input[name="bookType"][value="work"]');
      workRadio.disabled = look;
      if (look && workRadio.checked) form.querySelector('input[name="bookType"][value="visit"]').checked = true;
      $('[data-bt-work-note]', form).textContent = look
        ? 'Render, roofs, driveways and patios need a quick look first, so we start with a visit.'
        : 'Windows, gutters and solar panels can go straight in the diary.';
      buildDays();
    }
    function buildDays() {
      var wrap = $('[data-days]', form);
      var prev = (form.querySelector('input[name="day"]:checked') || {}).value;
      var round = area.kind === 'round' ? area.round : null;
      var html = '';
      bookingDays().forEach(function (d) {
        var key = dateKey(d);
        var any = slotsFor(d).some(function (s) { return s.free; });
        var isRound = round && d.getDay() === round.day;
        html += '<label class="day' + (isRound ? ' is-round' : '') + '" data-date="' + key + '"><input type="radio" name="day" value="' + key + '"' + (any ? '' : ' disabled') + (prev === key && any ? ' checked' : '') + '><span aria-hidden="true"><span class="d-dow">' + DOW[d.getDay()].slice(0, 3) + '</span><span class="d-num">' + d.getDate() + '</span><span class="d-mon">' + (any ? MON[d.getMonth()].slice(0, 3) : 'Full') + '</span></span><span class="sr-only">' + longDate(d) + (isRound ? ', your round day' : '') + (any ? '' : ', fully booked') + '</span></label>';
      });
      wrap.innerHTML = html;
      var hint = $('[data-round-hint]', form);
      if (round) { hint.hidden = false; $('[data-round-hint-text]', form).textContent = round.name + 's are your round day, so we’re already on your street.'; }
      else if (area.kind === 'saturday') { hint.hidden = false; $('[data-round-hint-text]', form).textContent = 'Saturdays only for your postcode.'; }
      else hint.hidden = true;
      buildSlots();
    }
    function buildSlots() {
      var wrap = $('[data-slots]', form);
      var dk = (form.querySelector('input[name="day"]:checked') || {}).value;
      if (!dk) { wrap.innerHTML = '<p class="slots-empty">Pick a day to see the times.</p>'; return; }
      var parts = dk.split('-');
      var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      var prev = (form.querySelector('input[name="slot"]:checked') || {}).value;
      wrap.innerHTML = slotsFor(d).map(function (s) {
        return '<label class="slot" data-slot="' + s.id + '"><input type="radio" name="slot" value="' + s.id + '"' + (s.free ? '' : ' disabled') + (prev === s.id && s.free ? ' checked' : '') + '><span>' + s.label + (s.free ? '' : '<span class="sr-only">, booked</span>') + '</span></label>';
      }).join('');
    }

    function validateField(input) {
      var v = input.value.trim(), ok = true;
      if (input.id === 'q-name') ok = v.length >= 2;
      if (input.id === 'q-phone') ok = /^(\+44\s?|0)[\d\s]{9,13}$/.test(v) && v.replace(/\D/g, '').length >= 10;
      if (input.id === 'q-address') ok = v.length >= 4;
      if (input.id === 'q-email') ok = !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      var err = document.getElementById(input.id + '-err');
      if (err) err.hidden = ok;
      if (ok) input.removeAttribute('aria-invalid'); else input.setAttribute('aria-invalid', 'true');
      return ok;
    }
    function validateBooking() {
      var day = form.querySelector('input[name="day"]:checked');
      var slot = form.querySelector('input[name="slot"]:checked');
      var fields = ['q-name', 'q-phone', 'q-address', 'q-email'].map(function (id) { return document.getElementById(id); });
      var bad = fields.filter(function (f) { return !validateField(f); });
      if (!day || !slot) { showErr('book', !day ? 'Pick a day for us to come.' : 'Pick an arrival time.'); (form.querySelector('input[name="' + (!day ? 'day' : 'slot') + '"]:not(:disabled)') || next).focus(); return false; }
      if (bad.length) { bad[0].focus(); return false; }
      return true;
    }

    function submit() {
      var st = state();
      var q = quoteFor(st);
      var dk = form.querySelector('input[name="day"]:checked').value;
      var sid = form.querySelector('input[name="slot"]:checked').value;
      var p = dk.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]);
      var slot = D.slots.filter(function (s) { return s.id === sid; })[0];
      var work = form.querySelector('input[name="bookType"]:checked').value === 'work';
      var ref = 'HD-' + String(d.getDate()).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0') + '-' + (TOUR ? D.tour.refSuffix : (function () { var a = 'ACDEFGHJKMNPQRTUVWXY3479', s = ''; for (var i = 0; i < 3; i++) s += a[Math.floor(Math.random() * a.length)]; return s; })());
      var first = form.elements['name'].value.trim().split(/\s+/)[0];
      var who = (st.svc.render) ? 'Jas' : (st.svc.driveway || st.svc.patio || st.svc.solar) ? 'Dev' : 'Mick';

      next.disabled = true; next.classList.add('is-busy');
      nextLabel.textContent = 'Booking…';
      var icon = $('svg', next); icon.style.display = 'none';
      var sp = document.createElement('span'); sp.className = 'spin'; sp.setAttribute('aria-hidden', 'true'); next.appendChild(sp);

      setTimeout(function () {
        next.disabled = false; next.classList.remove('is-busy'); sp.remove(); icon.style.display = '';
        booked = { ref: ref, date: d, slot: slot, work: work };
        $('[data-done-title]', form).textContent = 'You’re booked in, ' + first + '.';
        $('[data-done-when]', form).innerHTML = (work ? 'We’ll start on ' : 'Free visit on ') + '<strong>' + longDate(d) + '</strong>, arriving between <strong>' + slot.label.replace('–', ' and ') + '</strong>.';
        $('[data-done-text]', form).textContent = 'Kerry will text ' + form.elements['phone'].value.trim() + ' the evening before.';
        $('[data-done-look]', form).textContent = work
          ? 'We’ll send a card link when we’ve finished. Your guide price was ' + money(q.total) + ' inc. VAT.'
          : who + ' will measure up and confirm your price in writing (the guide was ' + money(q.total) + ' inc. VAT). If you’re out, it goes through the door.';
        $('[data-done-ref]', form).textContent = ref;
        tNo.hidden = true;
        stamp.innerHTML = (work ? 'Work booked' : 'Visit booked') + '<small>' + shortDate(d) + ' · ' + slot.label + '</small><small>' + ref + '</small>';
        stamp.hidden = false;
        showStep(5, true);
        dots.forEach(function (dd) { dd.classList.remove('is-current'); dd.classList.add('is-done'); dd.removeAttribute('aria-current'); });
      }, TOUR ? 1100 : 900);
    }

    function restart() {
      form.reset();
      panels = S.solar.panels.value;
      booked = null;
      stamp.hidden = true;
      tNo.hidden = false;
      clearErrs();
      $$('.field-err', form).forEach(function (e) { e.hidden = true; });
      $$('[aria-invalid]', form).forEach(function (e) { e.removeAttribute('aria-invalid'); });
      checkPostcode(false);
      showStep(1, true);
    }
    $('[data-q-restart]', form).addEventListener('click', restart);

    window.HD = window.HD || {};
    window.HD.quotePostcode = function (v) { var pc = parsePostcode(v); pcInput.value = pc ? pc.pretty : v; checkPostcode(true); };
    // A postcode carried over from the areas page.
    try { var carried = sessionStorage.getItem('hd-postcode'); if (carried && !TOUR) { pcInput.value = carried; } } catch (e) { /* storage off */ }
    if (pcInput.value) checkPostcode(false);
    syncExtras(); renderTicket(); showStep(1, false);
  })();

  /* ------------------------------------------------------------------ */
  /* Hero: postcode → round day, and who’s on the rounds today           */
  /* ------------------------------------------------------------------ */
  var heroPc = $('[data-hero-pc]');
  if (heroPc) (function () {
    var input = $('#hero-postcode');
    var out = $('[data-hero-pc-result]');
    function read(final) {
      var pc = parsePostcode(input.value);
      var st = areaStatus(pc);
      if (!input.value.trim()) { out.textContent = 'Tells you your round day, then takes you to a price.'; return st; }
      if (st.kind === 'round') out.innerHTML = '<strong>' + pc.outward + ': ' + st.round.name + ' round.</strong> ' + st.round.areas + '.';
      else if (st.kind === 'saturday') out.innerHTML = '<strong>' + pc.outward + ': Saturdays.</strong> One-off jobs, no window round yet.';
      else if (st.kind === 'out') out.innerHTML = 'Sorry, we don’t cover <strong>' + pc.outward + '</strong>. Ring Kerry and she’ll point you to someone good.';
      else out.textContent = final ? 'That doesn’t look like a postcode. Try something like BS3 1AB.' : 'Keep going…';
      return st;
    }
    input.addEventListener('input', function () { read(false); });
    heroPc.addEventListener('submit', function (e) {
      e.preventDefault();
      var st = read(true);
      if (st.kind === 'invalid' && input.value.trim()) { input.focus(); return; }
      if (window.HD && window.HD.quotePostcode && input.value.trim()) window.HD.quotePostcode(input.value);
      var q = $('#quote');
      window.scrollTo({ top: q.getBoundingClientRect().top + window.scrollY - 70, behavior: reduced ? 'auto' : 'smooth' });
      var first = $('.svc input', q); if (first) first.focus({ preventScroll: true });
    });

    var now = clock();
    var key = dateKey(now);
    var dayEl = $('[data-today-text]'), areasEl = $('[data-today-areas]');
    var round = D.rounds.filter(function (r) { return r.day === now.getDay(); })[0];
    if (D.closed.indexOf(key) !== -1) { dayEl.textContent = 'Bank holiday · no rounds'; areasEl.textContent = 'We’re back out tomorrow. Leave Kerry a message.'; }
    else if (round) { dayEl.textContent = DOW[now.getDay()] + ' · ' + round.districts.join(' & '); areasEl.textContent = round.areas; }
    else if (now.getDay() === 6) { dayEl.textContent = 'Saturday · one-off jobs'; areasEl.textContent = 'One-off jobs, here and just off our patch.'; }
    else { dayEl.textContent = 'Sunday · no rounds'; areasEl.textContent = 'Kerry’s back on the phone at 8 tomorrow.'; }
  })();

  /* ------------------------------------------------------------------ */
  /* Areas page: postcode checker and the map                            */
  /* ------------------------------------------------------------------ */
  var checker = $('[data-checker]');
  if (checker) (function () {
    var input = $('#area-postcode');
    var result = $('[data-checker-result]');
    var mapInfo = $('[data-map-info]');
    function highlight(dayNum) {
      $$('.map-area').forEach(function (a) { a.classList.toggle('is-active', dayNum != null && +a.getAttribute('data-day') === dayNum); });
    }
    function run() {
      var pc = parsePostcode(input.value);
      var st = areaStatus(pc);
      result.className = 'checker-result';
      if (!input.value.trim()) { result.innerHTML = '<p>Type your postcode, or just the first half, like <strong>BS3</strong>.</p>'; highlight(null); return; }
      if (st.kind === 'invalid') { result.classList.add('is-out'); result.innerHTML = '<p>That doesn’t look like a postcode. Try something like <strong>BS4 2RT</strong>.</p>'; highlight(null); return; }
      try { sessionStorage.setItem('hd-postcode', pc.pretty); } catch (e) { /* storage off */ }
      if (st.kind === 'round') {
        var dates = nextRoundDates(st.round, clock(), 2);
        result.classList.add('is-round');
        result.innerHTML = '<p><strong>' + pc.outward + ' is on our ' + st.round.name + ' round</strong>: ' + st.round.areas + '.</p><p>The next two are ' + longDate(dates[0]) + ' and ' + longDate(dates[1]) + '.</p><a class="link-arrow" href="index.html#quote">Get a guide price <svg aria-hidden="true"><use href="#i-arrow"/></svg></a>';
        highlight(st.round.day);
      } else if (st.kind === 'saturday') {
        result.innerHTML = '<p><strong>' + pc.outward + ' is just off our patch.</strong> We don’t run a window round there yet, but we come out on Saturdays for one-off jobs: windows, gutters, driveways, patios, render, roofs and solar panels.</p><a class="link-arrow" href="index.html#quote">Get a guide price <svg aria-hidden="true"><use href="#i-arrow"/></svg></a>';
        highlight(null);
      } else {
        result.classList.add('is-out');
        result.innerHTML = '<p><strong>Sorry, we don’t cover ' + pc.outward + '.</strong> Ring Kerry on <a href="tel:+441174960582">0117 496 0582</a> and she’ll point you to someone good nearer you.</p>';
        highlight(null);
      }
    }
    checker.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    input.addEventListener('input', function () { if (parsePostcode(input.value)) run(); });

    $$('.map-area').forEach(function (a) {
      var showInfo = function () {
        var r = D.rounds.filter(function (x) { return x.day === +a.getAttribute('data-day'); })[0];
        mapInfo.innerHTML = '<strong>' + a.getAttribute('data-name') + '</strong> ' + r.name + ' round · ' + r.districts.join(', ');
        highlight(r.day);
      };
      a.addEventListener('mouseenter', showInfo);
      a.addEventListener('focus', showInfo);
      a.addEventListener('click', showInfo);
      a.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showInfo(); } });
    });
  })();
})();
