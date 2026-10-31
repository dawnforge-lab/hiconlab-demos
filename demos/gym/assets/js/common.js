/* Dryside: shared helpers for both pages (clock, dates, menu). */
window.DS = (function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var tourOn = !!(window.HiconTour && window.HiconTour.active);

  // In tour mode "now" is pinned to Tuesday 3 November, 11:20, so every recording matches.
  // ?today=2026-11-03T11:20 pins it by hand too.
  function now() {
    var pin = params.get('today') || (tourOn ? '2026-11-03T11:20' : null);
    if (pin) {
      var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(pin);
      if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 9), +(m[5] || 0));
    }
    return new Date();
  }

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; }
  function isoDay(d) { var w = d.getDay(); return w === 0 ? 7 : w; } // 1 = Monday … 7 = Sunday
  function toMins(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }
  function fromMins(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function longDate(d) { return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function shortDate(d) { return DAYS_SHORT[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()]; }

  // UK local wall time → UTC stamp for .ics files (BST runs from 01:00 UTC on the
  // last Sunday in March to 01:00 UTC on the last Sunday in October).
  function lastSunday(year, month) { var d = new Date(Date.UTC(year, month + 1, 0)); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d; }
  function ukToUtc(d, hhmm) {
    var y = d.getFullYear(), mo = d.getMonth(), da = d.getDate(), mins = toMins(hhmm);
    var asUtc = Date.UTC(y, mo, da, Math.floor(mins / 60), mins % 60);
    var start = lastSunday(y, 2).getTime() + 3600e3, end = lastSunday(y, 9).getTime() + 3600e3;
    var bst = asUtc - 3600e3 >= start && asUtc - 3600e3 < end;
    return new Date(asUtc - (bst ? 3600e3 : 0));
  }
  function icsStamp(date) {
    return date.getUTCFullYear() + pad(date.getUTCMonth() + 1) + pad(date.getUTCDate()) + 'T' + pad(date.getUTCHours()) + pad(date.getUTCMinutes()) + '00Z';
  }

  // Mobile menu: a real disclosure, closes on Escape and when a link is used.
  function initMenu() {
    var btn = document.querySelector('[data-menu-btn]');
    var nav = document.querySelector('[data-nav]');
    if (!btn || !nav) return;
    function set(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.classList.toggle('menu-open', open);
      btn.querySelector('span').textContent = open ? 'Close' : 'Menu';
      btn.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
    }
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); }
    });
    window.matchMedia('(min-width: 1080px)').addEventListener('change', function () { set(false); });
  }

  // Header gains a shadow once the page scrolls.
  function initHead() {
    var head = document.querySelector('[data-head]');
    if (!head) return;
    var on = false;
    function check() { var s = window.scrollY > 8; if (s !== on) { on = s; head.classList.toggle('is-scrolled', s); } }
    window.addEventListener('scroll', check, { passive: true });
    check();
  }

  // Opening for a date: closed (with a reason), or the staffed hours that apply.
  function dayInfo(d) {
    var D = window.DS_DATA, key = iso(d);
    if (D.closed[key]) return { closed: D.closed[key] };
    var bank = D.bankHolidays.indexOf(key) !== -1;
    var dn = bank ? 7 : isoDay(d);
    return { closed: null, bank: bank, dayNum: dn, staffed: D.staffed[dn] };
  }
  function nextOpenDay(d) {
    for (var i = 1; i < 14; i++) { var x = addDays(d, i); if (!dayInfo(x).closed) return x; }
    return addDays(d, 1);
  }

  // Highlight today's row in the hours table, or say we're closed today.
  function initHours() {
    var dl = document.querySelector('[data-hours]');
    if (!dl) return;
    var t = now(), info = dayInfo(t);
    if (info.closed) {
      dl.insertAdjacentHTML('beforebegin', '<p class="hours-closed">' + info.closed + ' today. We open again on ' + longDate(nextOpenDay(t)) + '.</p>');
      return;
    }
    var idx = info.dayNum <= 5 ? 0 : info.dayNum === 6 ? 1 : 2;
    var row = dl.children[idx];
    if (row) { row.classList.add('is-today'); row.querySelector('dt').insertAdjacentHTML('beforeend', ' <span class="today-tag">' + (info.bank ? 'today, bank holiday' : 'today') + '</span>'); }
  }

  // iCalendar text: escape, then fold lines at 75 octets (RFC 5545).
  function icsText(t) { return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  function icsFold(line) {
    var enc = new TextEncoder(), out = [], cur = '', size = 0;
    for (var ch of line) {
      var n = enc.encode(ch).length;
      if (size + n > 75) { out.push(cur); cur = ' '; size = 1; }
      cur += ch; size += n;
    }
    out.push(cur);
    return out.join('\r\n');
  }

  document.addEventListener('DOMContentLoaded', function () { initMenu(); initHead(); initHours(); });

  return {
    now: now, iso: iso, addDays: addDays, isoDay: isoDay, toMins: toMins, fromMins: fromMins, pad: pad,
    longDate: longDate, shortDate: shortDate, DAYS: DAYS, DAYS_SHORT: DAYS_SHORT, MONTHS: MONTHS, MONTHS_SHORT: MONTHS_SHORT,
    ukToUtc: ukToUtc, icsStamp: icsStamp, icsText: icsText, icsFold: icsFold, dayInfo: dayInfo, nextOpenDay: nextOpenDay, tourOn: tourOn
  };
})();
