/* KreativeHub recreation: the behaviour the live site has.
   - FAQ accordion: one answer open at a time, and every answer can be closed.
   - Mobile menu: a full-screen dialog with focus trap, Escape and backdrop close.
   - Moving between the two pages swaps the page in place, the way the live Next.js site
     navigates, so the tour can carry on from the homepage to the SEO page in one take.
   Everything uses event delegation, so it keeps working after a page swap. */
(function () {
  'use strict';

  var PAGES = ['index.html', 'seo.html'];

  /* ---------- FAQ ---------- */
  function initFaq(root) {
    root.querySelectorAll('.faq__item').forEach(function (item, i) {
      var q = item.querySelector('.faq__q');
      var a = item.querySelector('.faq__a');
      if (!q || !a) return;
      var id = 'faq-a-' + (i + 1);
      a.id = id;
      a.setAttribute('role', 'region');
      q.setAttribute('aria-controls', id);
      a.hidden = false;
      a.setAttribute('aria-hidden', item.dataset.open === 'true' ? 'false' : 'true');
    });
  }

  function toggleFaq(item) {
    var open = item.dataset.open !== 'true';
    item.closest('.faq').querySelectorAll('.faq__item').forEach(function (other) {
      var on = other === item && open;
      other.dataset.open = on ? 'true' : 'false';
      other.querySelector('.faq__q').setAttribute('aria-expanded', on ? 'true' : 'false');
      other.querySelector('.faq__a').setAttribute('aria-hidden', on ? 'false' : 'true');
    });
  }

  /* ---------- Mobile menu ---------- */
  var lastFocus = null;

  function menuEl() { return document.getElementById('kh-menu'); }

  function openMenu() {
    var menu = menuEl();
    if (!menu) return;
    lastFocus = document.activeElement;
    menu.hidden = false;
    document.body.classList.add('menu-open');
    var burger = document.querySelector('.kh-nav__burger');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    menu.querySelector('.kh-menu__close').focus();
  }

  function closeMenu() {
    var menu = menuEl();
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    document.body.classList.remove('menu-open');
    var burger = document.querySelector('.kh-nav__burger');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  function trapFocus(e) {
    var menu = menuEl();
    if (!menu || menu.hidden || e.key !== 'Tab') return;
    var items = menu.querySelectorAll('a[href], button');
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Page swap between the two pages ---------- */
  function pageOf(href) {
    var file = href.split(/[?#]/)[0].split('/').pop() || 'index.html';
    return PAGES.indexOf(file) >= 0 ? file : null;
  }

  function currentPage() {
    return pageOf(location.pathname) || 'index.html';
  }

  function swapIn(doc, scrollY) {
    ['.kh-nav', '#kh-menu', 'main', '.kh-foot'].forEach(function (sel) {
      var now = document.querySelector(sel);
      var next = doc.querySelector(sel);
      if (now && next) now.replaceWith(document.importNode(next, true));
    });
    document.title = doc.title;
    var desc = doc.querySelector('meta[name="description"]');
    var mine = document.querySelector('meta[name="description"]');
    if (desc && mine) mine.setAttribute('content', desc.getAttribute('content'));
    initFaq(document);
    window.scrollTo(0, scrollY || 0);
  }

  // Forward navigation starts at the top; Back and Forward return to where the page was left.
  function go(file, push, scrollY) {
    return fetch(file, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        if (push) {
          clearTimeout(saveTimer);
          history.replaceState(Object.assign({}, history.state, { scrollY: window.scrollY }), '');
          history.pushState({ page: file, scrollY: 0 }, '', file + location.search);
        }
        swapIn(doc, push ? 0 : scrollY);
        var main = document.querySelector('main');
        if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }); }
        window.dispatchEvent(new CustomEvent('kh:page', { detail: { page: file } }));
      })
      .catch(function () { location.href = file + location.search; });
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', function (e) {
    var q = e.target.closest('.faq__q');
    if (q) { toggleFaq(q.closest('.faq__item')); return; }

    if (e.target.closest('.kh-nav__burger')) { openMenu(); return; }
    if (e.target.closest('.kh-menu__close')) { closeMenu(); return; }
    var menu = menuEl();
    if (menu && !menu.hidden && e.target === menu) { closeMenu(); return; }

    var a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var href = a.getAttribute('href');
    if (href === '#') { e.preventDefault(); closeMenu(); return; }
    if (href.charAt(0) === '#') return; // in-page anchors such as the skip link
    var file = pageOf(href);
    if (!file) return;
    e.preventDefault();
    closeMenu();
    if (file === currentPage()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    go(file, true);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
    trapFocus(e);
  });

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.addEventListener('popstate', function (e) {
    clearTimeout(saveTimer);
    go(currentPage(), false, e.state && e.state.scrollY);
  });
  // Keep each history entry's scroll position up to date, so Back and Forward land where the page was left.
  var saveTimer = 0;
  window.addEventListener('scroll', function () {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      history.replaceState(Object.assign({}, history.state, { scrollY: window.scrollY }), '');
    }, 150);
  }, { passive: true });
  if (history.state && history.state.scrollY) window.scrollTo(0, history.state.scrollY);

  // Close the menu if the viewport grows past the mobile breakpoint.
  window.matchMedia('(min-width: 1025px)').addEventListener('change', function (m) { if (m.matches) closeMenu(); });

  initFaq(document);
  window.KH = { go: go };
})();
