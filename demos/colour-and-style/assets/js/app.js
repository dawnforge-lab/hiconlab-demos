/* Colour & Style recreation: menus, review carousel, FAQ, booking form, and the
   in-place page swap between the two pages (the live Next.js site navigates
   client-side in the same way). Plain script, no dependencies. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  // ---- Smooth scrolling (one eased curve for every in-page jump) ----------

  function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }

  function scrollToY(y) {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var to = Math.max(0, Math.min(max, y));
    var from = window.scrollY;
    var dist = Math.abs(to - from);
    if (reduceMotion || dist < 2) { window.scrollTo(0, to); return; }
    var ms = Math.min(1300, Math.max(450, dist * 0.45));
    var start = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - start) / ms);
      window.scrollTo(0, from + (to - from) * ease(p));
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  function scrollToElement(el) {
    var margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    scrollToY(el.getBoundingClientRect().top + window.scrollY - margin);
  }

  // ---- Services menu (desktop) --------------------------------------------

  function initDropdown() {
    var wrap = document.querySelector('[data-dropdown]');
    if (!wrap) return;
    var btn = wrap.querySelector('button');
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    var closeTimer = null;
    var openedByHover = false;

    function open(byHover) {
      clearTimeout(closeTimer);
      if (!panel.hidden) return;
      openedByHover = !!byHover;
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    }
    function close() {
      clearTimeout(closeTimer);
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      openedByHover = false;
    }

    btn.addEventListener('click', function () {
      if (panel.hidden) open(false);
      else if (openedByHover) openedByHover = false; // a click after hovering keeps it open
      else close();
    });
    if (canHover) {
      wrap.addEventListener('mouseenter', function () { open(true); });
      wrap.addEventListener('mouseleave', function () {
        if (!openedByHover) return;
        closeTimer = setTimeout(close, 140);
      });
    }
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { close(); btn.focus(); }
    });
    wrap.addEventListener('focusout', function (e) {
      if (!wrap.contains(e.relatedTarget)) close();
    });
    document.addEventListener('pointerdown', function (e) {
      if (!panel.hidden && !wrap.contains(e.target)) close();
    });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
  }

  // ---- Mobile menu --------------------------------------------------------

  function initMobileMenu() {
    var btn = document.querySelector('.burger');
    if (!btn) return;
    var menu = document.getElementById(btn.getAttribute('aria-controls'));

    function set(open) {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    btn.addEventListener('click', function () { set(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); }
    });
    document.addEventListener('pointerdown', function (e) {
      if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) set(false);
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900 && !menu.hidden) set(false); });
  }

  // ---- Review carousel ----------------------------------------------------

  function initCarousel(root) {
    var scroller = root.querySelector('[data-carousel]');
    if (!scroller) return;
    var section = scroller.closest('section');
    var prev = section.querySelector('[data-prev]');
    var next = section.querySelector('[data-next]');

    function stepSize() {
      var cards = scroller.querySelectorAll('li');
      if (cards.length < 2) return scroller.clientWidth;
      return cards[1].offsetLeft - cards[0].offsetLeft;
    }
    function update() {
      var max = scroller.scrollWidth - scroller.clientWidth;
      prev.disabled = scroller.scrollLeft <= 2;
      next.disabled = scroller.scrollLeft >= max - 2;
    }
    function go(dir) {
      scroller.scrollBy({ left: dir * stepSize(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    scroller.addEventListener('scroll', update, { passive: true });
    scroller.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    window.addEventListener('resize', update);
    update();
  }

  // ---- FAQ: one answer open at a time, as on the live site ---------------

  function initFaq(root) {
    var list = root.querySelector('[data-faq]');
    if (!list) return;
    var buttons = Array.prototype.slice.call(list.querySelectorAll('.faq-q'));
    function set(btn, open) {
      btn.setAttribute('aria-expanded', String(open));
      document.getElementById(btn.getAttribute('aria-controls')).hidden = !open;
      btn.querySelector('.faq-icon').textContent = open ? '−' : '+';
    }
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var opening = btn.getAttribute('aria-expanded') !== 'true';
        buttons.forEach(function (b) { if (b !== btn) set(b, false); });
        set(btn, opening);
      });
    });
  }

  // ---- Booking form: validates, then shows a success state. Nothing is sent.

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function initBooking(root) {
    var wrap = root.querySelector('[data-booking]');
    if (!wrap) return;
    var form = wrap.querySelector('form');
    var success = wrap.querySelector('.success');
    var submit = form.querySelector('.submit');

    var rules = {
      name: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your name.'; },
      phone: function (v) { return v.replace(/\D/g, '').length >= 10 ? '' : 'Please enter your phone number.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.'; },
    };

    function showError(input, message) {
      var field = input.closest('.field');
      field.classList.toggle('is-invalid', !!message);
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      field.querySelector('.field-error').textContent = message;
    }

    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') showError(input, rules[name](input.value));
      });
      input.addEventListener('blur', function () {
        if (input.value) showError(input, rules[name](input.value));
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(rules).forEach(function (name) {
        var input = form.elements[name];
        var msg = rules[name](input.value);
        showError(input, msg);
        if (msg && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }

      submit.disabled = true;
      submit.textContent = 'Sending…';
      setTimeout(function () {
        var first = form.elements.name.value.trim().split(/\s+/)[0];
        wrap.querySelector('[data-success-title]').textContent = 'Thank you, ' + first + '!';
        var summary = wrap.querySelector('[data-success-summary]');
        summary.innerHTML = '';
        var bits = [form.elements.service.value];
        var d = form.elements.date.value;
        if (d) {
          var parts = d.split('-').map(Number);
          var dt = new Date(parts[0], parts[1] - 1, parts[2]);
          bits.push(DAYS[dt.getDay()] + ' ' + dt.getDate() + ' ' + MONTHS[dt.getMonth()]);
        } else {
          bits.push('Date to arrange');
        }
        bits.forEach(function (b) { var li = document.createElement('li'); li.textContent = b; summary.appendChild(li); });
        // Keep the panel at the form's height so the page does not jump up at the bottom.
        success.style.minHeight = form.offsetHeight + 'px';
        form.hidden = true;
        success.hidden = false;
        success.focus({ preventScroll: true });
        submit.disabled = false;
        submit.textContent = 'Book';
      }, 900);
    });

    wrap.querySelector('[data-reset]').addEventListener('click', function () {
      form.reset();
      Object.keys(rules).forEach(function (name) { showError(form.elements[name], ''); });
      success.hidden = true;
      form.hidden = false;
      form.elements.name.focus();
    });
  }

  function initPage(root) {
    initCarousel(root);
    initFaq(root);
    initBooking(root);
  }

  // ---- Links: inert "#", smooth in-page anchors, in-place page swap ------

  var PAGES = ['index.html', 'colour-analysis.html'];

  function pageOf(url) {
    var file = url.pathname.split('/').pop() || 'index.html';
    return PAGES.indexOf(file) >= 0 ? file : null;
  }

  function currentPage() { return pageOf(new URL(location.href)); }

  // Each history entry remembers its own scroll position, so Back returns to where you were.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var saveTimer = null;
  function saveScroll() {
    var state = Object.assign({}, history.state, { scrollY: window.scrollY });
    history.replaceState(state, '');
  }
  window.addEventListener('scroll', function () {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveScroll, 120);
  }, { passive: true });

  async function swapTo(url, push, restoreY) {
    var res = await fetch(url.href, { credentials: 'same-origin' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    var newMain = doc.querySelector('main');
    var newFooter = doc.querySelector('.site-footer');
    if (!newMain) throw new Error('No main');

    var main = document.querySelector('main');
    main.replaceWith(document.adoptNode(newMain));
    if (newFooter) document.querySelector('.site-footer').innerHTML = newFooter.innerHTML;
    document.title = doc.title;
    document.body.dataset.page = newMain.dataset.page;
    var onService = newMain.dataset.page === 'service';
    document.querySelectorAll('.site-header a[href="colour-analysis.html"]').forEach(function (a) {
      if (onService) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (push) {
      clearTimeout(saveTimer);
      saveScroll();
      history.pushState({ page: pageOf(url), scrollY: 0 }, '', url.pathname + url.search + url.hash);
    }

    initPage(newMain);
    var target = url.hash && newMain.querySelector(url.hash);
    if (typeof restoreY === 'number') {
      window.scrollTo(0, restoreY);
      target = null;
    } else if (target) {
      window.scrollTo(0, 0);
      requestAnimationFrame(function () { scrollToElement(target); });
    } else {
      window.scrollTo(0, 0);
    }
    newMain.classList.add('is-entering');
    var h1 = newMain.querySelector('h1');
    if (h1 && !target && typeof restoreY !== 'number') { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');

    if (href === '#') { e.preventDefault(); return; }

    var url = new URL(href, location.href);
    if (url.origin !== location.origin) return;
    var page = pageOf(url);
    var samePage = href.charAt(0) === '#' || (page && page === currentPage());

    if (a.dataset.bookService) {
      document.querySelectorAll('select[name="service"]').forEach(function (s) { s.value = a.dataset.bookService; });
    }

    if (samePage) {
      e.preventDefault();
      if (url.hash) {
        var target = document.querySelector(url.hash);
        if (target) {
          scrollToElement(target);
          history.replaceState(history.state, '', url.hash);
        }
      } else {
        scrollToY(0);
      }
      return;
    }

    if (page) {
      e.preventDefault();
      swapTo(url, true).catch(function () { location.href = url.href; });
    }
  });

  window.addEventListener('popstate', function (e) {
    var y = e.state && typeof e.state.scrollY === 'number' ? e.state.scrollY : 0;
    swapTo(new URL(location.href), false, y).catch(function () { location.reload(); });
  });

  initDropdown();
  initMobileMenu();
  initPage(document);
})();
