/* Ten to Two Garage: site behaviour and the booking flow. No backend: nothing is sent anywhere. */
(function () {
  'use strict';

  var D = window.TT_DATA;
  var TOUR = !!(window.HiconTour && window.HiconTour.active);
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Time ----------------------------------------------------------
  // In tour mode "today" is pinned so every recording matches.
  function now() {
    if (TOUR) { var t = D.tour.now; return new Date(t[0], t[1], t[2], t[3], t[4]); }
    return new Date();
  }
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Bank holidays in England and Wales: the garage is closed.
  // Days the garage is shut: bank holidays in England and Wales, plus Boxing Day.
  var CLOSED_DAYS = ['2026-12-25', '2026-12-26', '2026-12-28', '2027-01-01', '2027-03-26', '2027-03-29', '2027-05-03', '2027-05-31', '2027-08-30', '2027-12-25', '2027-12-27', '2027-12-28'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayOnly(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); }
  function addDays(d, n) { var x = dayOnly(d); x.setDate(x.getDate() + n); return x; }
  function fmtDate(d) { return d.getDate() + ' ' + MON[d.getMonth()]; }
  function fmtDay(d) { return DOW[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; }
  function hm(mins) { return pad(Math.floor(mins / 60)) + ':' + pad(mins % 60); }
  function toMins(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  function money(p) { return '£' + (p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function moneyShort(p) { return p % 100 ? money(p) : '£' + (p / 100).toLocaleString('en-GB'); }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function icon(id) { return '<svg class="ico" aria-hidden="true"><use href="#' + id + '"/></svg>'; }

  function isOpenDay(d) { return !!D.hours[d.getDay()] && CLOSED_DAYS.indexOf(iso(d)) < 0; }

  // ---------- Open now ------------------------------------------------------
  function openStatus() {
    var n = now(), mins = n.getHours() * 60 + n.getMinutes(), h = isOpenDay(n) ? D.hours[n.getDay()] : null;
    if (h && mins >= h[0] && mins < h[1]) return { open: true, text: 'Open now until ' + hm(h[1]) };
    if (h && mins < h[0]) return { open: false, text: 'Opens today at ' + hm(h[0]) };
    for (var i = 1; i < 9; i++) {
      var d = addDays(n, i);
      if (isOpenDay(d)) return { open: false, text: 'Closed · opens ' + (i === 1 ? 'tomorrow' : DOW[d.getDay()]) + ' ' + hm(D.hours[d.getDay()][0]) };
    }
    return { open: false, text: 'Closed now' };
  }
  function renderOpen() {
    var s = openStatus();
    $$('[data-open-status]').forEach(function (el) {
      el.classList.toggle('is-closed', !s.open);
      el.lastElementChild.textContent = s.text;
    });
    var today = now().getDay();
    $$('[data-hours] tr').forEach(function (tr) { tr.classList.toggle('is-today', +tr.getAttribute('data-day') === today); });
  }

  // ---------- Mobile menu ---------------------------------------------------
  function initMenu() {
    var menu = $('#menu'), openBtn = $('[data-menu-open]');
    if (!menu || !openBtn) return;
    var closeBtn = $('[data-menu-close]', menu);
    function focusables() { return $$('a, button', menu); }
    function open() {
      menu.hidden = false; document.body.classList.add('menu-open');
      openBtn.setAttribute('aria-expanded', 'true');
      closeBtn.focus();
    }
    function close(returnFocus) {
      menu.hidden = true; document.body.classList.remove('menu-open');
      openBtn.setAttribute('aria-expanded', 'false');
      if (returnFocus) openBtn.focus();
    }
    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', function () { close(true); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(false); });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.matchMedia('(min-width: 1061px)').addEventListener('change', function (m) { if (m.matches && !menu.hidden) close(false); });
  }

  // ---------- Plates --------------------------------------------------------
  function cleanPlate(v) { return v.toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function showPlate(v) {
    var c = cleanPlate(v);
    if (/^[A-Z]{2}\d{2}[A-Z]{3}$/.test(c)) return c.slice(0, 4) + ' ' + c.slice(4);
    if (c.length > 4) return c.slice(0, c.length - 3) + ' ' + c.slice(-3);
    return c;
  }
  function bindPlateInput(input) {
    input.addEventListener('input', function () {
      var v = input.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').replace(/^\s/, '');
      if (v !== input.value) {
        var pos = input.selectionStart;
        input.value = v;
        try { input.setSelectionRange(pos, pos); } catch (e) { /* not focused */ }
      }
    });
    input.addEventListener('blur', function () { if (input.value) input.value = showPlate(input.value); });
  }
  function bandFor(litres) { return litres <= 1.4 ? 'small' : litres <= 2.0 ? 'mid' : 'large'; }
  function bandInfo(id) { for (var i = 0; i < D.bands.length; i++) if (D.bands[i].id === id) return D.bands[i]; return D.bands[0]; }

  // ---------- Prices page ---------------------------------------------------
  function initPrices() {
    var sw = $('#band-switch');
    if (!sw) return;
    var buttons = $$('button', sw);
    function set(band, focus) {
      buttons.forEach(function (b) {
        var on = b.getAttribute('data-band') === band;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      ['interim', 'full'].forEach(function (k) {
        var ex = D.services[k].price[band];
        $$('[data-price="' + k + '"]').forEach(function (el) {
          el.textContent = moneyShort(Math.round(ex * (1 + D.vat)));
          el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash');
        });
        $$('[data-ex="' + k + '"]').forEach(function (el) { el.textContent = money(ex) + ' + ' + money(Math.round(ex * D.vat)) + ' VAT'; });
      });
      $$('[data-band-label]').forEach(function (el) { el.textContent = bandInfo(band).label.toLowerCase(); });
      $$('[data-book-link]').forEach(function (a) { a.href = 'index.html?work=' + a.getAttribute('data-book-link') + '&band=' + band + '#book'; });
    }
    sw.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) set(b.getAttribute('data-band')); });
    sw.addEventListener('keydown', function (e) {
      var i = buttons.indexOf(document.activeElement); if (i < 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); set(buttons[(i + 1) % buttons.length].getAttribute('data-band'), true); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); set(buttons[(i + buttons.length - 1) % buttons.length].getAttribute('data-band'), true); }
    });
    set('mid');
  }

  // ---------- Booking -------------------------------------------------------
  function initBooking() {
    var steps = $('#steps');
    if (!steps) return;

    var params = new URLSearchParams(location.search);
    var preWork = params.get('work');
    var preBand = params.get('band');

    var state;
    function reset() {
      state = { step: 1, done: {}, vehicle: null, work: { mot: false, service: null }, mode: 'drop', day: null, time: null, name: '', mobile: '', email: '', notes: '', ref: null };
    }
    reset();

    var el = {
      heroForm: $('#hero-form'), heroReg: $('#hero-reg'),
      bookForm: $('#book-form'), bookReg: $('#book-reg'), regMsg: $('#book-reg-msg'),
      vehicle: $('#vehicle'), work: $('#work'), workNote: $('#work-note'), workErr: $('#work-error'),
      modes: $('#modes'), days: $('#days'), times: $('#times'), slotNote: $('#slot-note'), whenErr: $('#when-error'),
      details: $('#details'), done: $('#done'), jobcard: $('#jobcard'), book: $('#book'),
    };
    bindPlateInput(el.heroReg);
    bindPlateInput(el.bookReg);

    // --- Steps ---
    function stepEl(n) { return $('.step[data-step="' + n + '"]', steps); }
    function openStep(n, opts) {
      state.step = n;
      for (var i = 1; i <= 4; i++) {
        var s = stepEl(i);
        s.classList.toggle('is-active', i === n);
        s.classList.toggle('is-done', i !== n && !!state.done[i]);
        $('.step__head', s).setAttribute('aria-current', i === n ? 'step' : 'false');
      }
      if (n === 2) renderWork();
      if (n === 3) renderWhen();
      if (opts && opts.focus) {
        var title = $('.step__title', stepEl(n));
        title.setAttribute('tabindex', '-1');
        title.focus({ preventScroll: true });
      }
      if (!(opts && opts.noScroll)) keepInView(stepEl(n));
    }
    function keepInView(node) {
      var r = node.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.6) {
        var y = window.scrollY + r.top - 24;
        window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }
    // Desktop: the booking section fills the screen, so line its top up with the viewport.
    function scrollToBook() {
      var y = window.scrollY + el.book.getBoundingClientRect().top;
      if (Math.abs(el.book.getBoundingClientRect().top) < 2) return;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    function complete(n) { state.done[n] = true; summarise(); }
    function invalidateFrom(n) { for (var i = n; i <= 4; i++) delete state.done[i]; summarise(); }
    function summarise() {
      var v = state.vehicle;
      setSummary(1, v ? showPlate(v.reg) + ' · ' + v.name : '');
      var lines = workLines();
      setSummary(2, lines.length ? lines.map(function (l) { return l.short; }).join(' and ') + ' · ' + money(totals().total) : '');
      setSummary(3, state.day && state.time ? whenText() : '');
      setSummary(4, state.name ? state.name + ' · ' + state.mobile : '');
    }
    function setSummary(n, text) { $('[data-summary]', stepEl(n)).textContent = state.done[n] ? text : ''; }
    $$('[data-change]', steps).forEach(function (b) {
      b.addEventListener('click', function () { var n = +b.getAttribute('data-change'); openStep(n, { focus: true }); });
    });

    // --- Step 1: the car ---
    function lookup(regRaw, fromHero) {
      var reg = cleanPlate(regRaw);
      el.bookReg.value = showPlate(regRaw);
      el.vehicle.hidden = true;
      el.regMsg.classList.remove('is-error');
      if (reg.length < 2 || reg.length > 7 || !/[A-Z]/.test(reg) || !/\d/.test(reg)) {
        el.regMsg.textContent = reg.length ? 'That doesn’t look like a UK reg. Check it and try again.' : 'Type your reg into the plate first.';
        el.regMsg.classList.add('is-error');
        var p = el.bookReg.closest('.plate'); p.classList.remove('is-shake'); void p.offsetWidth; p.classList.add('is-shake');
        if (!fromHero) el.bookReg.focus();
        return;
      }
      // A new car starts a fresh job card: the work, prices and slot all depend on it.
      invalidateFrom(1);
      state.vehicle = null; state.pending = null;
      state.work = { mot: false, service: null };
      state.mode = 'drop'; state.day = null; state.time = null;
      state.prefilled = false;
      updateCard();
      var btn = $('button[type="submit"]', el.bookForm);
      btn.classList.add('is-busy'); btn.textContent = 'Looking…';
      el.regMsg.textContent = 'Looking up ' + showPlate(reg) + '…';
      setTimeout(function () {
        btn.classList.remove('is-busy'); btn.textContent = 'Find my car';
        var known = D.vehicles[reg];
        if (known) showKnown(reg, known); else showUnknown(reg);
        if (fromHero) scrollToBook();
      }, 650);
    }

    function motInfo(due) {
      var today = dayOnly(now());
      var days = Math.round((dayOnly(due) - today) / 86400000);
      if (days < 0) return {
        cls: 'is-expired', icon: 'i-alert', badge: 'MOT ran out ' + fmtDate(due),
        note: 'Your MOT ran out on ' + fmtDate(due) + '. You can still drive it here for a booked MOT test, but nowhere else until it passes.',
      };
      var early = new Date(due); early.setMonth(early.getMonth() - 1); early.setDate(early.getDate() + 1);
      if (days <= 30) return {
        cls: 'is-due', icon: 'i-clock', badge: 'MOT due ' + fmtDate(due),
        note: 'Due in ' + days + ' day' + (days === 1 ? '' : 's') + '. Test it any time from now and you keep ' + fmtDate(due) + ' as next year’s date.',
      };
      return {
        cls: '', icon: 'i-check', badge: 'MOT valid to ' + fmtDate(due),
        note: 'No rush for the MOT. From ' + fmtDate(early) + ' you can test early and still keep ' + fmtDate(due) + ' as your date.',
      };
    }

    function showKnown(reg, k) {
      var due = addDays(now(), k.motDays);
      var mot = motInfo(due);
      state.pending = { reg: reg, known: true, name: k.make + ' ' + k.model, litres: k.litres, band: bandFor(k.litres), fuel: k.fuel, year: k.year, colour: k.colour, motDue: due, motState: mot.cls };
      el.vehicle.innerHTML =
        '<div class="vehicle__top"><div><p class="vehicle__name">' + esc(k.make + ' ' + k.model) + '</p>' +
        '<p class="vehicle__meta">' + k.year + ' · ' + esc(k.colour) + ' · ' + k.litres.toFixed(1) + ' litre ' + k.fuel.toLowerCase() + '</p></div>' +
        '<span class="mot-badge ' + mot.cls + '">' + icon(mot.icon) + esc(mot.badge) + '</span></div>' +
        '<p class="vehicle__note">' + icon('i-info') + '<span>' + esc(mot.note) + '</span></p>' +
        '<div class="vehicle__actions"><button class="btn btn--blue" type="button" data-confirm-car>Yes, that’s my car ' + icon('i-arrow') + '</button>' +
        '<button class="btn btn--ghost" type="button" data-not-mine>Not my car</button></div>';
      el.vehicle.hidden = false;
      $('[data-confirm-car]', el.vehicle).addEventListener('click', confirmCar);
      el.regMsg.textContent = 'Found ' + showPlate(reg) + ': ' + k.make + ' ' + k.model + ', ' + mot.badge + '.';
      var nameEl = $('.vehicle__name', el.vehicle); nameEl.tabIndex = -1; nameEl.focus({ preventScroll: true });
      $('[data-not-mine]', el.vehicle).addEventListener('click', notMine);
      el.vehicle.classList.add('is-found');
    }

    function showUnknown(reg) {
      var band = preBand && bandInfo(preBand).id === preBand ? preBand : null;
      state.pending = { reg: reg, known: false, name: '', band: band, motDue: null };
      el.vehicle.innerHTML =
        '<p class="vehicle__name">We couldn’t find ' + esc(showPlate(reg)) + '.</p>' +
        '<p class="vehicle__meta">No problem: tell us what it is and we’ll check the MOT date when you arrive. <span class="demo-note">(This demo knows five made-up plates, such as ZQ19 QTW.)</span></p>' +
        '<div class="manual">' +
        '<div class="field field--wide"><label for="m-model">Make and model</label><input id="m-model" type="text" autocomplete="off" placeholder="For example, Ford Focus" aria-describedby="m-model-err"><p class="field__err" id="m-model-err"></p></div>' +
        '<div class="field field--wide"><span class="field__label" id="m-band-label">Engine size</span><div class="bands" role="radiogroup" aria-labelledby="m-band-label">' +
        D.bands.map(function (b) { return '<button type="button" role="radio" data-band="' + b.id + '" aria-checked="' + (b.id === band) + '">' + esc(b.label) + '</button>'; }).join('') +
        '</div><p class="field__hint">It’s on your V5C logbook, or in the car’s handbook. Not sure? Pick the closest and we’ll check.</p><p class="field__err" id="m-band-err"></p></div>' +
        '</div>' +
        '<div class="vehicle__actions"><button class="btn btn--blue" type="button" data-use-manual>Use these details ' + icon('i-arrow') + '</button></div>';
      el.vehicle.hidden = false;
      el.vehicle.classList.remove('is-found');
      var group = $('.bands', el.vehicle);
      group.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        state.pending.band = b.getAttribute('data-band');
        $$('button', group).forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
        $('#m-band-err').textContent = '';
      });
      $('[data-use-manual]', el.vehicle).addEventListener('click', function () {
        var model = $('#m-model').value.trim(), ok = true;
        $('#m-model-err').textContent = ''; $('#m-model').removeAttribute('aria-invalid');
        if (model.length < 2) { $('#m-model-err').textContent = 'Tell us the make and model.'; $('#m-model').setAttribute('aria-invalid', 'true'); ok = false; }
        if (!state.pending.band) { $('#m-band-err').textContent = 'Pick an engine size so we can price it.'; ok = false; }
        if (!ok) { (model.length < 2 ? $('#m-model') : $('.bands button', el.vehicle)).focus(); return; }
        state.pending.name = model + ' (' + bandInfo(state.pending.band).short + ')';
        confirmCar();
      });
      el.regMsg.textContent = 'We couldn’t find ' + showPlate(reg) + '. Tell us the make, model and engine size.';
      $('#m-model').focus({ preventScroll: true });
    }

    function notMine() {
      el.vehicle.hidden = true;
      state.pending = null;
      el.regMsg.textContent = 'Check the reg in the plate and try again, or ring us on 01632 960 482.';
      el.bookReg.focus(); el.bookReg.select();
    }

    function confirmCar() {
      state.vehicle = state.pending;
      if (preWork && !state.prefilled) {
        state.prefilled = true;
        if (preWork === 'mot') state.work.mot = true;
        if (preWork === 'interim' || preWork === 'full') state.work.service = preWork;
      }
      complete(1);
      updateCard(true);
      openStep(2, { focus: true });
    }

    el.heroForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = el.heroReg.value;
      if (!cleanPlate(v)) {
        var p = el.heroReg.closest('.plate'); p.classList.remove('is-shake'); void p.offsetWidth; p.classList.add('is-shake');
        el.heroReg.focus();
        return;
      }
      openStep(1, { noScroll: true });
      scrollToBook();
      lookup(v, true);
    });
    el.bookForm.addEventListener('submit', function (e) { e.preventDefault(); lookup(el.bookReg.value); });

    // --- Step 2: the work ---
    function servicePrice(k) { return D.services[k].price[state.vehicle.band]; }
    function motPrice() { return state.work.service ? D.mot.withService : D.mot.alone; }
    function workLines() {
      var out = [];
      if (!state.vehicle) return out;
      if (state.work.service) {
        var s = D.services[state.work.service];
        out.push({ key: state.work.service, name: s.name, sub: bandInfo(state.vehicle.band).short, price: servicePrice(state.work.service), vat: true, short: s.name.toLowerCase() });
      }
      if (state.work.mot) out.push({ key: 'mot', name: 'MOT test', sub: 'no VAT on MOTs', price: motPrice(), vat: false, short: 'MOT' });
      if (out.length === 2) out[1].short = 'MOT';
      if (out.length) out[0].short = out[0].short.charAt(0).toUpperCase() + out[0].short.slice(1);
      return out;
    }
    function totals() {
      var ex = 0, mot = 0;
      workLines().forEach(function (l) { if (l.vat) ex += l.price; else mot += l.price; });
      var vat = Math.round(ex * D.vat);
      return { ex: ex, vat: vat, mot: mot, total: ex + vat + mot };
    }
    function renderWork() {
      var v = state.vehicle;
      el.workNote.innerHTML = 'Prices for your <strong>' + esc(bandInfo(v.band).short) + '</strong> engine, VAT included. MOTs carry no VAT.' +
        (v.motState === 'is-expired' ? ' Your MOT has run out, so we’d book that first.' : '');
      var mp = motPrice();
      var items = [
        { key: 'mot', name: 'MOT test', sub: 'About 45 minutes. The legal maximum is £54.85.', price: money(mp), small: state.work.service ? 'with a service' : '£35.00 with a service', checked: state.work.mot },
        { key: 'interim', name: 'Interim service', sub: D.services.interim.every + ' · ' + D.services.interim.time.toLowerCase(), price: money(Math.round(servicePrice('interim') * (1 + D.vat))), small: money(servicePrice('interim')) + ' + VAT', checked: state.work.service === 'interim' },
        { key: 'full', name: 'Full service', sub: D.services.full.every + ' · ' + D.services.full.time.toLowerCase(), price: money(Math.round(servicePrice('full') * (1 + D.vat))), small: money(servicePrice('full')) + ' + VAT', checked: state.work.service === 'full' },
      ];
      el.work.innerHTML = '<legend class="sr-only">Choose the work</legend>' + items.map(function (it) {
        return '<label class="choice" data-work="' + it.key + '"><input type="checkbox" name="work" value="' + it.key + '"' + (it.checked ? ' checked' : '') + '>' +
          '<span class="choice__box" aria-hidden="true">' + icon('i-check') + '</span>' +
          '<span class="choice__text"><span class="choice__name">' + it.name + '</span><span class="choice__sub">' + it.sub + '</span></span>' +
          '<span class="choice__price"><b>' + it.price + '</b><small>' + it.small + '</small></span></label>';
      }).join('');
      el.workErr.textContent = '';
    }
    el.work.addEventListener('change', function (e) {
      var input = e.target; if (!input.matches('input[name="work"]')) return;
      var k = input.value;
      if (k === 'mot') state.work.mot = input.checked;
      else state.work.service = input.checked ? k : (state.work.service === k ? null : state.work.service);
      invalidateFrom(2);
      checkWhenStillValid();
      renderWork();
      var again = $('input[value="' + k + '"]', el.work); if (again) again.focus({ preventScroll: true });
      updateCard(false, k);
    });
    $('[data-next="2"]', steps).addEventListener('click', function () {
      if (!state.work.mot && !state.work.service) { el.workErr.textContent = 'Pick at least one: an MOT, a service, or both.'; return; }
      complete(2);
      openStep(3, { focus: true });
    });

    // --- Step 3: when ---
    function duration() {
      var m = 0;
      if (state.work.service) m += D.services[state.work.service].minutes;
      if (state.work.mot) m += state.work.service ? 30 : 45;
      return m;
    }
    function canWait() { return state.work.service !== 'full'; }
    function slotsFor(d) {
      var dow = d.getDay(), h = D.hours[dow], today = iso(d) === iso(now());
      var nowMins = now().getHours() * 60 + now().getMinutes();
      var list;
      if (state.mode === 'drop') {
        if (dow === 6 && state.work.service === 'full') return { reason: 'Saturday is mornings only, so no full services', times: [] };
        list = D.dropOff.filter(function (t) { return toMins(t) >= h[0]; });
      } else {
        list = (dow === 6 ? D.waitSat : D.wait).filter(function (t) { return toMins(t) + duration() <= h[1]; });
      }
      var times = list.map(function (t) {
        var key = iso(d) + ' ' + t;
        var taken = hash(key + state.mode) % 100 < 38;
        if (TOUR && D.tour.keepFree.indexOf(key) >= 0) taken = false;
        if (today && toMins(t) < nowMins + 30) taken = true;
        return { t: t, free: !taken };
      });
      return { times: times, reason: '' };
    }
    function bookableDays() {
      var out = [], d = dayOnly(now());
      for (var i = 0; out.length < 12 && i < 30; i++) {
        var x = addDays(d, i);
        if (x.getDay() === 0) continue; // closed Sundays: not shown
        out.push(x);
      }
      return out;
    }
    function dayState(d) {
      if (CLOSED_DAYS.indexOf(iso(d)) >= 0) return { ok: false, label: 'Closed' };
      var s = slotsFor(d);
      if (s.reason) return { ok: false, label: 'AM only', reason: s.reason };
      var free = s.times.filter(function (x) { return x.free; }).length;
      return free ? { ok: true, label: free + ' free' } : { ok: false, label: 'Full' };
    }
    function checkWhenStillValid() {
      if (!canWait() && state.mode === 'wait') { state.mode = 'drop'; state.time = null; }
      if (state.day) {
        var d = new Date(state.day + 'T12:00:00');
        var ds = dayState(d);
        if (!ds.ok) { state.day = null; state.time = null; }
        else if (state.time) {
          var ok = slotsFor(d).times.some(function (x) { return x.t === state.time && x.free; });
          if (!ok) state.time = null;
        }
      }
      if (!state.day || !state.time) invalidateFrom(3);
      updateCard();
    }
    function renderWhen() {
      // Modes
      $$('.mode', el.modes).forEach(function (b) {
        var m = b.getAttribute('data-mode');
        b.setAttribute('aria-checked', state.mode === m ? 'true' : 'false');
        b.tabIndex = state.mode === m ? 0 : -1;
        if (m === 'wait') {
          b.setAttribute('aria-disabled', canWait() ? 'false' : 'true');
          var dur = duration();
          $('[data-wait-hint]', b).textContent = canWait()
            ? 'About ' + (dur >= 60 ? (dur === 90 ? '1½ hours' : (dur / 60) + ' hour' + (dur > 60 ? 's' : '')) : dur + ' minutes') + ', with a brew and Wi-Fi'
            : 'Not for a full service: it takes about 3 hours';
        }
      });
      // Days
      el.days.innerHTML = bookableDays().map(function (d) {
        var ds = dayState(d), key = iso(d), sel = state.day === key;
        var dow = iso(d) === iso(now()) ? 'Today' : DOW[d.getDay()];
        return '<button type="button" role="radio" class="day" data-day="' + key + '" aria-checked="' + sel + '" tabindex="' + (sel ? 0 : -1) + '"' + (ds.ok ? '' : ' disabled') +
          ' aria-label="' + DOW_LONG[d.getDay()] + ' ' + fmtDate(d) + ', ' + (ds.ok ? ds.label : ds.label === 'Closed' ? 'closed' : (ds.reason || 'fully booked')) + '">' +
          '<span class="day__dow">' + dow + '</span><span class="day__num">' + d.getDate() + '</span><span class="day__free">' + ds.label + '</span></button>';
      }).join('');
      $('#days-hint').textContent = state.work.service === 'full' ? 'Saturdays are mornings only, so a full service needs a weekday.' : '';
      var firstDay = $('.day[aria-checked="true"]', el.days) || $('.day:not(:disabled)', el.days);
      if (firstDay) firstDay.tabIndex = 0;
      // Times
      if (!state.day) {
        el.times.innerHTML = '<p class="times__empty">Pick a day to see the times.</p>';
      } else {
        var s = slotsFor(new Date(state.day + 'T12:00:00'));
        el.times.innerHTML = s.times.map(function (x) {
          var sel = state.time === x.t;
          return '<button type="button" role="radio" class="time" data-time="' + x.t + '" aria-checked="' + sel + '" tabindex="' + (sel ? 0 : -1) + '"' + (x.free ? '' : ' disabled') + ' aria-label="' + x.t + (x.free ? '' : ', taken') + '">' + x.t + '</button>';
        }).join('');
        var firstT = $('.time[aria-checked="true"]', el.times) || $('.time:not(:disabled)', el.times);
        if (firstT) firstT.tabIndex = 0;
      }
      el.slotNote.innerHTML = slotNote();
      el.whenErr.textContent = '';
    }
    function slotNote() {
      if (!state.day || !state.time) return state.mode === 'drop' ? 'Drop off between 07:45 and 09:00. We text you when it’s ready.' : 'Pick a start time. We’ll have you on your way as quickly as we can.';
      var d = new Date(state.day + 'T12:00:00');
      if (state.mode === 'wait') return 'You’ll be on your way by about <strong>' + hm(toMins(state.time) + duration()) + '</strong>.';
      var ready = d.getDay() === 6 ? '12:30' : (state.work.service === 'full' ? '16:00' : '14:00');
      return 'Ready by about <strong>' + ready + '</strong> on ' + DOW_LONG[d.getDay()] + '. We’ll text you as soon as it is.';
    }
    function whenText() {
      var d = new Date(state.day + 'T12:00:00');
      return fmtDay(d) + ', ' + (state.mode === 'drop' ? 'drop off ' + state.time : state.time + ', waiting');
    }
    el.modes.addEventListener('click', function (e) {
      var b = e.target.closest('.mode'); if (!b) return;
      var m = b.getAttribute('data-mode');
      if (m === 'wait' && !canWait()) { el.whenErr.textContent = 'A full service takes about 3 hours, so it’s drop-off only.'; return; }
      if (m === state.mode) return;
      state.mode = m; state.time = null;
      checkWhenStillValid(); renderWhen();
      $('.mode[data-mode="' + m + '"]', el.modes).focus({ preventScroll: true });
    });
    el.days.addEventListener('click', function (e) {
      var b = e.target.closest('.day'); if (!b || b.disabled) return;
      state.day = b.getAttribute('data-day'); state.time = null;
      invalidateFrom(3); renderWhen(); updateCard();
      $('.day[data-day="' + state.day + '"]', el.days).focus({ preventScroll: true });
    });
    el.times.addEventListener('click', function (e) {
      var b = e.target.closest('.time'); if (!b || b.disabled) return;
      state.time = b.getAttribute('data-time');
      renderWhen(); updateCard(false, 'when');
      $('.time[data-time="' + state.time + '"]', el.times).focus({ preventScroll: true });
    });
    // Arrow keys move through radio groups.
    function arrowNav(container, selector) {
      container.addEventListener('keydown', function (e) {
        var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (!(e.key in keys)) return;
        var items = $$(selector, container).filter(function (x) { return !x.disabled && x.getAttribute('aria-disabled') !== 'true'; });
        var i = items.indexOf(document.activeElement); if (i < 0) return;
        e.preventDefault();
        var next = items[(i + keys[e.key] + items.length) % items.length];
        next.click(); next.focus();
      });
    }
    arrowNav(el.modes, '.mode'); arrowNav(el.days, '.day'); arrowNav(el.times, '.time');
    $('[data-next="3"]', steps).addEventListener('click', function () {
      if (!state.day) { el.whenErr.textContent = 'Pick a day first.'; return; }
      if (!state.time) { el.whenErr.textContent = 'Pick a time on ' + fmtDay(new Date(state.day + 'T12:00:00')) + '.'; return; }
      complete(3);
      openStep(4, { focus: true });
    });

    // --- Step 4: details ---
    var fName = $('#d-name'), fMobile = $('#d-mobile'), fEmail = $('#d-email'), fNotes = $('#d-notes');
    fName.addEventListener('input', function () { state.name = fName.value.trim(); updateCard(); });
    function setErr(input, msg) {
      var err = $('#' + input.id + '-err');
      err.textContent = msg || '';
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
    el.details.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = fName.value.trim(), mobile = fMobile.value.replace(/[\s()-]/g, ''), email = fEmail.value.trim();
      var bad = null;
      setErr(fName); setErr(fMobile); setErr(fEmail);
      if (name.length < 2) { setErr(fName, 'Tell us your name so we know who’s coming.'); bad = bad || fName; }
      if (!/^(?:\+44|0)7\d{9}$/.test(mobile)) { setErr(fMobile, 'Enter a UK mobile number, like 07700 900123.'); bad = bad || fMobile; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr(fEmail, 'That email doesn’t look right. Check it, or leave it blank.'); bad = bad || fEmail; }
      if (bad) { bad.focus(); return; }
      state.name = name; state.mobile = fMobile.value.trim(); state.email = email; state.notes = fNotes.value.trim();
      var btn = $('#book-it');
      btn.classList.add('is-busy'); btn.textContent = 'Booking you in…';
      setTimeout(function () {
        btn.classList.remove('is-busy'); btn.textContent = 'Book it in';
        complete(4);
        finish();
      }, 700);
    });

    // --- Done ---
    function finish() {
      var d = new Date(state.day + 'T12:00:00');
      var tail = state.vehicle.reg.slice(-3);
      state.ref = 'TT-' + pad(d.getDate()) + pad(d.getMonth() + 1) + '-' + tail;
      updateCard();
      var today = now();
      $('[data-jc="stampdate"]').textContent = today.getDate() + ' ' + MON[today.getMonth()].toUpperCase();
      steps.hidden = true;
      var first = state.name.split(' ')[0];
      $('#done-title').textContent = 'You’re booked in, ' + first + '.';
      $('#done-lede').innerHTML = esc(showPlate(state.vehicle.reg)) + ', ' + esc(fmtDay(d)) + (state.mode === 'drop' ? ': drop it off at <strong>' + state.time + '</strong>.' : ': we’ll start at <strong>' + state.time + '</strong>, so come a few minutes early.') +
        ' Your reference is <strong>' + state.ref + '</strong>. You pay ' + money(totals().total) + ' when you collect, and not a penny more unless you say yes.';
      el.done.hidden = false;
      el.done.focus({ preventScroll: true });
      el.jobcard.classList.remove('is-stamped'); void el.jobcard.offsetWidth;
      el.jobcard.classList.add('is-stamped');
      if (window.matchMedia('(max-width: 1060px)').matches) {
        setTimeout(function () { $('#jobcard-wrap').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); }, 120);
      } else {
        scrollToBook();
      }
      updateMini();
    }
    $('#book-again').addEventListener('click', function () {
      reset();
      el.details.reset();
      el.bookReg.value = ''; el.heroReg.value = '';
      el.vehicle.hidden = true; el.vehicle.innerHTML = '';
      el.done.hidden = true; steps.hidden = false;
      el.jobcard.classList.remove('is-stamped');
      updateCard();
      openStep(1, { focus: true });
      el.bookReg.focus();
    });

    // --- Job card ---
    function jc(name) { return $('[data-jc="' + name + '"]', el.jobcard); }
    var lastLines = '';
    function updateCard(flashVehicle, changed) {
      var v = state.vehicle;
      jc('ref').textContent = 'No. ' + (state.ref || '—');
      jc('reg').innerHTML = v ? '<span class="jc-plate">' + esc(showPlate(v.reg)) + '</span>' : '<span class="jc-empty">—</span>';
      jc('vehicle').innerHTML = v ? esc(v.name) : '<span class="jc-empty">—</span>';
      if (flashVehicle) flash(jc('vehicle'));
      var lines = workLines();
      var sig = lines.map(function (l) { return l.key + l.price; }).join('|');
      if (sig !== lastLines) {
        jc('lines').innerHTML = lines.length ? lines.map(function (l) {
          return '<li data-line="' + l.key + '"><span class="jc-line__name">' + esc(l.name) + '<small>' + esc(l.sub) + '</small></span><span class="jc-line__dots"></span><span class="jc-line__price">' + money(l.price) + '</span></li>';
        }).join('') : '<li class="jc-empty">Nothing chosen yet</li>';
        if (changed && changed !== 'when') {
          var li = $('[data-line="' + changed + '"]', jc('lines'));
          if (li) li.classList.add('is-new');
        }
        lastLines = sig;
      }
      var t = totals();
      var sums = jc('sums');
      sums.hidden = !lines.length;
      if (lines.length) {
        jc('vat').textContent = money(t.vat);
        var totalEl = jc('total');
        if (totalEl.textContent !== money(t.total)) { totalEl.textContent = money(t.total); flash(totalEl); }
      }
      jc('when').innerHTML = !v ? '<span class="jc-empty">—</span>' : state.day && state.time ? esc(whenText()) : (state.day ? esc(fmtDay(new Date(state.day + 'T12:00:00'))) + ', <span class="jc-empty">time to pick</span>' : '<span class="jc-empty">—</span>');
      if (changed === 'when') flash(jc('when'));
      jc('name').innerHTML = state.name ? esc(state.name) : '<span class="jc-empty">—</span>';
      if (typeof updateMini === 'function') updateMini();
    }
    // Phones: a compact running total that stays on screen while booking.
    var mini = $('#jc-mini'), bookInView = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { bookInView = entries[0].isIntersecting; updateMini(); }, { threshold: 0.05 }).observe(el.book);
    }
    var cardInView = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { cardInView = entries[0].isIntersecting; updateMini(); }, { threshold: 0.35 }).observe($('#jobcard-wrap'));
    }
    function updateMini() {
      if (!mini) return;
      var v = state.vehicle, lines = workLines();
      var show = bookInView && !cardInView && !!v && !state.ref;
      mini.hidden = !show;
      if (!show) return;
      $('[data-mini="reg"]', mini).textContent = showPlate(v.reg);
      $('[data-mini="text"]', mini).textContent = lines.length ? lines.map(function (l) { return l.short; }).join(' + ') : 'Job card: nothing chosen yet';
      $('[data-mini="total"]', mini).textContent = lines.length ? money(totals().total) : '';
      mini.setAttribute('aria-label', 'Show job card' + (lines.length ? ', total ' + money(totals().total) : ''));
    }
    if (mini) mini.addEventListener('click', function () { $('#jobcard-wrap').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); });

    function flash(node) { node.classList.remove('is-flash'); void node.offsetWidth; node.classList.add('is-flash'); }

    openStep(1, { noScroll: true });
    updateCard();

    // Demo hooks (used by the tour only for state a cursor can't reach).
    window.TT = { state: function () { return state; } };
  }

  // Lazy images switch to eager once the page has settled, so fast scrolling never shows gaps.
  window.addEventListener('load', function () { setTimeout(function () { $$('img[loading="lazy"]').forEach(function (i) { i.loading = 'eager'; }); }, 600); });

  renderOpen();
  initMenu();
  initPrices();
  initBooking();
  if (!TOUR) setInterval(renderOpen, 60000);
})();
