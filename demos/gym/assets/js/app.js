/* Dryside homepage: this week's timetable, filters, booking and the hero's "today" board. */
(function () {
  'use strict';

  var D = window.DS_DATA, U = window.DS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NOW = U.now();
  var TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  var nowMins = NOW.getHours() * 60 + NOW.getMinutes();

  // ---- Sessions for the next seven days ------------------------------------

  // Places already taken. A few classes are set by hand so the week has a believable
  // shape (busy evenings, a full Barbell Club, quiet mornings); the rest come from a
  // small deterministic hash so they never jump about between visits.
  var setByHand = {
    '1 18:30': 5, '2 12:30': 9, '2 19:00': 9, '2 10:00': 6, '3 18:30': 8, '4 18:00': 4,
    '4 19:00': 10, '4 06:30': 6, '4 10:00': 7, '6 09:30': 5, '1 19:30': 11
  };
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }

  var days = [];
  for (var i = 0; i < 7; i++) {
    var d = U.addDays(TODAY, i), key = U.iso(d);
    var closedNote = D.closed[key] || null;
    var bank = D.bankHolidays.indexOf(key) !== -1;
    var dayNum = bank ? 7 : U.isoDay(d);
    var sessions = closedNote ? [] : D.week[dayNum].map(function (slot) {
      var cls = D.classes[slot[1]];
      var hand = setByHand[dayNum + ' ' + slot[0]];
      var taken = hand != null ? hand : Math.round(cls.cap * Math.max(0.2, 0.35 + hash(dayNum + slot[0] + slot[1]) * 0.6 - i * 0.05));
      var start = U.toMins(slot[0]);
      return {
        id: key + '-' + slot[0].replace(':', '') + '-' + slot[1],
        date: d, dayIndex: i, time: slot[0], end: U.fromMins(start + cls.mins),
        classId: slot[1], cls: cls, coachId: slot[2], coach: D.coaches[slot[2]],
        cap: cls.cap, taken: Math.min(cls.cap, taken),
        past: i === 0 && start <= nowMins
      };
    });
    days.push({ date: d, key: key, closed: closedNote, bank: bank, staffed: closedNote ? null : D.staffed[dayNum], sessions: sessions });
  }
  var byId = {};
  days.forEach(function (day) { day.sessions.forEach(function (s) { byId[s.id] = s; }); });

  var bookings = {};   // session id → { ref, kind, name, waitlist }
  function left(s) { return Math.max(0, s.cap - s.taken); }

  // ---- Filters ----------------------------------------------------------------

  var state = { day: 0, type: null, coach: null, first: false };

  function matches(s) {
    return (!state.type || s.cls.type === state.type) &&
           (!state.coach || s.coachId === state.coach) &&
           (!state.first || s.cls.first);
  }

  var daysEl = $('[data-days]'), listEl = $('[data-list]'), summaryEl = $('[data-summary]');
  var typeChips = $('[data-type-chips]'), coachChips = $('[data-coach-chips]');
  var firstToggle = $('[data-first-toggle]'), clearBtn = $('[data-clear]');

  function renderDays() {
    daysEl.innerHTML = days.map(function (day, i) {
      var n = day.sessions.filter(function (s) { return matches(s) && !s.past; }).length;
      var name = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : U.DAYS_SHORT[day.date.getDay()];
      var count = day.closed ? 'Closed' : n === 0 ? 'Nothing' : n + (n === 1 ? ' class' : ' classes');
      return '<button class="day' + (n === 0 ? ' is-empty' : '') + '" type="button" role="tab" id="day-' + i + '" data-day="' + i + '"' +
        ' aria-selected="' + (i === state.day) + '" aria-controls="tt-panel" tabindex="' + (i === state.day ? 0 : -1) + '">' +
        '<span class="day-name">' + name + '</span>' +
        '<span class="day-date">' + (i < 2 ? U.DAYS_SHORT[day.date.getDay()] + ' ' : '') + day.date.getDate() + ' ' + U.MONTHS_SHORT[day.date.getMonth()] + '</span>' +
        '<span class="day-count">' + count + '</span></button>';
    }).join('');
  }

  function renderChips() {
    typeChips.innerHTML = '<button class="chip" type="button" data-type="" aria-pressed="' + !state.type + '">All</button>' +
      Object.keys(D.types).map(function (k) {
        var t = D.types[k];
        return '<button class="chip" type="button" data-type="' + k + '" aria-pressed="' + (state.type === k) + '">' +
          '<span class="plate plate--sm plate--' + t.colour + '" data-n="' + t.plate + '" aria-hidden="true"></span>' + t.label + '</button>';
      }).join('');
    coachChips.innerHTML = '<button class="chip" type="button" data-coach="" aria-pressed="' + !state.coach + '">Anyone</button>' +
      Object.keys(D.coaches).map(function (k) {
        var c = D.coaches[k];
        return '<button class="chip chip--coach" type="button" data-coach="' + k + '" aria-pressed="' + (state.coach === k) + '">' +
          '<img src="assets/img/' + c.img + '-96.webp" width="48" height="48" alt="">' + c.first + '</button>';
      }).join('');
    firstToggle.checked = state.first;
    clearBtn.hidden = !(state.type || state.coach || state.first);
  }

  function tiles(s) {
    var out = '', taken = s.taken;
    for (var i = 0; i < s.cap; i++) out += '<i class="' + (i < taken ? 'is-taken' : '') + (bookings[s.id] && !bookings[s.id].waitlist && i === taken - 1 ? ' is-you' : '') + '"></i>';
    return out;
  }

  function spacesText(s) {
    var n = left(s);
    if (s.past) return 'Finished';
    if (n === 0) return 'Full';
    if (n <= 2) return (n === 1 ? 'Last place' : 'Last 2 places');
    return n + ' places left';
  }

  function rowHtml(s, idx) {
    var t = D.types[s.cls.type], b = bookings[s.id], n = left(s);
    var action;
    if (b) action = '<span class="booked-tag"><svg aria-hidden="true"><use href="#i-check"/></svg>' + (b.waitlist ? 'On the waiting list' : 'You’re booked') + '</span>';
    else if (s.past) action = '<span class="muted-tag">Finished</span>';
    else if (n === 0) action = '<button class="btn btn--line btn--sm" type="button" data-book="' + s.id + '" aria-label="Join the waiting list for ' + esc(s.cls.name) + ' at ' + s.time + '">Waiting list</button>';
    else action = '<button class="btn btn--primary btn--sm" type="button" data-book="' + s.id + '" aria-label="Book ' + esc(s.cls.name) + ' at ' + s.time + '">Book</button>';
    return '<li class="row' + (s.past ? ' is-past' : '') + (b ? ' is-booked' : '') + '" data-id="' + s.id + '" style="--i:' + idx + '">' +
      '<div class="row-time"><span class="row-start">' + s.time + '</span><span class="row-dur">' + s.cls.mins + ' min, until ' + s.end + '</span></div>' +
      '<span class="plate plate--' + t.colour + '" data-n="' + t.plate + '" aria-hidden="true"></span>' +
      '<div class="row-main"><h3 class="row-name">' + esc(s.cls.name) + '</h3>' +
        '<p class="row-meta"><img src="assets/img/' + s.coach.img + '-96.webp" width="28" height="28" alt="">with ' + s.coach.first +
        '<span class="row-type">' + t.label + '</span>' + (s.cls.first ? '<span class="tag-first">Good first session</span>' : '') + '</p>' +
        '<p class="row-blurb">' + esc(s.cls.blurb) + '</p></div>' +
      (s.past ? '<div class="row-spaces"></div>' :
      '<div class="row-spaces' + (n > 0 && n <= 2 ? ' is-low' : '') + (n === 0 ? ' is-full' : '') + '">' +
        '<span class="tiles-row" aria-hidden="true">' + tiles(s) + '</span><span class="sp-text">' + spacesText(s) + '</span>' +
        '<span class="visually-hidden">, ' + s.taken + ' of ' + s.cap + ' places taken</span></div>') +
      '<div class="row-act">' + action + '</div></li>';
  }

  function render(animate) {
    var day = days[state.day];
    $('[data-panel]').setAttribute('aria-labelledby', 'day-' + state.day);
    var list = day.sessions.filter(matches);
    var label = state.day === 0 ? 'Today, ' + U.longDate(day.date) : U.longDate(day.date);
    if (day.closed) {
      summaryEl.textContent = label + ': ' + day.closed + '.';
      var reopen = U.nextOpenDay(day.date);
      listEl.innerHTML = '<li class="empty"><p><strong>' + day.closed + '.</strong> ' + (day.date.getMonth() === 11 ? 'Happy Christmas from all of us. ' : 'Happy New Year from all of us. ') +
        'Classes start again on ' + U.longDate(reopen) + '.</p></li>';
    } else if (!list.length) {
      summaryEl.textContent = label + ': nothing matches.';
      var other = days.map(function (dd, i) { return { i: i, n: dd.sessions.filter(function (s) { return matches(s) && !s.past; }).length, d: dd }; }).filter(function (x) { return x.n && x.i !== state.day; })[0];
      listEl.innerHTML = '<li class="empty"><p><strong>Nothing matches ' + (state.day === 0 ? 'today' : 'on ' + U.DAYS[day.date.getDay()]) + '.</strong> ' +
        (other ? 'Try <button class="link-btn" type="button" data-goto="' + other.i + '">' + U.DAYS[other.d.date.getDay()] + '</button>, which has ' + other.n + (other.n === 1 ? ' class that fits' : ' classes that fit') + ', or <button class="link-btn" type="button" data-clear-inline>clear the filters</button>.'
          : 'Nothing this week fits all of those. <button class="link-btn" type="button" data-clear-inline>Clear the filters</button> to see every class.') + '</p></li>';
    } else {
      var open = list.filter(function (s) { return !s.past; }).length;
      summaryEl.textContent = label + (day.bank ? ' (bank holiday, Sunday timetable)' : '') + ': ' + list.length + (list.length === 1 ? ' class' : ' classes') + (open === 0 ? ', all finished' : open < list.length ? ', ' + open + ' still to come' : '') + '.';
      listEl.innerHTML = list.map(rowHtml).join('');
    }
    listEl.classList.remove('is-entering');
    if (animate && !reduceMotion) { void listEl.offsetWidth; listEl.classList.add('is-entering'); }
  }

  function update(animate) { renderDays(); renderChips(); render(animate); }

  daysEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-day]'); if (!b) return;
    state.day = +b.dataset.day; update(true);
    $('#day-' + state.day).focus({ preventScroll: true });
  });
  daysEl.addEventListener('keydown', function (e) {
    var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (e.key === 'Home') dir = -state.day; if (e.key === 'End') dir = 6 - state.day;
    if (!dir) return;
    e.preventDefault();
    state.day = Math.max(0, Math.min(6, state.day + dir)); update(true);
    $('#day-' + state.day).focus();
  });
  typeChips.addEventListener('click', function (e) {
    var b = e.target.closest('[data-type]'); if (!b) return;
    state.type = b.dataset.type || null; update(true);
    $('[data-type="' + (state.type || '') + '"]').focus({ preventScroll: true });
  });
  coachChips.addEventListener('click', function (e) {
    var b = e.target.closest('[data-coach]'); if (!b) return;
    state.coach = b.dataset.coach || null; update(true);
    $('[data-coach="' + (state.coach || '') + '"]').focus({ preventScroll: true });
  });
  firstToggle.addEventListener('change', function () { state.first = firstToggle.checked; update(true); });
  function clearAll() { state.type = null; state.coach = null; state.first = false; update(true); }
  clearBtn.addEventListener('click', function () { clearAll(); $('[data-type=""]').focus(); });
  listEl.addEventListener('click', function (e) {
    var g = e.target.closest('[data-goto]');
    if (g) { state.day = +g.dataset.goto; update(true); $('#day-' + state.day).focus(); return; }
    if (e.target.closest('[data-clear-inline]')) { clearAll(); $('[data-type=""]').focus(); return; }
    var b = e.target.closest('[data-book]');
    if (b) openBooking(byId[b.dataset.book], b);
  });

  // "Book a free session" links turn on the first-session filter, then scroll as normal.
  $$('[data-first-only]').forEach(function (a) {
    a.addEventListener('click', function () { state.first = true; state.type = null; state.coach = null; update(false); });
  });

  // ---- Booking dialog -------------------------------------------------------------

  var dlg = $('dialog[data-book-dialog]');
  var bodyEl = $('[data-bk-body]');
  var bk = null; // { s, step, kind, fields, opener }

  function whenText(s) { return U.longDate(s.date) + ', ' + s.time + '–' + s.end + ' · with ' + s.coach.first; }

  function openBooking(s, opener) {
    if (!s || bookings[s.id] || s.past) return;
    bk = { s: s, step: 1, kind: null, fields: {}, opener: opener, waitlist: left(s) === 0 };
    var t = D.types[s.cls.type];
    var plate = $('[data-bk-plate]');
    plate.className = 'plate plate--' + t.colour; plate.setAttribute('data-n', t.plate);
    $('[data-bk-title]').textContent = (bk.waitlist ? 'Waiting list: ' : '') + s.cls.name;
    $('[data-bk-when]').textContent = whenText(s);
    renderStep();
    dlg.showModal();
    var first = bodyEl.querySelector('input, button');
    if (first) first.focus();
  }

  function closeBooking() { if (dlg.open) dlg.close(); }
  dlg.addEventListener('close', function () {
    var o = bk && bk.opener;
    var id = bk && bk.s.id;
    bk = null;
    // Return focus to the row's action, or the row itself once it has been booked.
    var target = (o && document.body.contains(o)) ? o : id ? ($('[data-id="' + id + '"] .row-act button') || $('[data-id="' + id + '"] .booked-tag')) : null;
    if (target) { if (!target.matches('button, a')) target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  });
  $('[data-bk-close]').addEventListener('click', closeBooking);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeBooking(); });

  // Membership plans a member can book with, and what a class costs them.
  var PLANS = {
    'classes-any': { label: 'Gym and classes, any time' },
    'classes-off': { label: 'Gym and classes, off-peak' },
    'gym': { label: 'Gym floor' }
  };
  function offPeak(s) { var dn = days[s.dayIndex].bank ? 7 : U.isoDay(s.date); return dn >= 6 || U.toMins(s.time) < 16 * 60; }
  // What a booking costs: a long line for the ticket and a short one for summaries.
  function priceFor(kind, plan, s, waitlist) {
    if (waitlist) return { text: 'Nothing to pay unless a place opens', short: 'Nothing to pay yet' };
    if (kind === 'first') return { text: 'Free first session', short: 'Free first session' };
    if (kind === 'member') {
      if (plan === 'classes-any' || (plan === 'classes-off' && offPeak(s))) return { text: 'Included in your membership', short: 'Included' };
      if (plan === 'classes-off') return { text: '£' + D.prices.dropIn + ' at the desk (off-peak covers classes before 16:00 on weekdays, and weekends)', short: '£' + D.prices.dropIn + ' at the desk' };
      return { text: '£' + D.prices.dropIn + ' at the desk (Gym floor doesn’t include classes)', short: '£' + D.prices.dropIn + ' at the desk' };
    }
    return { text: '£' + D.prices.dropIn + ' at the desk, card or cash', short: '£' + D.prices.dropIn + ' at the desk' };
  }
  // One arrival line per booking type, used in the confirmation, the hero card and the .ics.
  function arrival(kind, plan, s) {
    if (kind === 'first') return 'Come 10 minutes early and ring the bell at the old ticket window. ' + s.coach.first + ' will meet you and show you round.';
    if (kind === 'member') {
      var pays = priceFor(kind, plan, s).short !== 'Included';
      return 'Doors open 15 minutes before. Tap your fob at the door' + (pays ? ' and pay £' + D.prices.dropIn + ' at the desk.' : '.');
    }
    return 'Doors open 15 minutes before. Pay £' + D.prices.dropIn + ' at the desk as you come in, card or cash.';
  }

  // One free first session per person, matched on email or mobile.
  var firstUsed = {};
  function normMobile(m) { return (m || '').replace(/[\s()-]/g, '').replace(/^\+44/, '0'); }

  function renderStep() {
    var s = bk.s;
    if (bk.step === 1) {
      var canFirst = s.cls.first;
      var firstAlt = days.reduce(function (acc, dd) { return acc.concat(dd.sessions.filter(function (x) { return x.cls.first && x.cls.type === s.cls.type && !x.past && left(x) > 0; })); }, [])[0];
      bodyEl.innerHTML =
        '<form class="bk-form" data-step1 novalidate>' +
        '<fieldset class="bk-choices"><legend class="bk-q">Who’s coming?</legend>' +
        choice('bk-kind', 'first', canFirst ? 'It’s my first time at Dryside' : 'It’s my first time', canFirst ? 'Free, once per person. ' + s.coach.first + ' will meet you at the door.' : 'This class isn’t a first session.' + (firstAlt ? ' Try ' + firstAlt.cls.name + ', ' + U.shortDate(firstAlt.date) + ' at ' + firstAlt.time + '.' : ''), !canFirst) +
        choice('bk-kind', 'member', 'I’m a member', 'Tell us which membership, so we show the right price.') +
        '<fieldset class="bk-plans" data-plans hidden><legend class="bk-plans-q">Which membership?</legend>' +
          Object.keys(PLANS).map(function (k) { return choice('bk-plan', k, PLANS[k].label, priceFor('member', k, s, bk.waitlist).short, false, true); }).join('') +
        '</fieldset>' +
        choice('bk-kind', 'payg', 'Pay as I go', '£' + D.prices.dropIn + ', paid at the desk on the day, card or cash.') +
        '</fieldset><p class="field-error" data-err-kind hidden>Choose one to carry on.</p>' +
        '<div class="bk-actions"><button class="btn btn--primary" type="submit" data-bk-next>Continue</button></div></form>';
      var form1 = $('[data-step1]');
      var syncPlans = function () {
        var k = form1.querySelector('input[name="bk-kind"]:checked');
        $('[data-plans]').hidden = !(k && k.value === 'member');
      };
      form1.addEventListener('change', function () { syncPlans(); $('[data-err-kind]').hidden = true; });
      form1.addEventListener('submit', function (e) {
        e.preventDefault();
        var picked = form1.querySelector('input[name="bk-kind"]:checked');
        var plan = form1.querySelector('input[name="bk-plan"]:checked');
        var err = $('[data-err-kind]');
        if (!picked) { err.textContent = 'Choose one to carry on.'; err.hidden = false; form1.querySelector('input[name="bk-kind"]:not(:disabled)').focus(); return; }
        if (picked.value === 'member' && !plan) { err.textContent = 'Choose your membership so we can show the right price.'; err.hidden = false; form1.querySelector('input[name="bk-plan"]').focus(); return; }
        bk.kind = picked.value; bk.plan = picked.value === 'member' ? plan.value : null; bk.step = 2; renderStep();
        $('#bk-first').focus();
      });
      if (bk.kind) { var r = form1.querySelector('input[value="' + bk.kind + '"]'); if (r && !r.disabled) r.checked = true; }
      if (bk.plan) { var rp = form1.querySelector('input[value="' + bk.plan + '"]'); if (rp) rp.checked = true; }
      syncPlans();
    } else if (bk.step === 2) {
      var f = bk.fields;
      bodyEl.innerHTML =
        '<form class="bk-form" data-step2 novalidate>' +
        '<p class="bk-q">Your details</p>' +
        '<div class="field-row">' + field('bk-first', 'First name', 'text', 'given-name', f.first) + field('bk-last', 'Last name', 'text', 'family-name', f.last) + '</div>' +
        '<div class="field-row">' + field('bk-mobile', 'Mobile', 'tel', 'tel', f.mobile, 'For your confirmation text.') + field('bk-email', 'Email', 'email', 'email', f.email) + '</div>' +
        (bk.kind === 'first' ? '<div class="field"><label for="bk-notes">Anything ' + s.coach.first + ' should know? <span class="opt">(optional)</span></label>' +
          '<textarea id="bk-notes" rows="2" aria-describedby="bk-notes-hint">' + esc(f.notes || '') + '</textarea>' +
          '<p class="hint" id="bk-notes-hint">Injuries, health conditions, nerves. It stays between you and ' + s.coach.first + '.</p></div>' : '') +
        '<label class="check"><input type="checkbox" id="bk-age"' + (f.age ? ' checked' : '') + ' aria-describedby="bk-age-err"><span class="check-box" aria-hidden="true"><svg><use href="#i-check"/></svg></span><span>I’m 16 or over</span></label>' +
        '<p class="field-error" id="bk-age-err" hidden>Classes are for 16 and over. Under-16s can come to Saturday Circuits with a parent.</p>' +
        '<div class="bk-foot"><div class="bk-sum">' + summaryLine() + '</div>' +
        '<div class="bk-actions"><button class="btn btn--line" type="button" data-bk-back><svg aria-hidden="true"><use href="#i-back"/></svg>Back</button>' +
        '<button class="btn btn--primary" type="submit" data-bk-next>' + (bk.waitlist ? 'Join the waiting list' : 'Confirm booking') + '</button></div></div></form>';
      $('[data-bk-back]').addEventListener('click', function () { keepFields(); bk.step = 1; renderStep(); bodyEl.querySelector('input[name="bk-kind"]:checked').focus(); });
      $('[data-step2]').addEventListener('submit', function (e) { e.preventDefault(); keepFields(); if (validate()) confirm(); });
    } else {
      renderDone();
    }
  }

  function choice(name, value, title, sub, disabled, small) {
    return '<label class="choice' + (disabled ? ' is-disabled' : '') + (small ? ' choice--sub' : '') + '"><input type="radio" name="' + name + '" value="' + value + '"' + (disabled ? ' disabled' : '') + '>' +
      '<span class="choice-dot" aria-hidden="true"></span><span class="choice-text"><span class="choice-title">' + title + '</span><span class="choice-sub">' + sub + '</span></span></label>';
  }
  function field(id, label, type, ac, val, hint) {
    return '<div class="field"><label for="' + id + '">' + label + '</label>' +
      '<input id="' + id + '" type="' + type + '" autocomplete="' + ac + '" value="' + esc(val || '') + '" aria-describedby="' + id + '-err' + (hint ? ' ' + id + '-hint' : '') + '"' + (type === 'tel' ? ' inputmode="tel"' : '') + '>' +
      (hint ? '<p class="hint" id="' + id + '-hint">' + hint + '</p>' : '') +
      '<p class="field-error" id="' + id + '-err" hidden></p></div>';
  }
  function summaryLine() {
    return '<span>' + esc(bk.s.cls.name) + ', ' + U.shortDate(bk.s.date) + ' at ' + bk.s.time + '</span><strong>' + priceFor(bk.kind, bk.plan, bk.s, bk.waitlist).short + '</strong>';
  }
  function keepFields() {
    ['first', 'last', 'mobile', 'email', 'notes'].forEach(function (k) { var el = $('#bk-' + k); if (el) bk.fields[k] = el.value.trim(); });
    var age = $('#bk-age'); if (age) bk.fields.age = age.checked;
  }
  function setErr(id, msg) {
    var input = $('#' + id), err = $('#' + id + '-err');
    if (input && input.type !== 'checkbox') input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) { err.hidden = !msg; if (msg) err.textContent = msg; }
    return !msg;
  }
  function validate() {
    var f = bk.fields, ok = true, firstBad = null;
    function check(id, msg) { var good = setErr(id, msg); if (!good && !firstBad) firstBad = id; ok = ok && good; }
    check('bk-first', f.first ? '' : 'Tell us your first name.');
    check('bk-last', f.last ? '' : 'Tell us your last name.');
    var mob = normMobile(f.mobile), mail = (f.email || '').toLowerCase();
    var mobOk = /^07\d{9}$/.test(mob), mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
    var used = bk.kind === 'first' && ((mobOk && firstUsed['m:' + mob]) || (mailOk && firstUsed['e:' + mail]));
    check('bk-mobile', mobOk ? '' : f.mobile ? 'That doesn’t look like a UK mobile number. It should start 07 and have 11 digits.' : 'We need a mobile number to text your confirmation.');
    check('bk-email', !mailOk ? (f.email ? 'Check the email address; it needs an @ and a dot.' : 'Tell us your email address.')
      : used ? 'You’ve already booked your free first session (' + used + '). Go back and choose pay as you go for this one.' : '');
    var ageErr = $('#bk-age-err'); ageErr.hidden = !!f.age; if (!f.age) { ok = false; if (!firstBad) firstBad = 'bk-age'; }
    if (firstBad) $('#' + firstBad).focus();
    return ok;
  }

  function makeRef() {
    if (U.tourOn) return 'DS-7Q4K';
    var chars = 'ACDEFHJKMNPRTUVWXY3479', out = '', a = new Uint32Array(4);
    (window.crypto || window.msCrypto).getRandomValues(a);
    for (var i = 0; i < 4; i++) out += chars[a[i] % chars.length];
    return 'DS-' + out;
  }

  function confirm() {
    var s = bk.s;
    var btn = $('[data-bk-next]');
    btn.disabled = true; btn.classList.add('is-busy'); btn.textContent = bk.waitlist ? 'Adding you…' : 'Booking…';
    setTimeout(function () {
      if (!bk) return;
      var ref = makeRef();
      var position = bk.waitlist ? 1 + Math.floor(hash(s.id) * 3) : null;
      if (!bk.waitlist) s.taken += 1;
      if (bk.kind === 'first') {
        var label = ref + ', ' + U.shortDate(s.date);
        firstUsed['m:' + normMobile(bk.fields.mobile)] = label;
        firstUsed['e:' + bk.fields.email.toLowerCase()] = label;
      }
      bookings[s.id] = { ref: ref, kind: bk.kind, plan: bk.plan, name: bk.fields.first, waitlist: bk.waitlist, position: position, mobile: bk.fields.mobile };
      bk.step = 3; renderDone();
      update(false);
      renderToday();
      var h = $('#bk-done-title'); if (h) h.focus();
    }, reduceMotion ? 200 : 700);
  }

  function renderDone() {
    var s = bk.s, b = bookings[s.id];
    bodyEl.innerHTML =
      '<div class="bk-done">' +
      '<div class="bk-done-head"><span class="bk-tick" aria-hidden="true"><svg><use href="#i-check"/></svg></span>' +
      '<h3 id="bk-done-title" tabindex="-1">' + (b.waitlist ? 'You’re number ' + b.position + ' on the waiting list, ' + esc(b.name) : 'You’re booked in, ' + esc(b.name)) + '</h3></div>' +
      '<dl class="ticket">' +
        '<div><dt>Class</dt><dd>' + esc(s.cls.name) + '</dd></div>' +
        '<div><dt>When</dt><dd>' + U.longDate(s.date) + ', ' + s.time + '–' + s.end + '</dd></div>' +
        '<div><dt>Coach</dt><dd>' + s.coach.name + '</dd></div>' +
        '<div><dt>Price</dt><dd>' + priceFor(b.kind, b.plan, s, b.waitlist).text + '</dd></div>' +
        '<div class="ticket-ref"><dt>Reference</dt><dd>' + b.ref + '</dd></div>' +
      '</dl>' +
      '<h4 class="bk-next-title">What happens next</h4><ul class="bk-next">' +
      (b.waitlist
        ? '<li>If a place opens up to 2 hours before, we’ll text ' + esc(b.mobile) + ' and hold it for you for an hour.</li><li>Nothing to pay unless you get a place.</li>'
        : '<li>We’ve texted your confirmation to ' + esc(b.mobile) + ', with a reminder the day before.</li>' +
          '<li>' + arrival(b.kind, b.plan, s) + '</li>' +
          '<li>Bring trainers, water and something comfy. Lockers are free.</li>' +
          '<li>Can’t make it? Reply CANCEL to the text up to 2 hours before. No charge.</li>') +
      '</ul>' +
      '<div class="bk-actions">' + (b.waitlist ? '' : '<button class="btn btn--line" type="button" data-ics><svg aria-hidden="true"><use href="#i-calendar"/></svg>Add to calendar</button>') +
      '<button class="btn btn--primary" type="button" data-bk-done>Done</button></div></div>';
    $('[data-bk-done]').addEventListener('click', closeBooking);
    var ics = $('[data-ics]'); if (ics) ics.addEventListener('click', function () { downloadIcs(s, b); });
  }

  function downloadIcs(s, b) {
    var start = U.ukToUtc(s.date, s.time), end = U.ukToUtc(s.date, s.end);
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dryside//Timetable//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:' + b.ref + '-' + s.id + '@dryside.example', 'DTSTAMP:' + U.icsStamp(new Date()), 'DTSTART:' + U.icsStamp(start), 'DTEND:' + U.icsStamp(end),
      'SUMMARY:' + U.icsText(s.cls.name + ' at Dryside'), 'LOCATION:' + U.icsText('Dryside, The Old Baths, Kenmore Row, Leicester LE2 0ZZ'),
      'DESCRIPTION:' + U.icsText('With ' + s.coach.first + '. Reference ' + b.ref + '. ' + priceFor(b.kind, b.plan, s).text + '. ' + arrival(b.kind, b.plan, s)),
      'END:VEVENT', 'END:VCALENDAR'].map(U.icsFold);
    var blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'dryside-' + s.classId + '-' + U.iso(s.date) + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  // ---- The hero's board -----------------------------------------------------------
  // Shows the first open day with classes still to come (today, tomorrow or later),
  // with that day's staffed hours, and says so when the gym is closed today.

  function dayLabel(i) {
    var d = days[i].date;
    var name = U.DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + U.MONTHS[d.getMonth()];
    return i === 0 ? 'Today, ' + name : i === 1 ? 'Tomorrow, ' + name : name;
  }
  function renderToday() {
    var label = $('[data-today-label]'), body = $('[data-today-body]');
    var mine = Object.keys(bookings).map(function (id) { return byId[id]; }).filter(function (s) { return !bookings[s.id].waitlist; })
      .sort(function (a, b) { return a.dayIndex - b.dayIndex || U.toMins(a.time) - U.toMins(b.time); })[0];
    if (mine) {
      var b = bookings[mine.id];
      label.textContent = 'Your booking';
      var ce = $('[data-today-closed]'); if (ce) ce.hidden = true;
      body.innerHTML = '<div class="today-booked">' + plateHtml(mine.cls.type) +
        '<div><p class="today-class">' + esc(mine.cls.name) + '</p><p class="today-when">' + U.longDate(mine.date) + ', ' + mine.time + '–' + mine.end + '</p>' +
        '<p class="today-ref">With ' + mine.coach.first + ' · ' + priceFor(b.kind, b.plan, mine).short + ' · ref ' + b.ref + '</p></div></div>' +
        '<p class="today-note">' + arrival(b.kind, b.plan, mine) + '</p>';
      $('[data-today]').classList.add('is-booked');
      return;
    }
    var idx = -1, list = [];
    for (var i = 0; i < days.length; i++) {
      if (days[i].closed) continue;
      list = days[i].sessions.filter(function (s) { return !s.past && left(s) > 0; });
      if (list.length) { idx = i; break; }
    }
    var closedEl = $('[data-today-closed]');
    if (!closedEl) { label.insertAdjacentHTML('beforebegin', '<p class="today-closed" data-today-closed hidden></p>'); closedEl = $('[data-today-closed]'); }
    closedEl.hidden = !days[0].closed;
    if (days[0].closed) closedEl.textContent = days[0].closed + ' today. Here’s what’s on when we open again.';
    var closedNote = '';
    if (idx < 0) { label.textContent = 'This week'; body.innerHTML = '<p class="today-line">Every class this week is full. Join a waiting list below.</p>'; return; }
    label.textContent = dayLabel(idx);
    var st = days[idx].staffed;
    body.innerHTML = closedNote + '<ul class="today-list">' + list.slice(0, 3).map(function (s) {
      return '<li><button class="today-row" type="button" data-today-book="' + s.id + '">' +
        '<span class="today-time">' + s.time + '</span>' + plateHtml(s.cls.type, true) +
        '<span class="today-what"><span class="today-class">' + esc(s.cls.name) + '</span> with ' + s.coach.first + '</span>' +
        '<span class="today-left">' + left(s) + ' left</span></button></li>';
    }).join('') + '</ul>' +
      '<p class="today-desk"><svg aria-hidden="true"><use href="#i-clock"/></svg>Desk ' + st[0] + '–' + st[1] + (days[idx].bank ? ' (bank holiday)' : '') + ' · members 05:30–23:00</p>';
  }

  function plateHtml(type, small) {
    var t = D.types[type];
    return '<span class="plate' + (small ? ' plate--sm' : '') + ' plate--' + t.colour + '" data-n="' + t.plate + '" aria-hidden="true"></span>';
  }
  $('[data-today]').addEventListener('click', function (e) {
    var b = e.target.closest('[data-today-book]');
    if (b) openBooking(byId[b.dataset.todayBook], b);
  });

  // Open on today, unless everything today has finished.
  for (var di = 0; di < days.length && (days[di].closed || !days[di].sessions.some(function (s) { return !s.past; })); di++) {}
  state.day = di < days.length ? di : 0;
  // Links from the Memberships page ask for first sessions only.
  if (new URLSearchParams(location.search).get('first') === '1') state.first = true;
  update(false);
  renderToday();

  // Hooks for the tour.
  window.DS_APP = { state: state, update: update, days: days };
})();
