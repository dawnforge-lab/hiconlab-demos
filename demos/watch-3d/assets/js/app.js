/* Page behaviour that does not need WebGL: loader, section track, dial and strap
   choices, the reserve form and the still-image fallback. The 3D stage lives in
   scene.js and talks to this file through window.Fenwright and two events. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DIAL_NAMES = { mersey: 'Mersey', fell: 'Fell', salt: 'Salt' };
  var STRAP_NAMES = { chestnut: 'chestnut calf', black: 'black calf', oxblood: 'oxblood cordovan' };
  var state = { dial: 'mersey', strap: 'chestnut', fallback: false };

  // ---- Ready promise for the tour --------------------------------------------
  var resolveReady;
  var ready = new Promise(function (r) { resolveReady = r; });
  if (window.HiconTour) window.HiconTour.ready(function () { return ready; });

  // ---- Loader: sixty ticks fill like a minute track ---------------------------
  var loader = document.getElementById('loader');
  var tickSvg = loader.querySelector('.loader__ticks');
  var pct = loader.querySelector('.loader__pct');
  var ticks = [];
  for (var i = 0; i < 60; i++) {
    var a = (i / 60) * Math.PI * 2;
    var five = i % 5 === 0;
    var r0 = five ? 47 : 50, r1 = 55;
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (60 + Math.sin(a) * r0).toFixed(2));
    line.setAttribute('y1', (60 - Math.cos(a) * r0).toFixed(2));
    line.setAttribute('x2', (60 + Math.sin(a) * r1).toFixed(2));
    line.setAttribute('y2', (60 - Math.cos(a) * r1).toFixed(2));
    if (five) line.setAttribute('class', 'is-five');
    tickSvg.appendChild(line);
    ticks.push(line);
  }
  function progress(p) {
    var n = Math.round(p * 60);
    ticks.forEach(function (t, j) { t.classList.toggle('is-on', j < n); });
    pct.textContent = Math.round(p * 100) + '%';
  }
  function loaded() {
    root.classList.add('is-loaded');
    loader.setAttribute('aria-busy', 'false');
    pct.textContent = '';
    loader.querySelector('.loader__text').firstChild.nodeValue = 'Ready';
    setTimeout(function () { loader.hidden = true; }, reduced ? 50 : 1200);
  }

  // ---- Fallback: still images rendered from the same scene ------------------
  var still = document.getElementById('still');
  var currentPose = 'hero';
  function stillFor(pose) {
    if (pose === 'back') return { src: 'assets/img/still-back.webp', alt: 'The back of the P39, showing Calibre FW-1 through the sapphire caseback' };
    if (pose === 'exploded') return { src: 'assets/img/still-exploded.webp', alt: 'The P39 taken apart: crystal, bezel, hands, dial, case, crown, movement, rotor and caseback' };
    return { src: 'assets/img/still-front-' + state.dial + '.webp', alt: 'The Fenwright P39 with the ' + DIAL_NAMES[state.dial] + ' dial on a ' + STRAP_NAMES.chestnut + ' strap' };
  }
  function showStill() {
    if (!state.fallback) return;
    var s = stillFor(currentPose);
    if (still.getAttribute('src') !== s.src) still.src = s.src;
    still.alt = s.alt;
    root.dataset.pose = currentPose;
  }
  function useFallback() {
    state.fallback = true;
    root.classList.add('no-webgl', 'is-loaded');
    loader.hidden = true;
    still.hidden = false;
    showStill();
    resolveReady();
  }

  // ---- Section track and active pose --------------------------------------------
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-pose]'));
  var fill = document.querySelector('.track__fill');
  var trackLinks = Array.prototype.slice.call(document.querySelectorAll('[data-track]'));
  // On wide screens each section's copy fades in once its pose has settled and out
  // as it leaves, so the watch never passes through words on its way between poses.
  var phone = window.matchMedia('(max-width: 760px), (orientation: portrait) and (max-width: 1024px)');
  var faders = sections.map(function (s) { return { section: s, els: s.querySelectorAll('.copy, .facts') }; });
  function fadeCopy() {
    var vh = window.innerHeight;
    faders.forEach(function (f) {
      var o = 1;
      if (!phone.matches) {
        var r = f.section.getBoundingClientRect();
        var a = Math.min(1, Math.max(0, (0.52 * vh - r.top) / (0.36 * vh)));
        var b = Math.min(1, Math.max(0, (r.bottom - 0.3 * vh) / (0.3 * vh)));
        o = Math.min(a, b);
      }
      f.els.forEach(function (el) {
        var oe = o;
        // Copy that scrolls away is gone before it reaches the masthead.
        if (!phone.matches && !el.classList.contains('copy--sticky')) {
          var top = el.getBoundingClientRect().top;
          oe = Math.min(oe, Math.max(0, (top - 0.04 * vh) / (0.12 * vh)));
        }
        el.style.setProperty('--copy-o', oe.toFixed(3));
      });
    });
  }

  function onScroll() {
    fadeCopy();
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    fill.style.setProperty('--p', p.toFixed(4));
    var mid = window.innerHeight * 0.5;
    var active = sections[0];
    sections.forEach(function (s) { if (s.getBoundingClientRect().top <= mid) active = s; });
    trackLinks.forEach(function (l) {
      var on = l.dataset.track === active.id;
      l.classList.toggle('is-active', on);
      if (on) l.setAttribute('aria-current', 'location'); else l.removeAttribute('aria-current');
    });
    root.classList.toggle('is-scrolled', window.scrollY > 40);
    if (active.dataset.pose !== currentPose) {
      currentPose = active.dataset.pose;
      showStill();
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // ---- Dial and strap -------------------------------------------------------------
  var choice = document.getElementById('choice');
  var formDial = document.getElementById('r-dial');
  var formStrap = document.getElementById('r-strap');
  function setDial(key, from) {
    if (!DIAL_NAMES[key]) return;
    state.dial = key;
    var radio = document.querySelector('input[name="dial"][value="' + key + '"]');
    if (radio && !radio.checked) radio.checked = true;
    if (formDial.value !== key) formDial.value = key;
    updateChoice();
    window.dispatchEvent(new CustomEvent('fenwright:dial', { detail: { key: key, from: from } }));
    showStill();
  }
  function setStrap(key, from) {
    if (!STRAP_NAMES[key]) return;
    state.strap = key;
    var radio = document.querySelector('input[name="strap"][value="' + key + '"]');
    if (radio && !radio.checked) radio.checked = true;
    if (formStrap.value !== key) formStrap.value = key;
    updateChoice();
    window.dispatchEvent(new CustomEvent('fenwright:strap', { detail: { key: key, from: from } }));
  }
  function updateChoice() {
    choice.textContent = DIAL_NAMES[state.dial] + ' dial on ' + STRAP_NAMES[state.strap];
  }
  document.querySelectorAll('input[name="dial"]').forEach(function (r) {
    r.addEventListener('change', function () { if (r.checked) setDial(r.value, 'swatch'); });
  });
  document.querySelectorAll('input[name="strap"]').forEach(function (r) {
    r.addEventListener('change', function () { if (r.checked) setStrap(r.value, 'swatch'); });
  });
  formDial.addEventListener('change', function () { setDial(formDial.value, 'form'); });
  formStrap.addEventListener('change', function () { setStrap(formStrap.value, 'form'); });

  // ---- Reserve form (nothing is sent) ------------------------------------------------
  var form = document.getElementById('reserve-form');
  var done = document.getElementById('reserved');
  function fieldError(input, show) {
    var err = document.getElementById(input.id + '-error');
    input.setAttribute('aria-invalid', show ? 'true' : 'false');
    if (show) input.setAttribute('aria-describedby', err.id);
    err.hidden = !show;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements.name, email = form.elements.email;
    var badName = !name.value.trim();
    var badEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    fieldError(name, badName);
    fieldError(email, badEmail);
    if (badName || badEmail) { (badName ? name : email).focus(); return; }
    var first = name.value.trim().split(/\s+/)[0];
    document.getElementById('reserved-title').textContent = 'Thank you, ' + first + '.';
    document.getElementById('reserved-text').textContent =
      'We have put you down for a P39 with the ' + DIAL_NAMES[formDial.value] + ' dial on ' + STRAP_NAMES[formStrap.value] +
      '. We will email ' + email.value.trim() + ' within two working days to arrange the deposit. Nothing has been charged.';
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });

  window.Fenwright = {
    progress: progress,
    loaded: loaded,
    useFallback: useFallback,
    ready: ready,
    resolveReady: function () { resolveReady(); },
    setDial: setDial,
    setStrap: setStrap,
  };
})();
