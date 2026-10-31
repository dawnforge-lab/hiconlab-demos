/* Dryside memberships: the chooser. Prices come from data.js; it also checks honestly
   whether paying as you go would be cheaper for how often you'll come. */
(function () {
  'use strict';

  var D = window.DS_DATA, U = window.DS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var form = $('[data-chooser]');
  if (!form) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var visits = 8;
  var MIN = 1, MAX = 24;

  function val(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : null; }
  function gbp(n) { return '£' + (Math.round(n * 100) % 100 ? n.toFixed(2) : String(Math.round(n))); }

  function visitsHint(v) {
    if (v <= 2) return 'Now and then.';
    if (v <= 5) return 'About once a week.';
    if (v <= 10) return 'About twice a week.';
    if (v <= 14) return 'About three times a week.';
    if (v <= 19) return 'Four times a week or so.';
    return 'Most days.';
  }

  function render(animate) {
    var want = val('want'), when = val('when'), conc = val('conc');
    var conc_ = conc !== 'none';
    var table = D.prices[want];
    var price = table[(when === 'any' ? 'any' : 'off') + (conc_ ? 'Conc' : '')];
    var name = (want === 'gym' ? 'Gym floor' : 'Gym and classes') + ', ' + (when === 'any' ? 'any time' : 'off-peak');

    $('[data-r-name]').textContent = name + (conc_ ? ' (concession)' : '');
    $('[data-r-price]').innerHTML = '<span class="price-gbp">£</span>' + price;

    var gets = [];
    gets.push(when === 'any' ? 'The gym floor 05:30–23:00, every day, with your fob' : 'The gym floor on weekdays before 16:00, and all weekend');
    if (want === 'classes') gets.push(when === 'any' ? 'As many classes as you like: just book a place' : 'Any class that starts before 16:00 on a weekday, or at the weekend');
    else gets.push('Classes whenever you fancy one, at £' + D.prices.dropIn + ' each on the day');
    gets.push('A free 30-minute plan with a coach in your first month');
    gets.push('Free lockers, showers and the water fountain');
    $('[data-r-gets]').innerHTML = gets.map(function (g) { return '<li><svg aria-hidden="true"><use href="#i-check"/></svg><span>' + g + '</span></li>'; }).join('');

    // Direct Debits go out on the 1st–28th. Join on the 29th–31st and it moves to the 28th,
    // so the first payment runs from today to the day before the next collection.
    var now = U.now();
    var ddDay = Math.min(now.getDate(), 28);
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var nextDd = new Date(now.getFullYear(), now.getMonth() + 1, ddDay);
    var end = U.addDays(nextDd, -1);
    // Joining on the 29th–31st: the first period is a few days short of a month, so it's
    // pro-rated against the full month it would otherwise have been (28th to 27th).
    var dayMs = 86400000;
    var covered = Math.round((nextDd - today) / dayMs);
    var fullMonth = Math.round((nextDd - new Date(now.getFullYear(), now.getMonth(), ddDay)) / dayMs);
    var first = covered < fullMonth ? Math.round(price * covered / fullMonth * 100) / 100 : price;
    var span = now.getDate() + ' ' + U.MONTHS_SHORT[now.getMonth()] + ' to ' + end.getDate() + ' ' + U.MONTHS_SHORT[end.getMonth()];
    $('[data-r-pay]').innerHTML = (first < price
        ? '<strong>' + gbp(first) + ' when you join</strong>, covering ' + span + ' (' + covered + ' days, so less than a full month). Then £' + price + ' by Direct Debit on the 28th of each month. We never collect after the 28th, so every month works the same.'
        : '<strong>£' + price + ' when you join</strong>, covering ' + span + '. Then £' + price + ' by Direct Debit on the ' + ordinal(ddDay) + ' of each month.') +
      ' Nothing else.' +
      (conc_ ? ' Show us your ' + { student: 'student card', sixty: 'bus pass or any ID with your date of birth', benefit: 'award letter' }[conc] + ' once at the desk.' : '');

    // Honest comparison with paying as you go. A ten-class card lasts six months, so it
    // only beats £9 classes if you'd use all ten in that time.
    var how, payg;
    if (want === 'gym') {
      payg = D.prices.dayPass * visits;
      how = visits + (visits === 1 ? ' day pass' : ' day passes') + ' at £' + D.prices.dayPass + ' would cost';
    } else if (visits * 6 >= 10) {
      payg = (D.prices.tenClass / 10) * visits;
      how = visits + (visits === 1 ? ' class' : ' classes') + ' on a ten-class card (£7.50 each) would cost';
    } else {
      payg = D.prices.dropIn * visits;
      how = visits + (visits === 1 ? ' class' : ' classes') + ' at £' + D.prices.dropIn + ' each would cost';
    }
    var v = $('[data-r-verdict]');
    if (payg < price) {
      v.className = 'verdict is-payg';
      v.innerHTML = '<strong>Pay as you go is cheaper for you.</strong> ' + how + ' ' + gbp(payg) + ' a month, against £' + price + '. Join when you’re coming more often.';
    } else if (payg - price < 3) {
      v.className = 'verdict';
      v.innerHTML = '<strong>It’s about even.</strong> ' + how + ' ' + gbp(payg) + ' a month. The membership is worth it if you think you’ll come a bit more.';
    } else {
      v.className = 'verdict';
      v.innerHTML = '<strong>This saves you about ' + gbp(payg - price) + ' a month.</strong> ' + how + ' ' + gbp(payg) + '.';
    }

    $('[data-visits-out]').textContent = visits + (visits === 1 ? ' time' : ' times') + ' a month';
    $('[data-visits-hint]').textContent = visitsHint(visits);
    form.querySelector('[data-visits="-1"]').disabled = visits <= MIN;
    form.querySelector('[data-visits="1"]').disabled = visits >= MAX;

    if (animate && !reduceMotion) {
      var r = $('[data-result]');
      r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash');
    }
  }

  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  form.addEventListener('change', function () { render(true); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  form.addEventListener('click', function (e) {
    var b = e.target.closest('[data-visits]');
    if (!b) return;
    visits = Math.max(MIN, Math.min(MAX, visits + +b.dataset.visits));
    render(true);
  });

  render(false);
})();
